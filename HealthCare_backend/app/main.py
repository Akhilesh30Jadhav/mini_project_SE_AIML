from dotenv import load_dotenv
load_dotenv()

import json
import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import re, io

from .db import (
    init_db, create_user, get_user_by_email, get_user_by_id,
    upsert_patient_profile, get_patient_profile, create_doctor_profile,
    list_patients, list_doctors,
    create_lab_report, add_lab_results, get_lab_reports,
    create_lifestyle_assessment, get_lifestyle_history,
    create_symptom_check, get_symptom_history,
    create_mental_assessment, get_mental_history,
    create_chronic_log, get_chronic_history,
    create_meal_plan, get_latest_meal_plan,
    book_appointment, cancel_appointment, get_booked_slots,
    get_patient_appointments, get_doctor_appointments, is_slot_taken,
    store_refresh_token, get_refresh_token, delete_refresh_token,
    get_dashboard_summary,
)
from .auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user, require_role,
)
from .schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    PatientProfileUpdate,
    LabReportCreate, LabReportOut, LabResultOut,
    LifestyleSubmit, LifestyleOut,
    SymptomCheckRequest, SymptomCheckOut,
    MentalAssessmentSubmit, MentalAssessmentOut,
    ChronicLogCreate, ChronicLogOut,
    DietPreferences, DietPlanOut,
    AppointmentBook, AppointmentCancel, AppointmentOut,
    ChatRequest, ChatResponse,
)

# ─── Config Loading ───────────────────────────────────────────────────────────

CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "config")

def _load(name: str) -> dict:
    with open(os.path.join(CONFIG_DIR, name), encoding="utf-8") as f:
        return json.load(f)

LAB_RANGES = _load("lab_ranges.json")["ranges"]
LIFESTYLE_CFG = _load("lifestyle_scoring.json")
TRIAGE_CFG = _load("symptom_triage.json")
MENTAL_CFG = _load("mental_scoring.json")
CHRONIC_CFG = _load("chronic_thresholds.json")["blood_pressure"]
DIET_CFG = _load("diet_food_map.json")

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="CareSphere Healthcare API", version="2.0.0")

_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
_CORS_ORIGINS = os.getenv("CORS_ORIGINS", _DEFAULT_ORIGINS).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _startup():
    init_db()
    # Auto-seed demo accounts (safe to call repeatedly — skips if exists)
    _seed_demo_accounts()


def _seed_demo_accounts():
    """Create demo patient and doctor accounts if they don't exist."""
    import bcrypt
    demos = [
        {"email": "patient@demo.com", "name": "Demo Patient", "role": "patient"},
        {"email": "doctor@demo.com", "name": "Dr. Demo", "role": "doctor"},
    ]
    for demo in demos:
        if not get_user_by_email(demo["email"]):
            hashed = bcrypt.hashpw("demo1234".encode(), bcrypt.gensalt()).decode()
            create_user({
                "id": _uid(), "email": demo["email"], "name": demo["name"],
                "role": demo["role"], "hashed_password": hashed, "created_at": _now(),
            })
            print(f"  ✅ Seeded {demo['role']}: {demo['email']}")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid() -> str:
    return str(uuid.uuid4())


# ─── Scoring Engines ──────────────────────────────────────────────────────────

def classify_lab_result(test_name: str, value: float, unit: Optional[str]):
    """Classify a single lab result against reference ranges."""
    ref = LAB_RANGES.get(test_name)
    if not ref:
        return "unknown", None, None, None, None
    low = ref.get("low")
    high = ref.get("high")
    if low is not None and value < low:
        status = "low"
    elif high is not None and value > high:
        status = "high"
    else:
        status = "normal"
    return status, low, high, ref.get("deficiency_name"), ref.get("explanation")


