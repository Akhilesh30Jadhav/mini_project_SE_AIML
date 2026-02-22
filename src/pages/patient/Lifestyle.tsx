import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/apiClient";

const QUESTIONS = [
    { id: "exercise_days", text: "How many days per week do you exercise (at least 30 min)?", options: [{ label: "0 days", value: 0 }, { label: "1–2 days", value: 1 }, { label: "3–4 days", value: 2 }, { label: "5+ days", value: 3 }] },
    { id: "exercise_intensity", text: "What is your typical exercise intensity?", options: [{ label: "None", value: 0 }, { label: "Light (walking)", value: 1 }, { label: "Moderate (jogging, cycling)", value: 2 }, { label: "Vigorous (HIIT, running)", value: 3 }] },
    { id: "sleep_hours", text: "How many hours of sleep do you get on average?", options: [{ label: "Less than 5 hours", value: 0 }, { label: "5–6 hours", value: 1 }, { label: "7–8 hours (recommended)", value: 2 }, { label: "More than 9 hours", value: 3 }] },
    { id: "diet_quality", text: "How would you describe your daily diet?", options: [{ label: "Mostly junk/processed food", value: 0 }, { label: "Mix of healthy and unhealthy", value: 1 }, { label: "Mostly healthy, home-cooked", value: 2 }, { label: "Balanced, nutrient-rich meals", value: 3 }] },
    { id: "fruits_vegetables", text: "How many servings of fruits/vegetables per day?", options: [{ label: "None or rarely", value: 0 }, { label: "1–2 servings", value: 1 }, { label: "3–4 servings", value: 2 }, { label: "5+ servings", value: 3 }] },
    { id: "water_intake", text: "How much water do you drink daily?", options: [{ label: "Less than 1 litre", value: 0 }, { label: "1–2 litres", value: 1 }, { label: "2–3 litres", value: 2 }, { label: "3+ litres", value: 3 }] },
    { id: "smoking", text: "Do you smoke?", options: [{ label: "Yes, daily", value: 0 }, { label: "Occasionally", value: 1 }, { label: "Quit smoking", value: 2 }, { label: "Never smoked", value: 3 }] },
    { id: "alcohol", text: "How often do you consume alcohol?", options: [{ label: "Daily", value: 0 }, { label: "Several times a week", value: 1 }, { label: "Occasionally", value: 2 }, { label: "Rarely or never", value: 3 }] },
    { id: "stress_level", text: "How would you rate your daily stress level?", options: [{ label: "Very high (constantly stressed)", value: 0 }, { label: "High", value: 1 }, { label: "Moderate", value: 2 }, { label: "Low (rarely stressed)", value: 3 }] },
    { id: "screen_time", text: "Hours of recreational screen time per day?", options: [{ label: "6+ hours", value: 0 }, { label: "4–6 hours", value: 1 }, { label: "2–4 hours", value: 2 }, { label: "Less than 2 hours", value: 3 }] },
    { id: "sedentary_hours", text: "How many hours per day do you sit/remain sedentary?", options: [{ label: "10+ hours", value: 0 }, { label: "7–9 hours", value: 1 }, { label: "4–6 hours", value: 2 }, { label: "Less than 4 hours", value: 3 }] },
    { id: "outdoor_time", text: "How often do you spend time outdoors?", options: [{ label: "Rarely or never", value: 0 }, { label: "1–2 times a week", value: 1 }, { label: "3–5 times a week", value: 2 }, { label: "Daily", value: 3 }] },
];

const CATEGORY_COLOR: Record<string, string> = {
    "Very Active": "bg-green-100 text-green-800 border-green-200",
    "Active": "bg-blue-100 text-blue-800 border-blue-200",
    "Somewhat Active": "bg-amber-100 text-amber-800 border-amber-200",
    "Lazy": "bg-red-100 text-red-800 border-red-200",
};

type HistoryItem = { id: string; score: number; category: string; created_at: string };

export default function Lifestyle() {
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; category: string } | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        apiClient.get("/patient/lifestyle").then(r => setHistory(r.data)).catch(() => { });
    }, [result]);

    function setAnswer(id: string, val: number) {
        setAnswers(a => ({ ...a, [id]: val }));
    }

    async function submit() {
        if (Object.keys(answers).length < QUESTIONS.length) { alert("Please answer all questions before submitting."); return; }
        setSubmitting(true);
        try {
            const res = await apiClient.post("/patient/lifestyle", { answers });
            setResult(res.data);
        } catch (e: any) { alert(e?.response?.data?.detail ?? "Submission failed."); }
        finally { setSubmitting(false); }
    }

    const chartData = [...history].reverse().slice(-10).map(h => ({
        date: new Date(h.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        score: h.score,
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Lifestyle Assessment" subtitle="Answer 12 questions to get your personalized lifestyle score (0–100)." />

            {result && (
                <div className="rounded-2xl border p-6 text-center shadow-sm bg-white">
                    <div className="text-5xl font-bold text-slate-900 mb-2">{result.score}<span className="text-xl text-slate-500">/100</span></div>
                    <div className={`inline-block rounded-full border px-4 py-1.5 text-sm font-semibold ${CATEGORY_COLOR[result.category] ?? "bg-slate-100 text-slate-700"}`}>{result.category}</div>
                    <p className="mt-3 text-sm text-slate-500">Your lifestyle score has been recorded. Scroll down to see trends.</p>
                    <Button variant="secondary" className="mt-3" onClick={() => { setResult(null); setAnswers({}); }}>Take again</Button>
                </div>
            )}

            {!result && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Lifestyle Questionnaire</CardTitle>
                        <CardDescription>Answer honestly for an accurate score. Takes ~2 minutes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {QUESTIONS.map((q, i) => (
                            <div key={q.id}>
                                <div className="text-sm font-medium text-slate-800 mb-2"><span className="text-blue-600 font-semibold mr-1">{i + 1}.</span>{q.text}</div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {q.options.map(opt => (
                                        <button key={opt.value} type="button" onClick={() => setAnswer(q.id, opt.value)}
                                            className={["rounded-xl border px-3 py-2 text-left text-sm transition-all", answers[q.id] === opt.value ? "border-blue-500 bg-blue-50 text-blue-800 font-medium" : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"].join(" ")}>
                                            <span className="flex items-center gap-2">
                                                {answers[q.id] === opt.value && <CheckCircle2 size={13} className="text-blue-600 shrink-0" />}
                                                {opt.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button onClick={submit} disabled={submitting || Object.keys(answers).length < QUESTIONS.length}>
                            {submitting ? "Calculating…" : `Submit (${Object.keys(answers).length}/${QUESTIONS.length} answered)`}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {history.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Score History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-3 space-y-2">
                            {history.slice(0, 5).map(h => (
                                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="text-slate-600">{new Date(h.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                                    <span className="font-semibold text-slate-900">{h.score}/100</span>
                                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLOR[h.category] ?? ""}`}>{h.category}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
