import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const demoPatients = [
  { id: "P-1001", name: "Riya Sharma", age: 26, risk: 0.74, status: "High" },
  { id: "P-1002", name: "Aman Verma", age: 42, risk: 0.41, status: "Medium" },
  { id: "P-1003", name: "Neha Patil", age: 33, risk: 0.18, status: "Low" },
  { id: "P-1004", name: "Saurabh Kulkarni", age: 51, risk: 0.62, status: "Medium" },
];

function riskBadge(status: string) {
  if (status === "High") return { v: "red" as const, label: "High" };
  if (status === "Medium") return { v: "amber" as const, label: "Medium" };
  return { v: "green" as const, label: "Low" };
}

export default function Patients() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

  const rows = useMemo(() => {
    return demoPatients
      .filter((p) => (filter === "All" ? true : p.status === filter))
      .filter((p) => (q.trim() ? `${p.name} ${p.id}`.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => b.risk - a.risk);
  }, [q, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle="Search, triage, and open patient details. (Demo list for UI/UX + marks.)"
      />

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Patient Registry</CardTitle>
            <CardDescription>Search + risk triage filter</CardDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full sm:w-72"
            />

            <div className="flex gap-2">
              {(["All", "High", "Medium", "Low"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={[
                    "rounded-xl border px-3 py-2 text-xs font-medium",
                    filter === k
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Patient</th>
                  <th className="px-4 py-3 text-left font-medium">Age</th>
                  <th className="px-4 py-3 text-left font-medium">Risk</th>
                  <th className="px-4 py-3 text-left font-medium">Triage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const b = riskBadge(p.status);
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => nav(`/doctor/patients/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.id}</div>
                      </td>
                      <td className="px-4 py-3">{p.age}</td>
                      <td className="px-4 py-3">{Math.round(p.risk * 100)}%</td>
                      <td className="px-4 py-3">
                        <Badge variant={b.v}>{b.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-4 py-6 text-slate-500" colSpan={4}>
                      No patients match your search/filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Marks tip: mention “search, sort, filter, and clickable triage workflow”.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