def compute_lifestyle_score(answers: dict) -> tuple[int, str]:
    """Compute lifestyle score (0-100) and category from answers dict."""
    questions = {q["id"]: q for q in LIFESTYLE_CFG["questions"]}
    total_points = 0
    max_possible = sum(max(o["points"] for o in q["options"]) for q in LIFESTYLE_CFG["questions"])
    for q_id, answer_value in answers.items():
        q = questions.get(q_id)
        if not q:
            continue
        opt = next((o for o in q["options"] if o["value"] == answer_value), None)
        if opt:
            total_points += opt["points"]
    score = round((total_points / max_possible) * 100) if max_possible > 0 else 0
    category = "Lazy"
    for cat in LIFESTYLE_CFG["categories"]:
        if cat["min"] <= score <= cat["max"]:
            category = cat["label"]
            break
    return score, category


def compute_triage(symptoms: List[str], severity: int, duration: str) -> tuple[int, str]:
    """Compute triage score and level."""
    sym_map = {s["id"]: s for s in TRIAGE_CFG["symptoms"]}
    base = sum(sym_map[s]["base_score"] for s in symptoms if s in sym_map)
    sev_mult = TRIAGE_CFG["follow_up_multipliers"]["severity"].get(str(severity), 1.0)
    dur_mult = TRIAGE_CFG["follow_up_multipliers"]["duration_days"].get(duration, 1.0)
    # Red flag: any single red flag symptom auto-escalates to at least Medium
    has_red_flag = any(sym_map.get(s, {}).get("red_flag") for s in symptoms)
    score = int(base * sev_mult * dur_mult)
    if has_red_flag and score < 21:
        score = 21
    thresholds = TRIAGE_CFG["triage_thresholds"]
    if score <= thresholds["low"]["max"]:
        level = "Low"
    elif score <= thresholds["medium"]["max"]:
        level = "Medium"
    else:
        level = "High"
    return score, level


def compute_mental_severity(assessment_type: str, score: int) -> tuple[str, Optional[str]]:
    """Compute severity bucket and optional safety message."""
    cfg = MENTAL_CFG[assessment_type]
    severity = "Unknown"
    for bucket in cfg["severity_buckets"]:
        if bucket["min"] <= score <= bucket["max"]:
            severity = bucket["label"]
            break
    safety_msg = None
    if score >= cfg["safety_threshold"]:
        safety_msg = cfg["safety_message"]
    return severity, safety_msg


def classify_bp(systolic: int, diastolic: int) -> tuple[bool, str, str]:
    """Return (flagged, label, guidance) for blood pressure."""
    cats = CHRONIC_CFG["categories"]
    # Check from most severe to least
    for cat in reversed(cats):
        s_min = cat.get("systolic_min", 0)
        s_max = cat.get("systolic_max", 999)
        d_min = cat.get("diastolic_min", 0)
        d_max = cat.get("diastolic_max", 999)
        if systolic >= s_min and diastolic >= d_min:
            return cat["flag"], cat["label"], CHRONIC_CFG["guidance"][cat["label"]]
    return False, "Normal", CHRONIC_CFG["guidance"]["Normal"]


