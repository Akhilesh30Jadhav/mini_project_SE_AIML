// src/lib/types.ts

/* =======================
   PATIENT
   ======================= */
export type Patient = {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
};

export type LabResultFlag = "low" | "normal" | "high" | "unknown";

export type LabResult = {
  test: string;          // e.g., "Hemoglobin"
  value: string;         // e.g., "11.2"
  unit?: string;         // e.g., "g/dL"
  refRange?: string;     // e.g., "13.0–17.0"
  flag: LabResultFlag;   // low/high/normal/unknown
};


/* =======================
   REPORTS
   ======================= */
export type MedicalReport = {
  id: string;
  name: string;
  uploadedAt: string;
  status: "analyzed" | "analyzing" | "failed";
  flags: string[];
  summary: string;
  results: LabResult[];
};

/* =======================
   RISK TREND
   ======================= */
export type RiskPoint = {
  day: string;
  risk: number;
};

/* =======================
   APPOINTMENTS
   ======================= */
export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  when: string;
  channel: "Online" | "Phone" | "Walk-in";
  status: "Pending" | "Confirmed";
  noShowScore: number;
};
