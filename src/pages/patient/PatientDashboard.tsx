import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Activity, CalendarClock, HeartPulse, Brain, Pill, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/apiClient";
import { getAuth } from "@/features/auth/auth.store";

type Summary = {
  deficiency_count: number;
  lifestyle_score: number | null;
  lifestyle_category: string | null;
  last_triage: string | null;
  last_phq9_severity: string | null;
  last_gad7_severity: string | null;
  last_chronic_flagged: boolean | null;
  last_chronic_flag_label: string | null;
  next_appointment: { slot_datetime: string; doctor_name: string } | null;
};

const TRIAGE_VARIANT: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };
const SEVERITY_VARIANT: Record<string, "green" | "blue" | "amber" | "red"> = {
  "Minimal or None": "green", "Mild": "blue", "Moderate": "amber",
  "Moderately Severe": "amber", "Severe": "red",
};

export default function PatientDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    apiClient.get("/patient/dashboard/summary")
      .then(r => setSummary(r.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = summary ? [
    { icon: Pill, label: "Deficiencies detected", value: summary.deficiency_count > 0 ? `${summary.deficiency_count} flagged` : "None", badge: summary.deficiency_count > 0 ? { label: "Review", variant: "amber" as const } : { label: "Clear", variant: "green" as const }, link: "/patient/labs" },
    { icon: Activity, label: "Lifestyle score", value: summary.lifestyle_score !== null ? `${summary.lifestyle_score}/100` : "Not assessed", badge: summary.lifestyle_category ? { label: summary.lifestyle_category, variant: "blue" as const } : undefined, link: "/patient/lifestyle" },
    { icon: Zap, label: "Last triage level", value: summary.last_triage ?? "Not checked", badge: summary.last_triage ? { label: summary.last_triage, variant: TRIAGE_VARIANT[summary.last_triage] ?? "default" } : undefined, link: "/patient/symptoms" },
    { icon: Brain, label: "PHQ-9 severity", value: summary.last_phq9_severity ?? "Not assessed", badge: summary.last_phq9_severity ? { label: "Assessed", variant: SEVERITY_VARIANT[summary.last_phq9_severity] ?? "default" } : undefined, link: "/patient/mental" },
    { icon: HeartPulse, label: "Blood pressure", value: summary.last_chronic_flag_label ?? "Not logged", badge: summary.last_chronic_flagged !== null ? { label: summary.last_chronic_flagged ? "Flagged" : "Normal", variant: summary.last_chronic_flagged ? "red" as const : "green" as const } : undefined, link: "/patient/chronic" },
    { icon: CalendarClock, label: "Next appointment", value: summary.next_appointment ? new Date(summary.next_appointment.slot_datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "None booked", badge: summary.next_appointment ? { label: "Confirmed", variant: "green" as const } : undefined, link: "/patient/appointments" },
  ] : [];

  const featureLinks = [
    { to: "/patient/labs", label: "Lab Reports", desc: "Enter & analyze lab values", icon: "🧪" },
    { to: "/patient/lifestyle", label: "Lifestyle Score", desc: "Assess your daily habits", icon: "🏃" },
    { to: "/patient/symptoms", label: "Symptom Checker", desc: "Get a triage assessment", icon: "🩺" },
    { to: "/patient/mental", label: "Mental Wellness", desc: "PHQ-9 & GAD-7 assessments", icon: "🧠" },
    { to: "/patient/chronic", label: "Blood Pressure", desc: "Track your BP readings", icon: "❤️" },
    { to: "/patient/diet", label: "Diet Plan", desc: "Personalized meal plan", icon: "🥗" },
    { to: "/patient/appointments", label: "Appointments", desc: "Book & manage slots", icon: "📅" },
    { to: "/patient/chatbot", label: "Health Chat", desc: "Ask your AI assistant", icon: "💬" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${auth.name ?? "Patient"}`}
        subtitle="Your personalised health overview. All insights are for informational purposes only."
      />

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading your health summary…</div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map(kpi => (
              <Link key={kpi.label} to={kpi.link}>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
                        <kpi.icon size={18} className="text-slate-700" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500">{kpi.label}</div>
                        <div className="mt-0.5 text-base font-semibold text-slate-900">{kpi.value}</div>
                      </div>
                    </div>
                    {kpi.badge && <Badge variant={kpi.badge.variant}>{kpi.badge.label}</Badge>}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Medical Disclaimer */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            ⚠️ <strong>Medical Disclaimer:</strong> CareSphere provides health information for educational purposes only. It does not diagnose conditions or replace professional medical advice. Always consult a qualified healthcare provider.
          </div>

          {/* Feature Cards */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Health Modules</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featureLinks.map(f => (
                <Link key={f.to} to={f.to}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow hover:border-blue-200">
                    <div className="mb-2 text-2xl">{f.icon}</div>
                    <div className="font-semibold text-slate-900 text-sm">{f.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{f.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
