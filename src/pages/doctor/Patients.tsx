import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/Input";
import apiClient from "@/lib/apiClient";

type PatientRow = { id: string; name: string; email: string; age?: number; gender?: string; last_triage?: string; last_phq9_severity?: string; deficiency_count: number; last_bp_flag?: string };
const TRIAGE_V: Record<string, "green" | "amber" | "red"> = { Low: "green", Medium: "amber", High: "red" };

export default function Patients() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    apiClient.get("/doctor/patients").then(r => setPatients(r.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" subtitle={`${patients.length} registered patients — click to view full health summary`} />
      <div className="max-w-xs">
        <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? <div className="text-center py-12 text-slate-500">Loading…</div> : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No patients found.</div>
          ) : (
            <div className="space-y-0 divide-y divide-slate-100">
              {filtered.map(p => (
                <Link key={p.id} to={`/doctor/patients/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.email} · {p.age ? `${p.age} yrs` : "Age N/A"} · {p.gender ?? "Gender N/A"}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {p.last_triage && <Badge variant={TRIAGE_V[p.last_triage] ?? "default"}>{p.last_triage}</Badge>}
                    {p.deficiency_count > 0 && <Badge variant="amber">{p.deficiency_count} def</Badge>}
                    {p.last_bp_flag && p.last_bp_flag !== "Normal" && <Badge variant="red">⚠ BP</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
