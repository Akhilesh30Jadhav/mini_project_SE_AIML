import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AlertCircle, CheckCircle2, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import apiClient from "@/lib/apiClient";

const SYMPTOMS = [
    { id: "chest_pain", label: "Chest pain or tightness" },
    { id: "shortness_breath", label: "Shortness of breath" },
    { id: "severe_headache", label: "Severe or sudden headache" },
    { id: "fainting", label: "Fainting / loss of consciousness" },
    { id: "vision_changes", label: "Sudden vision changes" },
    { id: "high_fever", label: "High fever (>39°C)" },
    { id: "severe_pain", label: "Severe abdominal pain" },
    { id: "numbness", label: "Sudden numbness or weakness" },
    { id: "palpitations", label: "Heart palpitations" },
    { id: "cough", label: "Persistent cough" },
    { id: "fever", label: "Mild-moderate fever" },
    { id: "fatigue", label: "Extreme fatigue" },
    { id: "nausea", label: "Nausea or vomiting" },
    { id: "diarrhea", label: "Diarrhea >3 days" },
    { id: "joint_pain", label: "Joint or muscle pain" },
    { id: "rash", label: "Skin rash" },
    { id: "sore_throat", label: "Sore throat" },
    { id: "ear_pain", label: "Ear pain" },
    { id: "headache", label: "Mild-moderate headache" },
    { id: "back_pain", label: "Back pain" },
    { id: "dizziness", label: "Dizziness / lightheadedness" },
    { id: "urinary_pain", label: "Pain during urination" },
];

const SEVERITY_OPTIONS = [{ value: 1, label: "Very mild" }, { value: 2, label: "Mild" }, { value: 3, label: "Moderate" }, { value: 4, label: "Severe" }, { value: 5, label: "Very severe" }];
const DURATION_OPTIONS = [{ value: "less_than_1", label: "Less than 1 day" }, { value: "1_to_3", label: "1–3 days" }, { value: "more_than_3", label: "More than 3 days" }, { value: "more_than_7", label: "More than 7 days" }];

const TRIAGE_CONFIG = {
    Low: { color: "bg-green-50 border-green-300 text-green-900", badge: "green" as const, icon: "✅" },
    Medium: { color: "bg-amber-50 border-amber-300 text-amber-900", badge: "amber" as const, icon: "⚠️" },
    High: { color: "bg-red-50 border-red-300 text-red-900", badge: "red" as const, icon: "🚨" },
};

type TriageResult = { id: string; triage_level: string; score: number; guidance: string; symptoms: string[]; created_at: string };
type HistoryItem = TriageResult;

export default function SymptomChecker() {
    const [selected, setSelected] = useState<string[]>([]);
    const [severity, setSeverity] = useState(3);
    const [duration, setDuration] = useState("1_to_3");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TriageResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        apiClient.get("/patient/symptoms/history").then(r => setHistory(r.data)).catch(() => { });
    }, [result]);

    function toggle(id: string) {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    }

    async function submit() {
        if (!selected.length) { alert("Select at least one symptom."); return; }
        setSubmitting(true);
        try {
            const res = await apiClient.post("/patient/symptoms/check", { symptoms: selected, severity, duration });
            setResult(res.data);
        } catch (e: any) { alert(e?.response?.data?.detail ?? "Failed."); }
        finally { setSubmitting(false); }
    }

    const cfg = result ? TRIAGE_CONFIG[result.triage_level as keyof typeof TRIAGE_CONFIG] : null;

    return (
        <div className="space-y-6">
            <PageHeader title="Symptom Checker" subtitle="Select your symptoms for a triage assessment. This is not a diagnosis." />

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                ⚠️ <strong>Disclaimer:</strong> This tool provides general triage guidance only — not a medical diagnosis. For emergencies, call 112 or go to the nearest hospital immediately.
            </div>

            {result && cfg ? (
                <Card className="rounded-2xl border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Triage Result</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={`rounded-2xl border p-5 ${cfg.color}`}>
                            <div className="text-3xl font-bold mb-1">{cfg.icon} {result.triage_level} Priority</div>
                            <div className="text-sm mt-2">{result.guidance}</div>
                        </div>
                        {(result.triage_level === "Medium" || result.triage_level === "High") && (
                            <Link to="/patient/appointments">
                                <Button className="w-full sm:w-auto"><CalendarClock size={15} className="mr-2" />Book an Appointment</Button>
                            </Link>
                        )}
                        <Button variant="secondary" onClick={() => { setResult(null); setSelected([]); setSeverity(3); setDuration("1_to_3"); }}>Check again</Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Select Your Symptoms</CardTitle>
                        <CardDescription>Check all that apply</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {SYMPTOMS.map(s => (
                                <button key={s.id} type="button" onClick={() => toggle(s.id)}
                                    className={["flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all", selected.includes(s.id) ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"].join(" ")}>
                                    {selected.includes(s.id) ? <CheckCircle2 size={13} className="text-blue-600 shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0" />}
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {selected.length > 0 && (
                            <>
                                <div>
                                    <div className="text-sm font-medium text-slate-800 mb-2">Overall symptom severity</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {SEVERITY_OPTIONS.map(o => (
                                            <button key={o.value} type="button" onClick={() => setSeverity(o.value)}
                                                className={["rounded-xl border px-4 py-2 text-sm transition-all", severity === o.value ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-slate-800 mb-2">How long have you had these symptoms?</div>
                                    <div className="flex gap-2 flex-wrap">
                                        {DURATION_OPTIONS.map(o => (
                                            <button key={o.value} type="button" onClick={() => setDuration(o.value)}
                                                className={["rounded-xl border px-4 py-2 text-sm transition-all", duration === o.value ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Button onClick={submit} disabled={submitting}>{submitting ? "Analyzing…" : `Get Triage (${selected.length} symptoms)`}</Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {history.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="text-base">Triage History</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {history.slice(0, 5).map(h => (
                            <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                <span className="text-slate-600">{new Date(h.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                                <Badge variant={TRIAGE_CONFIG[h.triage_level as keyof typeof TRIAGE_CONFIG]?.badge ?? "default"}>{h.triage_level}</Badge>
                                <span className="text-xs text-slate-500">{h.symptoms?.length ?? 0} symptoms</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
