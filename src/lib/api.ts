import type {
  Patient,
  Appointment,
  MedicalReport,
  RiskPoint,
} from "@/lib/types";

let reportsStore: MedicalReport[] = [
  {
    id: "r1",
    name: "CBC Report",
    uploadedAt: "2 days ago",
    flags: ["Hemoglobin low"],
    summary: "Mild anemia suspected. Follow-up advised.",
    status: "analyzed",
  },
];

export const api = {
  async listReports(): Promise<MedicalReport[]> {
    return [...reportsStore];
  },
async uploadReport(file: File): Promise<MedicalReport> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("http://127.0.0.1:8000/analyze-report", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Report analysis failed");
  }

  return await res.json();
}



};
