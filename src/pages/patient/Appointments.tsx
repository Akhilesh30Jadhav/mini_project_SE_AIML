import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RiskGauge } from "@/components/common/RiskGauge";
import { CalendarClock, Phone, Globe, PersonStanding, Search, Download, Bell } from "lucide-react";

import { api } from "@/lib/api";
import type { Appointment } from "@/lib/types";

type RiskLevel = "Low" | "Medium" | "High";

function riskLevel(score: number): RiskLevel {
  if (score < 0.25) return "Low";
  if (score < 0.6) return "Medium";
  return "High";
}

function riskBadge(score: number) {
  const lvl = riskLevel(score);
  const variant = lvl === "Low" ? "green" : lvl === "Medium" ? "amber" : "red";
  return <Badge variant={variant}>{lvl}</Badge>;
}

function channelIcon(ch: Appointment["channel"]) {
  if (ch === "Online") return <Globe size={14} />;
  if (ch === "Phone") return <Phone size={14} />;
  return <PersonStanding size={14} />;
}

export default function Appointments() {
  // Form state
  const [channel, setChannel] = useState<Appointment["channel"]>("Online");
  const [leadDays, setLeadDays] = useState(5);
  const [score, setScore] = useState(0.2);

  // Data state
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [q, setQ] = useState("");

  // Load from API
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const data = await api.listAppointments();
      if (!alive) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const recommendation = useMemo(() => {
    if (score < 0.25) return ["1 reminder (24 hrs)"];
    if (score < 0.6) return ["24 hrs", "2 hrs"];
    return ["48 hrs", "24 hrs", "2 hrs", "Call follow-up"];
  }, [score]);

  const drivers = useMemo(() => {
    const d: string[] = [];
    if (leadDays >= 7) d.push("Long lead time");
    if (leadDays <= 1) d.push("Very short notice");
    if (channel === "Phone") d.push("Phone booking");
    if (channel === "Walk-in") d.push("Walk-in booking");
    if (d.length === 0) d.push("Stable pattern");
    return d;
  }, [leadDays, channel]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) => `${r.patientName} ${r.id} ${r.when}`.toLowerCase().includes(t));
  }, [rows, q]);

  const kpis = useMemo(() => {
    const total = rows.length;
    const predictedNoShow = rows.filter((r) => r.noShowScore >= 0.6).length;
    const confirmed = rows.filter((r) => r.status === "Confirmed").length;
    return { total, predictedNoShow, confirmed };
  }, [rows]);

  function predictDemo() {
    let base = 0.15 + Math.min(0.5, leadDays * 0.03);
    if (channel === "Phone") base += 0.05;
    if (channel === "Walk-in") base += 0.08;
    base = Math.max(0.05, Math.min(0.95, base + (Math.random() - 0.5) * 0.1));
    setScore(Number(base.toFixed(2)));
  }

  async function saveToQueue() {
    setSaving(true);
    try {
      const newRow = await api.createAppointment({
        patientId: "P-001",
        patientName: "New Patient (demo)",
        when: `${leadDays <= 1 ? "Tomorrow" : `In ${leadDays} days`} • 11:00 AM`,
        channel,
        status: "Pending",
        noShowScore: score,
      });
      setRows((prev) => [newRow, ...prev]);
    } finally {
      setSaving(false);
    }
  }

  async function confirmAppt(id: string) {
    setConfirmingId(id);
    try {
      const updated = await api.confirmAppointment(id);
      if (!updated) return;
      setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments & No-Show"
        subtitle="Predict no-show risk and generate a reminder plan (API-ready demo)."
      />

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-600">Appointments in queue</div>
            <CalendarClock size={16} className="text-slate-700" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "…" : kpis.total}
          </div>
          <div className="mt-1 text-xs text-slate-500">From api.listAppointments()</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-600">High risk no-shows</div>
            <Badge variant={!loading && kpis.predictedNoShow > 0 ? "red" : "green"}>
              {!loading && kpis.predictedNoShow > 0 ? "Attention" : "OK"}
            </Badge>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "…" : kpis.predictedNoShow}
          </div>
          <div className="mt-1 text-xs text-slate-500">Score ≥ 0.60</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-600">Confirmed</div>
            <Badge variant="green">Live</Badge>
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {loading ? "…" : kpis.confirmed}
          </div>
          <div className="mt-1 text-xs text-slate-500">Feedback loop effect</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Create */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Create Appointment</CardTitle>
            <CardDescription>Predict risk + save to queue (API-backed demo).</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Time</label>
                <Input type="time" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Booking Channel</label>
                <Select value={channel} onChange={(e) => setChannel(e.target.value as any)}>
                  <option>Online</option>
                  <option>Phone</option>
                  <option>Walk-in</option>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Days until appointment</label>
                <Input
                  type="number"
                  value={leadDays}
                  min={0}
                  onChange={(e) => setLeadDays(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={predictDemo}>Predict No-Show (Demo)</Button>
              <Button variant="secondary" onClick={saveToQueue} disabled={saving}>
                {saving ? "Saving…" : "Save to Queue"}
              </Button>
              <Button variant="secondary" disabled>
                <Download size={16} className="mr-2" />
                Export
              </Button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Why this score?</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {drivers.map((d) => (
                  <span
                    key={d}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Later: show SHAP-style drivers from your ML endpoint.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">No-Show Result</CardTitle>
              <CardDescription>Probability + reminder plan (demo UI).</CardDescription>
            </div>
            {riskBadge(score)}
          </CardHeader>

          <CardContent className="space-y-4">
            <RiskGauge value={score} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-900">Recommended Reminders</div>
                <Badge variant="blue">Automation-ready</Badge>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {recommendation.map((r) => (
                  <Badge key={r} variant="blue">
                    {r}
                  </Badge>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled>
                  <Bell size={16} className="mr-2" />
                  Send reminders (demo)
                </Button>
                <Button size="sm" variant="secondary" disabled>
                  Mark confirmed
                </Button>
              </div>

              <div className="mt-3 text-xs text-slate-500">
                Later: hook to SMS/WhatsApp/Email service.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue table */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-base">Appointment Queue</CardTitle>
            <CardDescription>Search + triage to reduce no-shows</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9 w-72"
                placeholder="Search patient / id / day..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" disabled>
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Patient</th>
                  <th className="px-4 py-3 text-left font-medium">When</th>
                  <th className="px-4 py-3 text-left font-medium">Channel</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">No-show</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-slate-500">
                      Loading appointments…
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map((r) => (
                      <tr key={r.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{r.patientName}</div>
                          <div className="text-xs text-slate-500">{r.id}</div>
                        </td>
                        <td className="px-4 py-3">{r.when}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                            {channelIcon(r.channel)} {r.channel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === "Confirmed" ? "green" : "amber"}>{r.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {riskBadge(r.noShowScore)}
                            <span className="text-xs text-slate-600">{Math.round(r.noShowScore * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => confirmAppt(r.id)}
                            disabled={confirmingId === r.id || r.status === "Confirmed"}
                          >
                            {confirmingId === r.id ? "Confirming…" : "Confirm"}
                          </Button>
                        </td>
                      </tr>
                    ))}

                    {filtered.length === 0 ? (
                      <tr className="border-t border-slate-200">
                        <td className="px-4 py-6 text-slate-500" colSpan={6}>
                          No appointments match your search.
                        </td>
                      </tr>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            This page now consumes a centralized demo API layer (easy to swap with FastAPI later).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
