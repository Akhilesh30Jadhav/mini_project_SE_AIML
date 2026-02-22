from typing import List, Literal, Optional
from pydantic import BaseModel

class LabResult(BaseModel):
    name: str
    value: str
    unit: Optional[str] = None
    referenceRange: Optional[str] = None
    flag: Optional[str] = None  # "low" | "high" | "normal" | "unknown-range"

class MedicalReport(BaseModel):
    id: str
    name: str
    uploadedAt: str
    status: Literal["analyzed", "analyzing", "failed"]
    flags: List[str]
    summary: str
    results: List[LabResult]