def generate_diet_plan(deficiencies: List[str], preferences: DietPreferences) -> dict:
    """Build a diet plan dict based on detected deficiencies and preferences."""
    food_map = DIET_CFG["deficiency_foods"]
    meal_tpl = DIET_CFG["meal_template_skeleton"]
    recommendations = {}
    for d in deficiencies:
        if d in food_map:
            recommendations[d] = food_map[d]
    # Adjust meal template for vegetarians/vegans
    adjusted_meals = {}
    for day, meals in meal_tpl.items():
        adjusted_meals[day] = {}
        for meal_time, meal_text in meals.items():
            text = meal_text
            if preferences.diet_type == "veg":
                text = text.replace("Red meat (lean)", "Paneer").replace("chicken", "paneer").replace("fish", "tofu").replace("Chicken", "Paneer").replace("Fish", "Tofu").replace("Salmon", "Tofu").replace("Grilled chicken", "Grilled paneer").replace("mutton", "mushroom").replace("Mutton", "Mushroom")
            elif preferences.diet_type == "vegan":
                text = text.replace("Red meat (lean)", "Tofu").replace("chicken", "tofu").replace("fish", "tofu").replace("Chicken", "Tofu").replace("Fish", "Tofu").replace("Egg", "Flaxseed").replace("egg", "flaxseed").replace("dairy", "plant-based").replace("yogurt", "coconut yogurt").replace("raita", "cucumber salad").replace("milk", "oat milk").replace("paneer", "tofu").replace("Paneer", "Tofu").replace("boiled egg", "sprouts").replace("Mutton", "Jackfruit").replace("mutton", "jackfruit")
            adjusted_meals[day][meal_time] = text
    return {
        "meal_plan": adjusted_meals,
        "deficiency_recommendations": recommendations,
        "preferences": {"diet_type": preferences.diet_type, "allergies": preferences.allergies, "goal": preferences.goal},
    }


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.role not in ("patient", "doctor"):
        raise HTTPException(status_code=400, detail="Role must be 'patient' or 'doctor'")

    user_id = _uid()
    now = _now()
    create_user({
        "id": user_id, "name": req.name, "email": req.email,
        "password_hash": hash_password(req.password),
        "role": req.role, "created_at": now,
    })
    if req.role == "doctor":
        create_doctor_profile({"user_id": user_id, "specialization": req.specialization or "General Practice", "created_at": now})
    else:
        upsert_patient_profile({"user_id": user_id, "updated_at": now})

    access_token = create_access_token(user_id, req.role, req.name)
    refresh_token, expires_at = create_refresh_token(user_id)
    store_refresh_token(refresh_token, user_id, expires_at)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, role=req.role, name=req.name, user_id=user_id)


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    user = get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(user["id"], user["role"], user["name"])
    refresh_token, expires_at = create_refresh_token(user["id"])
    store_refresh_token(refresh_token, user["id"], expires_at)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, role=user["role"], name=user["name"], user_id=user["id"])


@app.post("/auth/refresh", response_model=TokenResponse)
def refresh_token_endpoint(req: RefreshRequest):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    stored = get_refresh_token(req.refresh_token)
    if not stored:
        raise HTTPException(status_code=401, detail="Refresh token not found or revoked")
    user = get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    delete_refresh_token(req.refresh_token)
    new_access = create_access_token(user["id"], user["role"], user["name"])
    new_refresh, expires_at = create_refresh_token(user["id"])
    store_refresh_token(new_refresh, user["id"], expires_at)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh, role=user["role"], name=user["name"], user_id=user["id"])


@app.post("/auth/logout")
def logout(req: RefreshRequest):
    delete_refresh_token(req.refresh_token)
    return {"ok": True}


# ─── Patient Profile ──────────────────────────────────────────────────────────

@app.get("/patient/profile")
def get_profile(current_user=Depends(require_role("patient"))):
    profile = get_patient_profile(current_user["id"]) or {}
    return {"user_id": current_user["id"], "name": current_user["name"], "email": current_user["email"], **profile}


@app.put("/patient/profile")
def update_profile(req: PatientProfileUpdate, current_user=Depends(require_role("patient"))):
    upsert_patient_profile({
        "user_id": current_user["id"],
        "age": req.age, "gender": req.gender,
        "height_cm": req.height_cm, "weight_kg": req.weight_kg,
        "updated_at": _now(),
    })
    return {"ok": True}


# ─── Lab Reports ──────────────────────────────────────────────────────────────

