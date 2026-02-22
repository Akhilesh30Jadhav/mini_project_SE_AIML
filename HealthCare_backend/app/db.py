import sqlite3
import json
import os
from typing import Any, Dict, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "app", "healthcare.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()

    cur.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('patient', 'doctor')),
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS patient_profiles (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            age INTEGER,
            gender TEXT,
            height_cm REAL,
            weight_kg REAL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS doctors (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            specialization TEXT NOT NULL DEFAULT 'General Practice',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_reports (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            report_date TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS lab_results (
            id TEXT PRIMARY KEY,
            report_id TEXT NOT NULL REFERENCES lab_reports(id),
            test_name TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT,
            status TEXT NOT NULL,
            ref_range_low REAL,
            ref_range_high REAL
        );

        CREATE TABLE IF NOT EXISTS lifestyle_assessments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            answers_json TEXT NOT NULL,
            score INTEGER NOT NULL,
            category TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS symptom_checks (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            symptoms_json TEXT NOT NULL,
            score INTEGER NOT NULL,
            triage_level TEXT NOT NULL,
            severity INTEGER NOT NULL DEFAULT 3,
            duration TEXT NOT NULL DEFAULT '1_to_3',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS mental_assessments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            type TEXT NOT NULL CHECK(type IN ('phq9', 'gad7')),
            score INTEGER NOT NULL,
            severity TEXT NOT NULL,
            answers_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chronic_logs (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            type TEXT NOT NULL DEFAULT 'blood_pressure',
            value_json TEXT NOT NULL,
            flagged INTEGER NOT NULL DEFAULT 0,
            flag_label TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS meal_plans (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            plan_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL REFERENCES users(id),
            doctor_id TEXT NOT NULL REFERENCES users(id),
            slot_datetime TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'confirmed',
            created_at TEXT NOT NULL,
            UNIQUE(doctor_id, slot_datetime)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            expires_at TEXT NOT NULL
        );
    """)
    conn.commit()
    conn.close()


# ─── Users ───────────────────────────────────────────────────────────────────

def create_user(user: Dict[str, Any]) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)",
        (user["id"], user["name"], user["email"], user["password_hash"], user["role"], user["created_at"])
    )
    conn.commit()
    conn.close()


def get_user_by_email(email: str) -> Optional[Dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_patients() -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT u.id, u.name, u.email, u.created_at,
                  p.age, p.gender, p.height_cm, p.weight_kg
           FROM users u
           LEFT JOIN patient_profiles p ON u.id = p.user_id
           WHERE u.role = 'patient'
           ORDER BY u.created_at DESC"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_doctors() -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT u.id, u.name, u.email, d.specialization
           FROM users u
           JOIN doctors d ON u.id = d.user_id
           WHERE u.role = 'doctor'"""
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ─── Profiles ─────────────────────────────────────────────────────────────────

def upsert_patient_profile(data: Dict[str, Any]) -> None:
    conn = get_conn()
    conn.execute(
        """INSERT INTO patient_profiles (user_id, age, gender, height_cm, weight_kg, updated_at)
           VALUES (?,?,?,?,?,?)
           ON CONFLICT(user_id) DO UPDATE SET
             age=excluded.age, gender=excluded.gender,
             height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
             updated_at=excluded.updated_at""",
        (data["user_id"], data.get("age"), data.get("gender"),
         data.get("height_cm"), data.get("weight_kg"), data["updated_at"])
    )
    conn.commit()
    conn.close()


def get_patient_profile(user_id: str) -> Optional[Dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM patient_profiles WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def create_doctor_profile(data: Dict[str, Any]) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT OR IGNORE INTO doctors (user_id, specialization, created_at) VALUES (?,?,?)",
        (data["user_id"], data.get("specialization", "General Practice"), data["created_at"])
    )
    conn.commit()
    conn.close()


# ─── Lab Reports ──────────────────────────────────────────────────────────────

def create_lab_report(report: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO lab_reports (id, patient_id, report_date, created_at) VALUES (?,?,?,?)",
        (report["id"], report["patient_id"], report["report_date"], report["created_at"])
    )
    conn.commit()
    conn.close()


def add_lab_results(results: List[Dict]) -> None:
    conn = get_conn()
    conn.executemany(
        "INSERT INTO lab_results (id, report_id, test_name, value, unit, status, ref_range_low, ref_range_high) VALUES (?,?,?,?,?,?,?,?)",
        [(r["id"], r["report_id"], r["test_name"], r["value"], r.get("unit"),
          r["status"], r.get("ref_range_low"), r.get("ref_range_high")) for r in results]
    )
    conn.commit()
    conn.close()


def get_lab_reports(patient_id: str) -> List[Dict]:
    conn = get_conn()
    reports = conn.execute(
        "SELECT * FROM lab_reports WHERE patient_id=? ORDER BY report_date DESC",
        (patient_id,)
    ).fetchall()
    out = []
    for rpt in reports:
        rpt_dict = dict(rpt)
        rows = conn.execute(
            "SELECT * FROM lab_results WHERE report_id=?", (rpt_dict["id"],)
        ).fetchall()
        rpt_dict["results"] = [dict(r) for r in rows]
        out.append(rpt_dict)
    conn.close()
    return out


# ─── Lifestyle ────────────────────────────────────────────────────────────────

def create_lifestyle_assessment(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO lifestyle_assessments (id, patient_id, answers_json, score, category, created_at) VALUES (?,?,?,?,?,?)",
        (data["id"], data["patient_id"], json.dumps(data["answers"]), data["score"], data["category"], data["created_at"])
    )
    conn.commit()
    conn.close()


def get_lifestyle_history(patient_id: str) -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM lifestyle_assessments WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [{**dict(r), "answers": json.loads(r["answers_json"])} for r in rows]


# ─── Symptoms ─────────────────────────────────────────────────────────────────

def create_symptom_check(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO symptom_checks (id, patient_id, symptoms_json, score, triage_level, severity, duration, created_at) VALUES (?,?,?,?,?,?,?,?)",
        (data["id"], data["patient_id"], json.dumps(data["symptoms"]), data["score"],
         data["triage_level"], data.get("severity", 3), data.get("duration", "1_to_3"), data["created_at"])
    )
    conn.commit()
    conn.close()


def get_symptom_history(patient_id: str) -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM symptom_checks WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [{**dict(r), "symptoms": json.loads(r["symptoms_json"])} for r in rows]


# ─── Mental ───────────────────────────────────────────────────────────────────

def create_mental_assessment(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO mental_assessments (id, patient_id, type, score, severity, answers_json, created_at) VALUES (?,?,?,?,?,?,?)",
        (data["id"], data["patient_id"], data["type"], data["score"],
         data["severity"], json.dumps(data["answers"]), data["created_at"])
    )
    conn.commit()
    conn.close()


def get_mental_history(patient_id: str, assessment_type: Optional[str] = None) -> List[Dict]:
    conn = get_conn()
    if assessment_type:
        rows = conn.execute(
            "SELECT * FROM mental_assessments WHERE patient_id=? AND type=? ORDER BY created_at DESC",
            (patient_id, assessment_type)
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM mental_assessments WHERE patient_id=? ORDER BY created_at DESC",
            (patient_id,)
        ).fetchall()
    conn.close()
    return [{**dict(r), "answers": json.loads(r["answers_json"])} for r in rows]


# ─── Chronic ──────────────────────────────────────────────────────────────────

def create_chronic_log(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO chronic_logs (id, patient_id, type, value_json, flagged, flag_label, created_at) VALUES (?,?,?,?,?,?,?)",
        (data["id"], data["patient_id"], data.get("type", "blood_pressure"),
         json.dumps(data["value"]), int(data["flagged"]), data.get("flag_label"), data["created_at"])
    )
    conn.commit()
    conn.close()


def get_chronic_history(patient_id: str) -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM chronic_logs WHERE patient_id=? ORDER BY created_at DESC",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [{**dict(r), "value": json.loads(r["value_json"])} for r in rows]


# ─── Meal Plans ───────────────────────────────────────────────────────────────

def create_meal_plan(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO meal_plans (id, patient_id, plan_json, created_at) VALUES (?,?,?,?)",
        (data["id"], data["patient_id"], json.dumps(data["plan"]), data["created_at"])
    )
    conn.commit()
    conn.close()


def get_latest_meal_plan(patient_id: str) -> Optional[Dict]:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM meal_plans WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["plan"] = json.loads(d["plan_json"])
    return d


# ─── Appointments ─────────────────────────────────────────────────────────────

def book_appointment(data: Dict) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT INTO appointments (id, patient_id, doctor_id, slot_datetime, status, created_at) VALUES (?,?,?,?,?,?)",
        (data["id"], data["patient_id"], data["doctor_id"],
         data["slot_datetime"], "confirmed", data["created_at"])
    )
    conn.commit()
    conn.close()


def cancel_appointment(appt_id: str, patient_id: str) -> bool:
    conn = get_conn()
    cur = conn.execute(
        "UPDATE appointments SET status='cancelled' WHERE id=? AND patient_id=? AND status='confirmed'",
        (appt_id, patient_id)
    )
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def get_booked_slots(doctor_id: str) -> List[str]:
    conn = get_conn()
    rows = conn.execute(
        "SELECT slot_datetime FROM appointments WHERE doctor_id=? AND status='confirmed'",
        (doctor_id,)
    ).fetchall()
    conn.close()
    return [r["slot_datetime"] for r in rows]


def get_patient_appointments(patient_id: str) -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT a.*, u.name as doctor_name, d.specialization
           FROM appointments a
           JOIN users u ON a.doctor_id = u.id
           JOIN doctors d ON a.doctor_id = d.user_id
           WHERE a.patient_id=? ORDER BY a.slot_datetime""",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_doctor_appointments(doctor_id: str) -> List[Dict]:
    conn = get_conn()
    rows = conn.execute(
        """SELECT a.*, u.name as patient_name
           FROM appointments a
           JOIN users u ON a.patient_id = u.id
           WHERE a.doctor_id=? AND a.status='confirmed'
           ORDER BY a.slot_datetime""",
        (doctor_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def is_slot_taken(doctor_id: str, slot_datetime: str) -> bool:
    conn = get_conn()
    row = conn.execute(
        "SELECT 1 FROM appointments WHERE doctor_id=? AND slot_datetime=? AND status='confirmed'",
        (doctor_id, slot_datetime)
    ).fetchone()
    conn.close()
    return row is not None


# ─── Refresh Tokens ───────────────────────────────────────────────────────────

def store_refresh_token(token: str, user_id: str, expires_at: str) -> None:
    conn = get_conn()
    conn.execute(
        "INSERT OR REPLACE INTO refresh_tokens (token, user_id, expires_at) VALUES (?,?,?)",
        (token, user_id, expires_at)
    )
    conn.commit()
    conn.close()


def get_refresh_token(token: str) -> Optional[Dict]:
    conn = get_conn()
    row = conn.execute(
        "SELECT * FROM refresh_tokens WHERE token=?", (token,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_refresh_token(token: str) -> None:
    conn = get_conn()
    conn.execute("DELETE FROM refresh_tokens WHERE token=?", (token,))
    conn.commit()
    conn.close()


# ─── Dashboard Summary ────────────────────────────────────────────────────────

def get_dashboard_summary(patient_id: str) -> Dict:
    conn = get_conn()

    # Deficiency count from latest lab report
    latest_report = conn.execute(
        "SELECT id FROM lab_reports WHERE patient_id=? ORDER BY report_date DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    deficiency_count = 0
    if latest_report:
        deficiency_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM lab_results WHERE report_id=? AND status='low'",
            (latest_report["id"],)
        ).fetchone()["cnt"]

    # Latest lifestyle
    lifestyle = conn.execute(
        "SELECT score, category FROM lifestyle_assessments WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()

    # Latest triage
    triage = conn.execute(
        "SELECT triage_level FROM symptom_checks WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()

    # Latest mental
    phq9 = conn.execute(
        "SELECT severity FROM mental_assessments WHERE patient_id=? AND type='phq9' ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    gad7 = conn.execute(
        "SELECT severity FROM mental_assessments WHERE patient_id=? AND type='gad7' ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()

    # Latest chronic
    chronic = conn.execute(
        "SELECT flagged, flag_label FROM chronic_logs WHERE patient_id=? ORDER BY created_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()

    # Upcoming appointment
    appt = conn.execute(
        """SELECT a.slot_datetime, u.name as doctor_name
           FROM appointments a JOIN users u ON a.doctor_id=u.id
           WHERE a.patient_id=? AND a.status='confirmed' AND a.slot_datetime >= datetime('now')
           ORDER BY a.slot_datetime LIMIT 1""",
        (patient_id,)
    ).fetchone()

    conn.close()
    return {
        "deficiency_count": deficiency_count,
        "lifestyle_score": lifestyle["score"] if lifestyle else None,
        "lifestyle_category": lifestyle["category"] if lifestyle else None,
        "last_triage": triage["triage_level"] if triage else None,
        "last_phq9_severity": phq9["severity"] if phq9 else None,
        "last_gad7_severity": gad7["severity"] if gad7 else None,
        "last_chronic_flagged": bool(chronic["flagged"]) if chronic else None,
        "last_chronic_flag_label": chronic["flag_label"] if chronic and chronic["flagged"] else None,
        "next_appointment": dict(appt) if appt else None,
    }
