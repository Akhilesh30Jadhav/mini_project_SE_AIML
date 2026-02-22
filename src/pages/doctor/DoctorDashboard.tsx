import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { getAuth } from "@/features/auth/auth.store";
import apiClient from "@/lib/apiClient";

type PatientRow = { id: string; name: string; email: string; age?: number; gender?: string; last_triage?: string; last_phq9_severity?: string; deficiency_count: number; last_bp_flag?: string };

const TRIAGE_V: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };
const SEV_V: Record<string, "green" | "blue" | "amber" | "red"> = { "Minimal or None": "green", "Mild": "blue", "Moderate": "amber", "Moderately Severe": "amber", "Severe": "red" };
const BP_V: Record<string, "green" | "blue" | "amber" | "red"> = { "Normal": "green", "Elevated": "blue", "Stage 1 Hypertension": "amber", "Stage 2 Hypertension": "red", "Hypertensive Crisis": "red" };

export default function DoctorDashboard() {
  const auth = getAuth();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/doctor/patients").then(r => setPatients(r.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const highTriageCount = patients.filter(p => p.last_triage === "High").length;
  const flaggedBpCount = patients.filter(p => p.last_bp_flag && p.last_bp_flag !== "Normal").length;
  const defCount = patients.filter(p => p.deficiency_count > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${auth.name}`} subtitle="Patient overview — demo mode: all registered patients are visible." />

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Patients", value: patients.length.toString(), badge: null },
          { label: "High Triage Alerts", value: highTriageCount.toString(), badge: highTriageCount > 0 ? { label: "Action needed", variant: "red" as const } : { label: "Clear", variant: "green" as const } },
          { label: "BP Flags", value: flaggedBpCount.toString(), badge: flaggedBpCount > 0 ? { label: "Review", variant: "amber" as const } : { label: "OK", variant: "green" as const } },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">{kpi.label}</div>
            <div className="mt-1 text-3xl font-bold text-slate-900">{kpi.value}</div>
            {kpi.badge && <Badge variant={kpi.badge.variant} className="mt-1">{kpi.badge.label}</Badge>}
          </div>
        ))}
      </div>

      {/* Patient Table */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-base">All Patients ({patients.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center text-slate-500 py-8">Loading patients…</div> : (
            patients.length === 0 ? <div className="text-center text-slate-500 py-8">No patients registered yet.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Triage</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">PHQ-9</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">BP Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600">Deficiencies</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600"></th>
                  </tr></thead>
                  <tbody>
                    {patients.map(p => (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-400">{p.email}</div>
                        </td>
                        <td className="px-4 py-3">{p.last_triage ? <Badge variant={TRIAGE_V[p.last_triage] ?? "default"}>{p.last_triage}</Badge> : <span className="text-slate-400 text-xs">—</span>}</td>
                        <td className="px-4 py-3">{p.last_phq9_severity ? <Badge variant={SEV_V[p.last_phq9_severity] ?? "default"}>{p.last_phq9_severity}</Badge> : <span className="text-slate-400 text-xs">—</span>}</td>
                        <td className="px-4 py-3">{p.last_bp_flag ? <Badge variant={BP_V[p.last_bp_flag] ?? "default"}>{p.last_bp_flag}</Badge> : <span className="text-slate-400 text-xs">—</span>}</td>
                        <td className="px-4 py-3">{p.deficiency_count > 0 ? <Badge variant="amber">{p.deficiency_count} flagged</Badge> : <span className="text-slate-400 text-xs">None</span>}</td>
                        <td className="px-4 py-3">
                          <Link to={`/doctor/patients/${p.id}`} className="text-xs font-medium text-blue-600 hover:underline">View →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