@app.post("/patient/labs/report", response_model=LabReportOut, status_code=201)
def create_report(req: LabReportCreate, current_user=Depends(require_role("patient"))):
    report_id = _uid()
    now = _now()
    create_lab_report({"id": report_id, "patient_id": current_user["id"], "report_date": req.report_date, "created_at": now})
    results_out = []
    deficiencies = []
    result_rows = []
    for item in req.results:
        status, ref_low, ref_high, def_name, explanation = classify_lab_result(item.test_name, item.value, item.unit)
        res_id = _uid()
        result_rows.append({
            "id": res_id, "report_id": report_id, "test_name": item.test_name,
            "value": item.value, "unit": item.unit, "status": status,
            "ref_range_low": ref_low, "ref_range_high": ref_high,
        })
        results_out.append(LabResultOut(
            id=res_id, report_id=report_id, test_name=item.test_name,
            value=item.value, unit=item.unit, status=status,
            ref_range_low=ref_low, ref_range_high=ref_high,
            deficiency_name=def_name if status == "low" else None,
            explanation=explanation if status in ("low", "high") else None,
        ))
        if status == "low" and def_name:
            deficiencies.append(def_name)
    add_lab_results(result_rows)
    return LabReportOut(id=report_id, patient_id=current_user["id"], report_date=req.report_date,
                        created_at=now, results=results_out, deficiency_summary=deficiencies)


# ─── PDF Lab Report Upload ────────────────────────────────────────────────────

# Aliases map common lab report names to our canonical test names
_TEST_ALIASES: dict[str, str] = {}
for _canonical in LAB_RANGES:
    _TEST_ALIASES[_canonical.lower()] = _canonical
# Add common aliases
_EXTRA_ALIASES = {
    "haemoglobin": "Hemoglobin", "hgb": "Hemoglobin", "hb": "Hemoglobin",
    "white blood cell": "WBC", "white blood cells": "WBC", "wbc count": "WBC", "total wbc": "WBC",
    "red blood cell": "RBC", "red blood cells": "RBC", "rbc count": "RBC", "total rbc": "RBC",
    "platelet count": "Platelets", "plt": "Platelets",
    "hct": "Hematocrit", "packed cell volume": "Hematocrit", "pcv": "Hematocrit",
    "mean corpuscular volume": "MCV",
    "fasting glucose": "Glucose (Fasting)", "fasting blood sugar": "Glucose (Fasting)",
    "blood sugar fasting": "Glucose (Fasting)", "fbs": "Glucose (Fasting)", "glucose fasting": "Glucose (Fasting)",
    "glycated hemoglobin": "HbA1c", "glycated haemoglobin": "HbA1c", "hba1c": "HbA1c",
    "total cholesterol": "Total Cholesterol", "cholesterol total": "Total Cholesterol", "cholesterol": "Total Cholesterol",
    "ldl cholesterol": "LDL", "ldl-c": "LDL", "low density lipoprotein": "LDL",
    "hdl cholesterol": "HDL", "hdl-c": "HDL", "high density lipoprotein": "HDL",
    "triglyceride": "Triglycerides", "tg": "Triglycerides",
    "serum creatinine": "Creatinine", "creat": "Creatinine",
    "egfr": "eGFR", "gfr": "eGFR", "glomerular filtration rate": "eGFR",
    "blood urea": "Urea", "bun": "Urea", "blood urea nitrogen": "Urea", "urea nitrogen": "Urea",
    "serum sodium": "Sodium", "na": "Sodium", "na+": "Sodium",
    "serum potassium": "Potassium", "k": "Potassium", "k+": "Potassium",
    "serum calcium": "Calcium", "ca": "Calcium", "total calcium": "Calcium",
    "vit d": "Vitamin D", "vitamin d3": "Vitamin D", "25-oh vitamin d": "Vitamin D",
    "25 hydroxy vitamin d": "Vitamin D", "25(oh)d": "Vitamin D",
    "vit b12": "Vitamin B12", "b12": "Vitamin B12", "cyanocobalamin": "Vitamin B12",
    "serum iron": "Iron", "fe": "Iron",
    "serum ferritin": "Ferritin",
    "thyroid stimulating hormone": "TSH", "tsh ultrasensitive": "TSH",
    "sgpt": "ALT", "alanine aminotransferase": "ALT", "alanine transaminase": "ALT",
    "sgot": "AST", "aspartate aminotransferase": "AST", "aspartate transaminase": "AST",
}
for _alias, _canonical in _EXTRA_ALIASES.items():
    _TEST_ALIASES[_alias.lower()] = _canonical

