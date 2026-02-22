import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft } from "lucide-react";
import apiClient from "@/lib/apiClient";

type PatientFull = {
  user: { id: string; name: string; email: string };
  profile: { age?: number; gender?: string; height_cm?: number; weight_kg?: number };
  labs: any[];
  lifestyle: any[];
  symptoms: any[];
  mental: any[];
  chronic: any[];
  appointments: any[];
};

const TRIAGE_V: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };
const BP_V: Record<string, "green" | "blue" | "amber" | "red"> = { Normal: "green", Elevated: "blue", "Stage 1 Hypertension": "amber", "Stage 2 Hypertension": "red", "Hypertensive Crisis": "red" };

export default function PatientDetail() {
  const { id } = useParams();
  const [data, setData] = useState<PatientFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    apiClient.get(`/doctor/patients/${id}/summary`)
      .then(r => setData(r.data)).catch(() => { }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-slate-500">Loading patient data…</div>;
  if (!data) return <div className="text-center py-16 text-red-500">Patient not found.</div>;

  const { user, profile, labs, lifestyle, symptoms, mental, chronic, appointments } = data;
  const tabs = ["overview", "labs", "mental", "bp", "symptoms", "appointments"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/doctor" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"><ArrowLeft size={13} />Back</Link>
      </div>
      <PageHeader title={user.name} subtitle={user.email} />

      {/* Profile row */}
      <div className="flex flex-wrap gap-3">
        {[["Age", profile.age ? `${profile.age} yrs` : "—"], ["Gender", profile.gender ?? "—"], ["Height", profile.height_cm ? `${profile.height_cm} cm` : "—"], ["Weight", profile.weight_kg ? `${profile.weight_kg} kg` : "—"]].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white px-4 py-2">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="font-semibold text-slate-800 text-sm">{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={["rounded-xl border px-4 py-1.5 text-sm capitalize transition-all", activeTab === t ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"].join(" ")}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Last Triage</CardTitle></CardHeader>
            <CardContent>
              {symptoms[0] ? <Badge variant={TRIAGE_V[symptoms[0].triage_level] ?? "default"}>{symptoms[0].triage_level}</Badge> : <span className="text-slate-400 text-sm">No data</span>}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Last PHQ-9</CardTitle></CardHeader>
            <CardContent>
              {mental.find((m: any) => m.type === "phq9") ? `${mental.find((m: any) => m.type === "phq9").score} pts — ${mental.find((m: any) => m.type === "phq9").severity}` : <span className="text-slate-400 text-sm">No data</span>}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Lab Deficiencies (latest)</CardTitle></CardHeader>
            <CardContent>
              {labs[0]?.deficiency_summary?.length > 0 ? (
                <div className="flex flex-wrap gap-1">{labs[0].deficiency_summary.map((d: string) => <span key={d} className="text-xs bg-amber-100 text-amber-800 rounded-full px-2 py-0.5">{d}</span>)}</div>
              ) : <span className="text-slate-400 text-sm">{labs.length > 0 ? "No deficiencies" : "No labs"}</span>}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader><CardTitle className="text-sm">Last BP</CardTitle></CardHeader>
            <CardContent>
              {chronic[0] ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{chronic[0].value.systolic}/{chronic[0].value.diastolic}</span>
                  <Badge variant={BP_V[chronic[0].flag_label] ?? "default"}>{chronic[0].flag_label}</Badge>
                </div>
              ) : <span className="text-slate-400 text-sm">No data</span>}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "labs" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Lab Reports ({labs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {labs.length === 0 ? <span className="text-slate-400 text-sm">No lab reports</span> : labs.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">{r.report_date}</span>
                  <span className="text-xs text-slate-500">{r.results?.length} tests</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.deficiency_summary?.map((d: string) => <span key={d} className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{d}</span>)}
                  {(!r.deficiency_summary || !r.deficiency_summary.length) && <span className="text-xs text-green-600">No deficiencies</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "mental" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Mental Assessments ({mental.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {mental.length === 0 ? <span className="text-slate-400 text-sm">No assessments</span> : mental.slice(0, 10).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{m.type.toUpperCase()}</span>
                <span className="text-slate-500 text-xs">{new Date(m.created_at).toLocaleDateString("en-IN")}</span>
                <span className="font-semibold">{m.score} pts</span>
                <span className="text-xs text-slate-700">{m.severity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "bp" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Blood Pressure History ({chronic.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {chronic.length === 0 ? <span className="text-slate-400 text-sm">No readings</span> : chronic.slice(0, 15).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString("en-IN")}</span>
                <span className="font-bold text-slate-900">{c.value.systolic}/{c.value.diastolic}</span>
                <Badge variant={BP_V[c.flag_label] ?? "default"}>{c.flag_label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "symptoms" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Symptom Checks ({symptoms.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {symptoms.length === 0 ? <span className="text-slate-400 text-sm">No checks</span> : symptoms.slice(0, 10).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString("en-IN")}</span>
                <Badge variant={TRIAGE_V[s.triage_level] ?? "default"}>{s.triage_level}</Badge>
                <span className="text-xs text-slate-600">{s.symptoms?.length ?? 0} symptoms</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "appointments" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-sm">Appointments ({appointments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {appointments.length === 0 ? <span className="text-slate-400 text-sm">No appointments</span> : appointments.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm">{new Date(a.slot_datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                <Badge variant={a.status === "confirmed" ? "green" : "amber"}>{a.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
