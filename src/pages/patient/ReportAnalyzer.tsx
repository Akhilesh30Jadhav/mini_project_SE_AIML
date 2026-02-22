import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { FileText, Upload, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { MedicalReport } from "@/lib/types";

const API_BASE = "http://127.0.0.1:8000";

function statusVariant(status?: string) {
  if (status === "analyzed") return "green";
  if (status === "analyzing") return "amber";
  if (status === "failed") return "red";
  return "default";
}

function flagVariant(flag: string) {
  const t = flag.toLowerCase();
  if (t.includes("high") || t.includes("elevat")) return "red";
  if (t.includes("low")) return "amber";
  if (t.includes("unknown")) return "default";
  return "default";
}

export default function ReportAnalyzer() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // per-report expand/collapse
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // If you later add a DB endpoint for history, call it here.
    setReports([]);
    setLoading(false);
  }, []);

  async function handleUpload() {
    if (!file) return;

    const filename = file.name;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/analyze-report`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Backend analysis failed");
      }

      const report: MedicalReport = await res.json();

      setReports((prev) => [report, ...prev]);
      setOpen((prev) => ({ ...prev, [report.id]: true })); // auto-open new report
    } catch (err) {
      console.error("Upload error:", err);

      const fallback: MedicalReport = {
        id: `err-${Date.now()}`,
        name: filename,
        uploadedAt: "Just now",
        status: "failed",
        flags: ["AI analysis failed"],
        summary: "The report was uploaded, but automated analysis could not be completed.",
        results: [],
      };

      setReports((prev) => [fallback, ...prev]);
      setOpen((prev) => ({ ...prev, [fallback.id]: true }));
    } finally {
      setUploading(false);
      setFile(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Analyzer"
        subtitle="Upload medical reports and get AI-powered clinical insights."
      />

      {/* Upload */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Upload Report</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <Button onClick={handleUpload} disabled={uploading || !file} className="sm:w-40">
            <Upload size={16} className="mr-2" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </CardContent>
      </Card>

      {/* Reports */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Analyzed Reports</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="text-sm text-slate-500">No reports uploaded yet.</div>
          ) : (
            reports.map((r) => {
              const isOpen = !!open[r.id];
              const results = (r as any).results ?? []; // keep safe if your type is optional

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        <FileText size={16} />
                        <span className="truncate">{r.name}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {r.uploadedAt ?? "—"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(r.status)}>{r.status ?? "—"}</Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setOpen((prev) => ({ ...prev, [r.id]: !isOpen }))}
                      >
                        {isOpen ? (
                          <>
                            <ChevronUp size={16} className="mr-1" /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} className="mr-1" /> Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Flags */}
                  {Array.isArray(r.flags) && r.flags.length > 0 && (
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
                      <div className="flex flex-wrap gap-2">
                        {r.flags.map((f) => (
                          <span
                            key={f}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                          >
                            <span className="mr-1 font-medium">•</span>
                            <span className="capitalize">{f}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {r.summary ? (
                    <div className="text-sm text-slate-600">{r.summary}</div>
                  ) : null}

                  {/* ✅ Results table */}
                  {isOpen && Array.isArray(results) && results.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Test</th>
                            <th className="px-4 py-3 text-left font-medium">Value</th>
                            <th className="px-4 py-3 text-left font-medium">Unit</th>
                            <th className="px-4 py-3 text-left font-medium">Reference</th>
                            <th className="px-4 py-3 text-left font-medium">Flag</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((x: any, idx: number) => (
                            <tr key={`${r.id}-${idx}`} className="border-t border-slate-200">
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {x.name ?? x.test ?? "—"}
                              </td>
                              <td className="px-4 py-3">{x.value ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-600">{x.unit ?? "—"}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {x.referenceRange ?? x.range ?? "—"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={flagVariant(String(x.flag ?? ""))}>
                                  {x.flag ?? "—"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* If no results */}
                  {isOpen && (!Array.isArray(results) || results.length === 0) ? (
                    <div className="text-xs text-slate-500">
                      No per-parameter results found for this report.
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
