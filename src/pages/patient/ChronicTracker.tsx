import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { HeartPulse, AlertCircle } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import apiClient from "@/lib/apiClient";

type BPLog = { id: string; value: { systolic: number; diastolic: number }; flagged: boolean; flag_label: string; guidance: string; created_at: string };

const BP_BADGE: Record<string, "green" | "blue" | "amber" | "red"> = {
    "Normal": "green", "Elevated": "blue", "Stage 1 Hypertension": "amber",
    "Stage 2 Hypertension": "red", "Hypertensive Crisis": "red",
};

export default function ChronicTracker() {
    const [systolic, setSystolic] = useState("");
    const [diastolic, setDiastolic] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<BPLog | null>(null);
    const [history, setHistory] = useState<BPLog[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        apiClient.get("/patient/chronic/history").then(r => setHistory(r.data)).catch(() => { });
    }, [result]);

    async function submit() {
        const sys = parseInt(systolic);
        const dia = parseInt(diastolic);
        if (isNaN(sys) || isNaN(dia) || sys < 60 || sys > 250 || dia < 40 || dia > 180) {
            setError("Enter valid BP values (systolic 60–250, diastolic 40–180)."); return;
        }
        setSubmitting(true); setError(null);
        try {
            const res = await apiClient.post("/patient/chronic", { systolic: sys, diastolic: dia });
            setResult(res.data);
            setSystolic(""); setDiastolic("");
        } catch (e: any) { setError(e?.response?.data?.detail ?? "Failed to log reading."); }
        finally { setSubmitting(false); }
    }

    const chartData = [...history].reverse().slice(-15).map(h => ({
        date: new Date(h.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        sys: h.value.systolic, dia: h.value.diastolic,
    }));

    return (
        <div className="space-y-6">
            <PageHeader title="Blood Pressure Tracker" subtitle="Log your BP readings to monitor trends and detect hypertension early." />

            {/* Log Form */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><HeartPulse size={17} className="text-red-500" />Log a Reading</CardTitle>
                    <CardDescription>Use a calibrated home BP monitor for accurate results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Systolic (top)</label>
                            <div className="relative">
                                <Input placeholder="e.g. 120" value={systolic} onChange={e => setSystolic(e.target.value)} className="pr-12 max-w-[140px]" type="number" min={60} max={250} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mmHg</span>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Diastolic (bottom)</label>
                            <div className="relative">
                                <Input placeholder="e.g. 80" value={diastolic} onChange={e => setDiastolic(e.target.value)} className="pr-12 max-w-[140px]" type="number" min={40} max={180} />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">mmHg</span>
                            </div>
                        </div>
                    </div>
                    {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"><AlertCircle size={14} />{error}</div>}
                    <Button onClick={submit} disabled={submitting || !systolic || !diastolic}>{submitting ? "Logging…" : "Log Reading"}</Button>
                </CardContent>
            </Card>

            {/* Latest Result */}
            {result && (
                <div className={`rounded-2xl border p-5 ${result.flagged ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
                    <div className="flex items-start gap-4">
                        <div>
                            <div className="text-3xl font-bold text-slate-900">{result.value.systolic}/{result.value.diastolic}</div>
                            <div className="text-xs text-slate-500 mt-0.5">mmHg (systolic/diastolic)</div>
                        </div>
                        <Badge variant={BP_BADGE[result.flag_label] ?? "default"}>{result.flag_label}</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{result.guidance}</p>
                </div>
            )}

            {/* Chart */}
            {history.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="text-base">BP Trend</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                    <YAxis domain={[50, 200]} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "120", fontSize: 9, fill: "#22c55e" }} />
                                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "80", fontSize: 9, fill: "#22c55e" }} />
                                    <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "S1", fontSize: 9, fill: "#f59e0b" }} />
                                    <Line type="monotone" dataKey="sys" name="Systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                                    <Line type="monotone" dataKey="dia" name="Diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        {/* History Table */}
                        <div className="mt-4 space-y-2">
                            {history.slice(0, 8).map(h => (
                                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                                    <span className="text-slate-500 text-xs">{new Date(h.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                                    <span className="font-bold text-slate-900">{h.value.systolic}/{h.value.diastolic}</span>
                                    <Badge variant={BP_BADGE[h.flag_label] ?? "default"}>{h.flag_label}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                ⚠️ Take readings at rest, sitting quietly for 5 minutes. Avoid caffeine and exercise for 30 minutes before measuring. Track trends over time, not single readings.
            </div>
        </div>
    );
}
