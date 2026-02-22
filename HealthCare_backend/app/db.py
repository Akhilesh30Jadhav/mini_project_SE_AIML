import sqlite3
import json
from typing import Any, Dict, List, Optional

DB_PATH = "app/reports.db"

def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            uploaded_at TEXT NOT NULL,
            status TEXT NOT NULL,
            flags_json TEXT NOT NULL,
            summary TEXT NOT NULL,
            results_json TEXT NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()

def insert_report(report: Dict[str, Any]) -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO reports (id, name, uploaded_at, status, flags_json, summary, results_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            report["id"],
            report["name"],
            report["uploadedAt"],
            report["status"],
            json.dumps(report.get("flags", [])),
            report.get("summary", ""),
            json.dumps(report.get("results", [])),
        ),
    )
    conn.commit()
    conn.close()

def fetch_reports() -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM reports ORDER BY uploaded_at DESC")
    rows = cur.fetchall()
    conn.close()

    out: List[Dict[str, Any]] = []
    for r in rows:
        out.append(
            {
                "id": r["id"],
                "name": r["name"],
                "uploadedAt": r["uploaded_at"],
                "status": r["status"],
                "flags": json.loads(r["flags_json"] or "[]"),
                "summary": r["summary"] or "",
                "results": json.loads(r["results_json"] or "[]"),
            }
        )
    return out

def fetch_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
    r = cur.fetchone()
    conn.close()

    if not r:
        return None

    return {
        "id": r["id"],
        "name": r["name"],
        "uploadedAt": r["uploaded_at"],
        "status": r["status"],
        "flags": json.loads(r["flags_json"] or "[]"),
        "summary": r["summary"] or "",
        "results": json.loads(r["results_json"] or "[]"),
    }

def delete_report(report_id: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    deleted = cur.rowcount > 0
    conn.commit()
    conn.close()
    return deleted
