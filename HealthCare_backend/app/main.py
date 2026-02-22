from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import uuid
from datetime import datetime, timezone
from typing import List

from .schemas import MedicalReport
from .db import init_db, insert_report, fetch_reports, fetch_report_by_id, delete_report
from .ai import analyze_report_text

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()

@app.get("/reports", response_model=List[MedicalReport])
def list_reports():
    return fetch_reports()

@app.get("/reports/{report_id}", response_model=MedicalReport)
def get_report(report_id: str):
    r = fetch_report_by_id(report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return r

@app.delete("/reports/{report_id}")
def remove_report(report_id: str):
    ok = delete_report(report_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True}

@app.post("/analyze-report", response_model=MedicalReport)
async def analyze_report(file: UploadFile = File(...)):
    # 1) Extract text from PDF
    extracted_text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    extracted_text += t + "\n"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in PDF (try a different PDF).")

    # 2) Analyze (your ai.py should return a dict with keys: flags, summary, results)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    report_id = f"r-{uuid.uuid4().hex[:8]}"

    try:
        analysis = analyze_report_text(extracted_text)  # MUST return dict
        flags = analysis.get("flags", [])
        summary = analysis.get("summary", "")
        results = analysis.get("results", [])
        status = "analyzed"
    except Exception as e:
        # still save the report record as failed
        flags = ["AI analysis failed"]
        summary = f"Analysis error: {str(e)}"
        results = []
        status = "failed"

    report = {
        "id": report_id,
        "name": file.filename or "uploaded.pdf",
        "uploadedAt": now,
        "status": status,
        "flags": flags,
        "summary": summary,
        "results": results,
    }

    # 3) Persist to SQLite
    insert_report(report)

    return report
