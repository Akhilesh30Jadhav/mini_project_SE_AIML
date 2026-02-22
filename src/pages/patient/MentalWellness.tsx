import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import apiClient from "@/lib/apiClient";

const PHQ9_QUESTIONS = [
    "Little interest or pleasure in doing things?",
    "Feeling down, depressed, or hopeless?",
    "Trouble falling or staying asleep, or sleeping too much?",
    "Feeling tired or having little energy?",
    "Poor appetite or overeating?",
    "Feeling bad about yourself or that you are a failure?",
    "Trouble concentrating on things?",
    "Moving or speaking slowly, or being fidgety/restless?",
    "Thoughts that you would be better off dead or hurting yourself?",
];

const GAD7_QUESTIONS = [
    "Feeling nervous, anxious, or on edge?",
    "Not being able to stop or control worrying?",
    "Worrying too much about different things?",
    "Trouble relaxing?",
    "Being so restless that it's hard to sit still?",
    "Becoming easily annoyed or irritable?",
    "Feeling afraid as if something awful might happen?",
];

const ANSWER_OPTIONS = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" },
];

const SEVERITY_STYLE: Record<string, string> = {
    "Minimal or None": "bg-green-50 border-green-200 text-green-800",
    "Mild": "bg-blue-50 border-blue-200 text-blue-800",
    "Moderate": "bg-amber-50 border-amber-200 text-amber-800",
    "Moderately Severe": "bg-orange-50 border-orange-200 text-orange-800",
    "Severe": "bg-red-50 border-red-200 text-red-800",
};

type AssessResult = { score: number; severity: string; safety_message?: string };
type HistoryItem = { id: string; type: string; score: number; severity: string; created_at: string };

function AssessmentPanel({ type, questions, title }: { type: "phq9" | "gad7"; questions: string[]; title: string }) {
    const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<AssessResult | null>(null);

    function setAnswer(i: number, val: number) { setAnswers(a => { const n = [...a]; n[i] = val; return n; }); }

    async function submit() {
        if (answers.some(a => a < 0)) { alert("Please answer all questions."); return; }
        setSubmitting(true);
        try {
            const res = await apiClient.post(`/patient/mental/${type}`, { answers });
            setResult(res.data);
        } catch (e: any) { alert(e?.response?.data?.detail ?? "Failed."); }
        finally { setSubmitting(false); }
    }

    const allAnswered = answers.every(a => a >= 0);

    return (
        <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{type === "phq9" ? "9-question depression screening tool" : "7-question anxiety screening tool"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
                {result ? (
                    <div className="space-y-4">
                        <div className={`rounded-2xl border p-5 ${SEVERITY_STYLE[result.severity] ?? "bg-slate-50 border-slate-200"}`}>
                            <div className="text-3xl font-bold mb-1">{result.score}<span className="text-base font-normal ml-1">/ {type === "phq9" ? 27 : 21}</span></div>
                            <div className="text-lg font-semibold">{result.severity}</div>
                        </div>
                        {result.safety_message && (
                            <div className="flex gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <div>{result.safety_message}</div>
                            </div>
                        )}
                        <Button variant="secondary" onClick={() => { setResult(null); setAnswers(Array(questions.length).fill(-1)); }}>Retake</Button>
                    </div>
                ) : (
                    <>
                        {questions.map((q, i) => (
                            <div key={i}>
                                <div className="text-sm font-medium text-slate-800 mb-2"><span className="text-blue-600 font-semibold mr-1">{i + 1}.</span>{q}</div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {ANSWER_OPTIONS.map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setAnswer(i, opt.value)}
                                            className={["rounded-xl border px-3 py-2 text-left text-sm transition-all", answers[i] === opt.value ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                            <span className="font-semibold mr-1">{opt.value}</span> — {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button onClick={submit} disabled={submitting || !allAnswered}>{submitting ? "Scoring…" : "Submit Assessment"}</Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function MentalWellness() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<"phq9" | "gad7">("phq9");

    useEffect(() => {
        apiClient.get("/patient/mental/history").then(r => setHistory(r.data)).catch(() => { });
    }, []);

    const chartData = [...history].reverse().slice(-12).map(h => ({
        date: new Date(h.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        score: h.score, type: h.type.toUpperCase(),
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Mental Wellness" subtitle="Standardized PHQ-9 (depression) and GAD-7 (anxiety) self-assessments. Results are not diagnoses." />
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-800">
                ℹ️ These are standardized screening tools. They are designed to help you track your mental wellness over time, not to provide clinical diagnoses. If you are in crisis, please contact a mental health professional immediately.
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {(["phq9", "gad7"] as const).map(t => (
                    <button key={t} onClick={() => setActiveTab(t)}
                        className={["rounded-xl border px-5 py-2 text-sm font-medium transition-all", activeTab === t ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"].join(" ")}>
                        {t === "phq9" ? "PHQ-9 (Depression)" : "GAD-7 (Anxiety)"}
                    </button>
                ))}
            </div>

            {activeTab === "phq9" ? (
                <AssessmentPanel type="phq9" questions={PHQ9_QUESTIONS} title="PHQ-9: Depression Screening" />
            ) : (
                <AssessmentPanel type="gad7" questions={GAD7_QUESTIONS} title="GAD-7: Anxiety Screening" />
            )}

            {history.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="text-base">Assessment History</CardTitle></CardHeader>
                    <CardContent>
                        {chartData.length > 1 && (
                            <div className="h-44 mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                        <YAxis tick={{ fontSize: 10 }} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div className="space-y-2">
                            {history.slice(0, 5).map(h => (
                                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">{h.type.toUpperCase()}</span>
                                    <span className="text-slate-600">{new Date(h.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                                    <span className="font-semibold">{h.score} pts</span>
                                    <span className={`text-xs rounded-full border px-2 py-0.5 ${SEVERITY_STYLE[h.severity] ?? "bg-slate-100"}`}>{h.severity}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
