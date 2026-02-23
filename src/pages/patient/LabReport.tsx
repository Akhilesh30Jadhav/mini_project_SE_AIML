import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import apiClient from "@/lib/apiClient";
import { Upload, FileText, Plus, Trash2, AlertTriangle, CheckCircle2, Info } from "lucide-react";

type LabResult = {
    test_name: string; value: number; unit: string; status: string;
    ref_range_low?: number; ref_range_high?: number;
    deficiency_name?: string; explanation?: string;
};
type Report = { id: string; report_date: string; results: LabResult[]; deficiency_summary: string[] };

const STATUS_BADGE: Record<string, "green" | "amber" | "red"> = { normal: "green", low: "red", high: "amber" };

export default function LabReport() {
    const [tab, setTab] = useState<"upload" | "manual">("upload");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Report | null>(null);
    const [error, setError] = useState("");
    const [pastReports, setPastReports] = useState<Report[]>([]);

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // Manual state
    const [rows, setRows] = useState([{ test_name: "", value: "", unit: "" }]);

    useEffect(() => {
        apiClient.get("/patient/labs").then(r => setPastReports(r.data)).catch(() => { });
    }, [result]);

    // ── Upload handlers ──
    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type === "application/pdf") setFile(f);
        else setError("Please drop a PDF file.");
    }, []);

    async function handleUpload() {
        if (!file) return;
        setLoading(true); setError(""); setResult(null);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await apiClient.post("/patient/labs/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setResult(res.data);
            setFile(null);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Upload failed. Try again.");
        } finally { setLoading(false); }
    }

    // ── Manual handlers ──
    function addRow() { setRows([...rows, { test_name: "", value: "", unit: "" }]); }
    function removeRow(i: number) { setRows(rows.filter((_, idx) => idx !== i)); }
    function updateRow(i: number, field: string, val: string) {
        const copy = [...rows]; (copy[i] as any)[field] = val; setRows(copy);
    }

    async function handleManual() {
        const validRows = rows.filter(r => r.test_name && r.value);
        if (!validRows.length) { setError("Add at least one test result."); return; }
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await apiClient.post("/patient/labs/report", {
                report_date: new Date().toISOString().slice(0, 10),
                results: validRows.map(r => ({ test_name: r.test_name, value: parseFloat(r.value), unit: r.unit || undefined })),
            });
            setResult(res.data);
            setRows([{ test_name: "", value: "", unit: "" }]);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Analysis failed.");
        } finally { setLoading(false); }
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Lab Report Analyzer" subtitle="Upload your blood report PDF for instant AI-powered analysis, or enter values manually." />

            {/* ── Tab switcher ── */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                <button onClick={() => { setTab("upload"); setError(""); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "upload" ? "bg-white shadow text-blue-700" : "text-slate-600 hover:text-slate-900"}`}>
                    <Upload size={16} /> Upload PDF
                </button>
                <button onClick={() => { setTab("manual"); setError(""); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "manual" ? "bg-white shadow text-blue-700" : "text-slate-600 hover:text-slate-900"}`}>
                    <FileText size={16} /> Manual Entry
                </button>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* ── Upload Tab ── */}
            {tab === "upload" && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardContent className="p-6 space-y-4">
                        <div
                            onDrop={onDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-all cursor-pointer
                                ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50"}`}
                            onClick={() => document.getElementById("pdf-input")?.click()}
                        >
                            <input id="pdf-input" type="file" accept=".pdf" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                            <div className="flex flex-col items-center gap-3">
                                <div className={`rounded-2xl p-4 ${dragOver ? "bg-blue-100" : "bg-white border border-slate-200"}`}>
                                    <Upload size={32} className={dragOver ? "text-blue-600" : "text-slate-400"} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {file ? file.name : "Drop your blood report PDF here"}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {file ? `${(file.size / 1024).toFixed(0)} KB — Ready to analyze` : "or click to browse · PDF only · Digital reports work best"}
                                    </p>
                                </div>
                                {file && (
                                    <button onClick={e => { e.stopPropagation(); setFile(null); }}
                                        className="text-xs text-red-500 hover:text-red-700 underline">Remove file</button>
                                )}
                            </div>
                        </div>

                        <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
                            {loading ? "Analyzing report…" : "🔬 Analyze Report"}
                        </Button>

                        <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <Info size={14} className="mt-0.5 shrink-0" />
                            <span>Supports 25+ lab tests including CBC, Lipid Panel, Liver/Kidney function, Thyroid, Vitamins, Minerals and more. Works best with digital (non-scanned) lab reports.</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Manual Tab ── */}
            {tab === "manual" && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Enter Lab Values</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {rows.map((row, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                <div className="flex-1">
                                    {i === 0 && <label className="block text-xs font-medium text-slate-600 mb-1">Test Name</label>}
                                    <Input value={row.test_name} onChange={e => updateRow(i, "test_name", e.target.value)}
                                        placeholder="e.g. Hemoglobin" />
                                </div>
                                <div className="w-full sm:w-28">
                                    {i === 0 && <label className="block text-xs font-medium text-slate-600 mb-1">Value</label>}
                                    <Input type="number" value={row.value} onChange={e => updateRow(i, "value", e.target.value)}
                                        placeholder="12.5" />
                                </div>
                                <div className="w-full sm:w-24">
                                    {i === 0 && <label className="block text-xs font-medium text-slate-600 mb-1">Unit</label>}
                                    <Input value={row.unit} onChange={e => updateRow(i, "unit", e.target.value)}
                                        placeholder="g/dL" />
                                </div>
                                {rows.length > 1 && (
                                    <button onClick={() => removeRow(i)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                )}
                            </div>
                        ))}
                        <button onClick={addRow} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            <Plus size={14} /> Add another test
                        </button>
                        <Button onClick={handleManual} disabled={loading} className="w-full mt-2">
                            {loading ? "Analyzing…" : "Analyze Results"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Analysis Result ── */}
            {result && (
                <Card className="rounded-2xl border-blue-200 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            Analysis Complete — {result.results.length} tests analyzed
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {result.deficiency_summary.length > 0 && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                                <p className="font-semibold text-red-800 text-sm mb-2">⚠️ Deficiencies Detected</p>
                                <div className="flex flex-wrap gap-2">
                                    {result.deficiency_summary.map((d, i) => <Badge key={i} variant="red">{d}</Badge>)}
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left">
                                        <th className="pb-2 font-medium text-slate-600">Test</th>
                                        <th className="pb-2 font-medium text-slate-600">Value</th>
                                        <th className="pb-2 font-medium text-slate-600">Ref Range</th>
                                        <th className="pb-2 font-medium text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {result.results.map((r, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-2.5 font-medium text-slate-900">{r.test_name}</td>
                                            <td className="py-2.5 text-slate-700">{r.value} {r.unit}</td>
                                            <td className="py-2.5 text-slate-500 text-xs">
                                                {r.ref_range_low != null && r.ref_range_high != null
                                                    ? `${r.ref_range_low} – ${r.ref_range_high}`
                                                    : "—"}
                                            </td>
                                            <td className="py-2.5">
                                                <Badge variant={STATUS_BADGE[r.status] || "default"}>
                                                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {result.results.some(r => r.explanation) && (
                            <div className="space-y-2 mt-2">
                                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Explanations</p>
                                {result.results.filter(r => r.explanation).map((r, i) => (
                                    <div key={i} className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                                        <span className="font-semibold text-sm text-amber-900">{r.test_name}:</span>{" "}
                                        <span className="text-sm text-amber-800">{r.explanation}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Past Reports ── */}
            {pastReports.length > 0 && (
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader><CardTitle className="text-base">Past Reports</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pastReports.map((rpt, idx) => (
                                <details key={idx} className="group rounded-xl border border-slate-200 overflow-hidden">
                                    <summary className="px-4 py-3 cursor-pointer bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-800 flex justify-between items-center">
                                        <span>📋 Report — {rpt.report_date}</span>
                                        <span className="text-xs text-slate-500">{rpt.results?.length ?? 0} tests</span>
                                    </summary>
                                    <div className="px-4 py-3">
                                        <table className="w-full text-xs">
                                            <thead><tr className="border-b text-left text-slate-500">
                                                <th className="pb-1">Test</th><th className="pb-1">Value</th><th className="pb-1">Status</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {(rpt.results ?? []).map((r, ri) => (
                                                    <tr key={ri}>
                                                        <td className="py-1.5 text-slate-800">{r.test_name}</td>
                                                        <td className="py-1.5 text-slate-600">{r.value} {r.unit}</td>
                                                        <td className="py-1.5"><Badge variant={STATUS_BADGE[r.status] || "default"}>{r.status}</Badge></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── Disclaimer ── */}
            <p className="text-xs text-slate-400 text-center max-w-lg mx-auto">
                ⚕️ This analysis is for informational purposes only, not medical advice. Values are compared against general reference ranges — always consult your doctor for interpretation.
            </p>
        </div>
    );
}
