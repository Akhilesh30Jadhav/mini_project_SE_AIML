from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str  # 'patient' | 'doctor'
    specialization: Optional[str] = "General Practice"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    name: str
    user_id: str


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Profile ──────────────────────────────────────────────────────────────────

class PatientProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None


# ─── Labs ─────────────────────────────────────────────────────────────────────

class LabResultInput(BaseModel):
    test_name: str
    value: float
    unit: Optional[str] = None


class LabReportCreate(BaseModel):
    report_date: str
    results: List[LabResultInput]


class LabResultOut(BaseModel):
    id: str
    report_id: str
    test_name: str
    value: float
    unit: Optional[str]
    status: str
    ref_range_low: Optional[float]
    ref_range_high: Optional[float]
    explanation: Optional[str] = None
    deficiency_name: Optional[str] = None


class LabReportOut(BaseModel):
    id: str
    patient_id: str
    report_date: str
    created_at: str
    results: List[LabResultOut]
    deficiency_summary: Optional[List[str]] = []


# ─── Lifestyle ────────────────────────────────────────────────────────────────

class LifestyleSubmit(BaseModel):
    answers: dict  # {question_id: option_value}


class LifestyleOut(BaseModel):
    id: str
    score: int
    category: str
    created_at: str
    answers: dict


# ─── Symptoms ─────────────────────────────────────────────────────────────────

class SymptomCheckRequest(BaseModel):
    symptoms: List[str]  # list of symptom ids
    severity: int  # 1-5
    duration: str  # less_than_1 | 1_to_3 | more_than_3 | more_than_7


class SymptomCheckOut(BaseModel):
    id: str
    score: int
    triage_level: str
    guidance: str
    symptoms: List[str]
    created_at: str


# ─── Mental ───────────────────────────────────────────────────────────────────

class MentalAssessmentSubmit(BaseModel):
    answers: List[int]  # one int per question (0-3)


class MentalAssessmentOut(BaseModel):
    id: str
    type: str
    score: int
    severity: str
    created_at: str
    safety_message: Optional[str] = None


# ─── Chronic ──────────────────────────────────────────────────────────────────

class ChronicLogCreate(BaseModel):
    systolic: int
    diastolic: int


class ChronicLogOut(BaseModel):
    id: str
    value: dict
    flagged: bool
    flag_label: Optional[str]
    created_at: str
    guidance: Optional[str] = None


# ─── Diet ─────────────────────────────────────────────────────────────────────

class DietPreferences(BaseModel):
    diet_type: str  # veg | nonveg | vegan
    allergies: Optional[List[str]] = []
    goal: Optional[str] = "balanced"  # balanced | weight_loss | muscle_gain


class DietPlanOut(BaseModel):
    id: str
    plan: dict
    created_at: str


# ─── Appointments ─────────────────────────────────────────────────────────────

class AppointmentBook(BaseModel):
    doctor_id: str
    slot_datetime: str


class AppointmentCancel(BaseModel):
    appointment_id: str


class AppointmentOut(BaseModel):
    id: str
    doctor_id: str
    doctor_name: Optional[str]
    specialization: Optional[str]
    slot_datetime: str
    status: str
    created_at: str


# ─── Chatbot ──────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    include_context: bool = True


class ChatResponse(BaseModel):
    reply: str
    disclaimer: str = "⚠️ This is an AI assistant for informational purposes only. It cannot diagnose conditions, prescribe treatments, or replace medical advice. Always consult a qualified healthcare professional."


# ─── Doctor ───────────────────────────────────────────────────────────────────

class DoctorPatientSummary(BaseModel):
    user_id: str
    name: str
    email: str
    age: Optional[int]
    gender: Optional[str]
    last_triage: Optional[str]
    last_phq9_severity: Optional[str]
    last_lab_flags: int
    last_bp_flag: Optional[str]
