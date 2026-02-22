import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import apiClient from "@/lib/apiClient";

type HistoryEntry = { type: string; date: string; summary: string; badge: string; badgeVariant: "green" | "amber" | "red" | "blue" | "default" };

export default function History() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all: HistoryEntry[] = [];
    const promises = [
      apiClient.get("/patient/labs").then(r => {
        for (const lab of r.data) {
          all.push({ type: "Lab Report", date: lab.created_at, summary: `${lab.results?.length ?? 0} tests · ${lab.deficiency_summary?.length ?? 0} deficiencies`, badge: lab.deficiency_summary?.length > 0 ? "Deficiencies" : "Clear", badgeVariant: lab.deficiency_summary?.length > 0 ? "amber" : "green" });
        }
      }),
      apiClient.get("/patient/lifestyle").then(r => {
        for (const l of r.data) {
          all.push({ type: "Lifestyle", date: l.created_at, summary: `Score: ${l.score}/100 — ${l.category}`, badge: l.category, badgeVariant: l.score >= 70 ? "green" : l.score >= 50 ? "blue" : "amber" });
        }
      }),
      apiClient.get("/patient/symptoms/history").then(r => {
        for (const s of r.data) {
          all.push({ type: "Symptom Check", date: s.created_at, summary: `${s.symptoms?.length ?? 0} symptoms · Score: ${s.score}`, badge: s.triage_level, badgeVariant: s.triage_level === "Low" ? "green" : s.triage_level === "Medium" ? "amber" : "red" });
        }
      }),
      apiClient.get("/patient/mental/history").then(r => {
        for (const m of r.data) {
          all.push({ type: m.type.toUpperCase(), date: m.created_at, summary: `Score: ${m.score} · ${m.severity}`, badge: m.severity, badgeVariant: m.severity === "Minimal or None" ? "green" : m.severity === "Mild" ? "blue" : m.severity === "Moderate" ? "amber" : "red" });
        }
      }),
      apiClient.get("/patient/chronic/history").then(r => {
        for (const c of r.data) {
          all.push({ type: "Blood Pressure", date: c.created_at, summary: `${c.value.systolic}/${c.value.diastolic} mmHg`, badge: c.flag_label, badgeVariant: c.flagged ? (c.flag_label?.includes("Crisis") ? "red" : "amber") : "green" });
        }
      }),
    ];
    Promise.allSettled(promises).then(() => {
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEntries(all);
      setLoading(false);
    });
  }, []);

  const TYPE_EMOJI: Record<string, string> = { "Lab Report": "🧪", "Lifestyle": "🏃", "Symptom Check": "🩺", "PHQ9": "🧠", "GAD7": "🧠", "Blood Pressure": "❤️" };

  return (
    <div className="space-y-6">
      <PageHeader title="Health Activity History" subtitle="All your health records in chronological order." />
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader><CardTitle className="text-base">Activity Log ({entries.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-12 text-slate-500">Loading history…</div> : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No health activity recorded yet. Start by analyzing a lab report or checking symptoms.</div>
          ) : (
            <div className="space-y-2">
              {entries.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-lg">{TYPE_EMOJI[e.type] ?? "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800">{e.type}</div>
                    <div className="text-xs text-slate-500">{e.summary}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={e.badgeVariant}>{e.badge}</Badge>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(e.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