# Build sorted alias list (longest first so longer aliases match before shorter ones)
_SORTED_ALIASES = sorted(_TEST_ALIASES.keys(), key=len, reverse=True)


def _parse_lab_values_from_text(text: str) -> list[dict]:
    """Extract lab test names and values from free-form lab report text."""
    results = []
    seen = set()
    lines = text.split("\n")
    for line in lines:
        line_lower = line.lower().strip()
        if not line_lower:
            continue
        for alias in _SORTED_ALIASES:
            if alias in line_lower:
                canonical = _TEST_ALIASES[alias]
                if canonical in seen:
                    continue
                # Find numeric values in the rest of the line after the alias
                idx = line_lower.index(alias)
                after = line[idx + len(alias):]
                numbers = re.findall(r"(\d+\.?\d*)", after)
                if numbers:
                    value = float(numbers[0])
                    ref = LAB_RANGES.get(canonical, {})
                    results.append({
                        "test_name": canonical,
                        "value": value,
                        "unit": ref.get("unit", ""),
                    })
                    seen.add(canonical)
                break  # Only match the first alias per line
    return results


@app.post("/patient/labs/upload", status_code=201)
async def upload_lab_report(file: UploadFile = File(...), current_user=Depends(require_role("patient"))):
    """Upload a PDF blood report and automatically extract & analyze lab values."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    try:
        import pdfplumber
        content = await file.read()
        pdf_file = io.BytesIO(content)
        text = ""
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the PDF. Please ensure it's a valid blood report.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from this PDF. It may be a scanned image — try a digital report.")

    # Parse lab values from extracted text
    parsed = _parse_lab_values_from_text(text)
    if not parsed:
        raise HTTPException(status_code=400, detail="No recognizable lab tests found in the PDF. Supported tests include: Hemoglobin, WBC, RBC, Glucose, HbA1c, Cholesterol, Vitamin D, B12, Iron, TSH, and more.")

    # Save and classify (reuse same logic as manual entry)
    report_id = _uid()
    now = _now()
    report_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    create_lab_report({"id": report_id, "patient_id": current_user["id"], "report_date": report_date, "created_at": now})

    results_out = []
    deficiencies = []
    result_rows = []
    for item in parsed:
        lab_status, ref_low, ref_high, def_name, explanation = classify_lab_result(item["test_name"], item["value"], item.get("unit"))
        res_id = _uid()
        result_rows.append({
            "id": res_id, "report_id": report_id, "test_name": item["test_name"],
            "value": item["value"], "unit": item.get("unit", ""), "status": lab_status,
            "ref_range_low": ref_low, "ref_range_high": ref_high,
        })
        results_out.append(LabResultOut(
            id=res_id, report_id=report_id, test_name=item["test_name"],
            value=item["value"], unit=item.get("unit", ""), status=lab_status,
            ref_range_low=ref_low, ref_range_high=ref_high,
            deficiency_name=def_name if lab_status == "low" else None,
            explanation=explanation if lab_status in ("low", "high") else None,
        ))
        if lab_status == "low" and def_name:
            deficiencies.append(def_name)
    add_lab_results(result_rows)
    return LabReportOut(id=report_id, patient_id=current_user["id"], report_date=report_date,
                        created_at=now, results=results_out, deficiency_summary=deficiencies)


@app.get("/patient/labs")
def list_labs(current_user=Depends(require_role("patient"))):
    reports = get_lab_reports(current_user["id"])
    # Enrich with deficiency_summary
    for rpt in reports:
        rpt["deficiency_summary"] = [
            LAB_RANGES.get(r["test_name"], {}).get("deficiency_name", r["test_name"])
            for r in rpt.get("results", []) if r["status"] == "low"
            and LAB_RANGES.get(r["test_name"], {}).get("deficiency_name")
        ]
    return reports


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/patient/dashboard/summary")
def dashboard_summary(current_user=Depends(require_role("patient"))):
    return get_dashboard_summary(current_user["id"])


# ─── Lifestyle ────────────────────────────────────────────────────────────────

@app.post("/patient/lifestyle", status_code=201)
def submit_lifestyle(req: LifestyleSubmit, current_user=Depends(require_role("patient"))):
    score, category = compute_lifestyle_score(req.answers)
    assessment_id = _uid()
    create_lifestyle_assessment({
        "id": assessment_id, "patient_id": current_user["id"],
        "answers": req.answers, "score": score, "category": category, "created_at": _now(),
    })
    return {"id": assessment_id, "score": score, "category": category}


@app.get("/patient/lifestyle")
def get_lifestyle(current_user=Depends(require_role("patient"))):
    return get_lifestyle_history(current_user["id"])


# ─── Symptom Checker ──────────────────────────────────────────────────────────

@app.post("/patient/symptoms/check", status_code=201)
def check_symptoms(req: SymptomCheckRequest, current_user=Depends(require_role("patient"))):
    score, level = compute_triage(req.symptoms, req.severity, req.duration)
    guidance = TRIAGE_CFG["guidance"][level]
    check_id = _uid()
    create_symptom_check({
        "id": check_id, "patient_id": current_user["id"],
        "symptoms": req.symptoms, "score": score, "triage_level": level,
        "severity": req.severity, "duration": req.duration, "created_at": _now(),
    })
    return SymptomCheckOut(id=check_id, score=score, triage_level=level, guidance=guidance,
                           symptoms=req.symptoms, created_at=_now())


@app.get("/patient/symptoms/history")
def symptom_history(current_user=Depends(require_role("patient"))):
    return get_symptom_history(current_user["id"])


# ─── Mental Wellness ──────────────────────────────────────────────────────────

def _submit_mental(assessment_type: str, req: MentalAssessmentSubmit, current_user: dict):
    cfg = MENTAL_CFG[assessment_type]
    expected = len(cfg["questions"])
    if len(req.answers) != expected:
        raise HTTPException(status_code=400, detail=f"{assessment_type.upper()} requires {expected} answers")
    score = sum(req.answers)
    max_score = expected * 3
    if not (0 <= score <= max_score):
        raise HTTPException(status_code=400, detail="Answer values must be 0-3")
    severity, safety_msg = compute_mental_severity(assessment_type, score)
    a_id = _uid()
    create_mental_assessment({
        "id": a_id, "patient_id": current_user["id"], "type": assessment_type,
        "score": score, "severity": severity, "answers": req.answers, "created_at": _now(),
    })
    return MentalAssessmentOut(id=a_id, type=assessment_type, score=score, severity=severity,
                               created_at=_now(), safety_message=safety_msg)


@app.post("/patient/mental/phq9", response_model=MentalAssessmentOut, status_code=201)
def phq9(req: MentalAssessmentSubmit, current_user=Depends(require_role("patient"))):
    return _submit_mental("phq9", req, current_user)


@app.post("/patient/mental/gad7", response_model=MentalAssessmentOut, status_code=201)
def gad7(req: MentalAssessmentSubmit, current_user=Depends(require_role("patient"))):
    return _submit_mental("gad7", req, current_user)


@app.get("/patient/mental/history")
def mental_history(type: Optional[str] = None, current_user=Depends(require_role("patient"))):
    return get_mental_history(current_user["id"], type)


# ─── Chronic Tracker (Blood Pressure) ────────────────────────────────────────

@app.post("/patient/chronic", status_code=201)
def log_chronic(req: ChronicLogCreate, current_user=Depends(require_role("patient"))):
    flagged, label, guidance = classify_bp(req.systolic, req.diastolic)
    log_id = _uid()
    create_chronic_log({
        "id": log_id, "patient_id": current_user["id"], "type": "blood_pressure",
        "value": {"systolic": req.systolic, "diastolic": req.diastolic},
        "flagged": flagged, "flag_label": label, "created_at": _now(),
    })
    return ChronicLogOut(id=log_id, value={"systolic": req.systolic, "diastolic": req.diastolic},
                         flagged=flagged, flag_label=label, created_at=_now(), guidance=guidance)


@app.get("/patient/chronic/history")
def chronic_history(current_user=Depends(require_role("patient"))):
    return get_chronic_history(current_user["id"])


# ─── Diet Plan ────────────────────────────────────────────────────────────────

@app.post("/patient/diet/plan", response_model=DietPlanOut, status_code=201)
def create_diet_plan(req: DietPreferences, current_user=Depends(require_role("patient"))):
    # Get latest deficiencies from most recent lab report
    reports = get_lab_reports(current_user["id"])
    deficiencies = []
    if reports:
        latest = reports[0]
        for r in latest.get("results", []):
            if r["status"] == "low":
                def_name = LAB_RANGES.get(r["test_name"], {}).get("deficiency_name")
                if def_name:
                    deficiencies.append(def_name)
    plan = generate_diet_plan(deficiencies, req)
    plan_id = _uid()
    create_meal_plan({"id": plan_id, "patient_id": current_user["id"], "plan": plan, "created_at": _now()})
    return DietPlanOut(id=plan_id, plan=plan, created_at=_now())


@app.get("/patient/diet/latest")
def get_diet(current_user=Depends(require_role("patient"))):
    plan = get_latest_meal_plan(current_user["id"])
    if not plan:
        raise HTTPException(status_code=404, detail="No diet plan found. Generate one first.")
    return plan


# ─── Doctors & Appointments ───────────────────────────────────────────────────

@app.get("/doctors")
def get_doctors(current_user=Depends(get_current_user)):
    return list_doctors()


@app.get("/appointments/slots")
def get_slots(doctor_id: str, current_user=Depends(require_role("patient"))):
    """Return available time slots for the next 7 days for a doctor."""
    from datetime import timedelta
    booked = set(get_booked_slots(doctor_id))
    slots = []
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    for day_offset in range(1, 8):
        day = today + timedelta(days=day_offset)
        for hour in [9, 10, 11, 14, 15, 16, 17]:
            slot_dt = day.replace(hour=hour)
            slot_str = slot_dt.strftime("%Y-%m-%dT%H:%M:00")
            slots.append({"datetime": slot_str, "available": slot_str not in booked})
    return slots


@app.post("/appointments/book", status_code=201)
def book_appt(req: AppointmentBook, current_user=Depends(require_role("patient"))):
    if is_slot_taken(req.doctor_id, req.slot_datetime):
        raise HTTPException(status_code=409, detail="This slot is already booked. Please choose another time.")
    appt_id = _uid()
    book_appointment({
        "id": appt_id, "patient_id": current_user["id"],
        "doctor_id": req.doctor_id, "slot_datetime": req.slot_datetime, "created_at": _now(),
    })
    return {"id": appt_id, "slot_datetime": req.slot_datetime, "status": "confirmed"}


@app.post("/appointments/cancel")
def cancel_appt(req: AppointmentCancel, current_user=Depends(require_role("patient"))):
    ok = cancel_appointment(req.appointment_id, current_user["id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Appointment not found or already cancelled")
    return {"ok": True}


@app.get("/appointments")
def my_appointments(current_user=Depends(require_role("patient"))):
    return get_patient_appointments(current_user["id"])


# ─── Chatbot ──────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are CareSphere Health Assistant, a friendly and informative AI health guide.

RULES (CRITICAL - NEVER VIOLATE):
1. NEVER diagnose any condition. NEVER prescribe medication or treatments.
2. ALWAYS remind users that your information is educational only.
3. For any serious symptom concern, ALWAYS recommend they see a qualified doctor.
4. You CAN explain what lab results mean in general terms.
5. You CAN suggest general healthy lifestyle tips.
6. You CAN help users understand medical terms.
7. NEVER claim certainty about a user's specific medical situation.

Start every response by directly addressing the question. End with a brief reminder that professional medical advice is essential for any health decision."""


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, current_user=Depends(require_role("patient"))):
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

        system_content = SYSTEM_PROMPT
        if req.include_context:
            # Inject patient context
            summary = get_dashboard_summary(current_user["id"])
            context_parts = [f"Patient: {current_user['name']}"]
            if summary.get("deficiency_count"):
                context_parts.append(f"Active deficiencies: {summary['deficiency_count']}")
            if summary.get("lifestyle_category"):
                context_parts.append(f"Lifestyle: {summary['lifestyle_category']} (score: {summary['lifestyle_score']})")
            if summary.get("last_triage"):
                context_parts.append(f"Last symptom triage: {summary['last_triage']}")
            if summary.get("last_phq9_severity"):
                context_parts.append(f"Last PHQ-9 severity: {summary['last_phq9_severity']}")
            if summary.get("last_chronic_flag_label"):
                context_parts.append(f"Last BP reading: {summary['last_chronic_flag_label']}")
            if context_parts:
                system_content += "\n\nPatient Context:\n" + "\n".join(context_parts)

        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=system_content,
        )

        # Build conversation history
        history = []
        for m in req.messages[:-1]:
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

        chat_session = model.start_chat(history=history)
        last_msg = req.messages[-1].content if req.messages else "Hello"
        response = chat_session.send_message(last_msg)
        reply = response.text
        return ChatResponse(reply=reply)
    except Exception as e:
        return ChatResponse(
            reply=f"I'm currently unable to process your request. Please try again later. (Error: {type(e).__name__})",
        )


# ─── Doctor Routes ────────────────────────────────────────────────────────────

@app.get("/doctor/patients")
def doctor_patients(current_user=Depends(require_role("doctor"))):
    patients = list_patients()
    result = []
    for p in patients:
        summary = get_dashboard_summary(p["id"])
        result.append({
            **p,
            "last_triage": summary.get("last_triage"),
            "last_phq9_severity": summary.get("last_phq9_severity"),
            "deficiency_count": summary.get("deficiency_count", 0),
            "last_bp_flag": summary.get("last_chronic_flag_label"),
        })
    return result


@app.get("/doctor/patients/{patient_id}/summary")
def doctor_patient_summary(patient_id: str, current_user=Depends(require_role("doctor"))):
    user = get_user_by_id(patient_id)
    if not user or user["role"] != "patient":
        raise HTTPException(status_code=404, detail="Patient not found")
    profile = get_patient_profile(patient_id) or {}
    labs = get_lab_reports(patient_id)
    lifestyle = get_lifestyle_history(patient_id)
    symptoms = get_symptom_history(patient_id)
    mental = get_mental_history(patient_id)
    chronic = get_chronic_history(patient_id)
    meal_plan = get_latest_meal_plan(patient_id)
    appointments = get_patient_appointments(patient_id)
    return {
        "user": {"id": user["id"], "name": user["name"], "email": user["email"]},
        "profile": profile,
        "labs": labs,
        "lifestyle": lifestyle,
        "symptoms": symptoms,
        "mental": mental,
        "chronic": chronic,
        "meal_plan": meal_plan,
        "appointments": appointments,
    }


@app.get("/doctor/appointments")
def doctor_appointments(current_user=Depends(require_role("doctor"))):
    return get_doctor_appointments(current_user["id"])
