import PageHeader from "@/components/common/PageHeader";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Activity,
  CalendarClock,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatPct } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";


/* -------------------- Demo Data -------------------- */

const trend = [
  { day: "Mon", risk: 0.33 },
  { day: "Tue", risk: 0.38 },
  { day: "Wed", risk: 0.41 },
  { day: "Thu", risk: 0.45 },
  { day: "Fri", risk: 0.43 },
  { day: "Sat", risk: 0.4 },
  { day: "Sun", risk: 0.41 },
];

const appts = [
  { time: "10:30 AM", doctor: "Dr. Mehta", type: "Follow-up", status: "Confirmed" },
  { time: "12:15 PM", doctor: "Dr. Rao", type: "Lab review", status: "Pending" },
  { time: "04:00 PM", doctor: "Dr. Singh", type: "Consult", status: "Confirmed" },
];

const activityLog = [
  {
    title: "Risk prediction updated",
    meta: "Diabetes risk: 41% • Key driver: glucose",
    badge: { label: "Clinical", variant: "blue" as const },
  },
  {
    title: "Report analyzed",
    meta: "CBC report uploaded • 2 abnormal flags",
    badge: { label: "Docs", variant: "amber" as const },
  },
  {
    title: "No-show insights generated",
    meta: "Probability: 18% • Reminder plan suggested",
    badge: { label: "Ops", variant: "green" as const },
  },
];

/* -------------------- Components -------------------- */
function KPI({
  icon: Icon,
  label,
  value,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  badge?: {
    label: string;
    variant: "green" | "amber" | "red" | "blue" | "default";
  };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
            <Icon size={18} className="text-slate-900" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {value}
            </div>
          </div>
        </div>

        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Demo KPI • replace with API later
      </div>
    </div>
  );
}



/* -------------------- PAGE (DEFAULT EXPORT) -------------------- */

export default function PatientDetail() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Dashboard"
        subtitle="Your clinical overview: risk, reports, appointments, and history."
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPI
          icon={Activity}
          label="Current risk score"
          value="0.41"
          badge={{ label: "Stable", variant: "blue" }}
        />
        <KPI
          icon={FileText}
          label="Reports analyzed"
          value="3"
          badge={{ label: "This week", variant: "amber" }}
        />
        <KPI
          icon={CalendarClock}
          label="Next appointment"
          value="10:30 AM"
          badge={{ label: "Today", variant: "green" }}
        />
        <KPI
          icon={ShieldCheck}
          label="Profile status"
          value="Complete"
          badge={{ label: "Verified", variant: "green" }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Risk Trend */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Risk Trend</CardTitle>
              <CardDescription>
                7-day trend for monitoring changes
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/patient/risk">
                <Button size="sm">View details</Button>
              </Link>
              <Link to="/patient/history">
                <Button size="sm" variant="secondary">
                  History
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <Tooltip formatter={(v) => formatPct(Number(v))} />
                <Line
                  type="monotone"
                  dataKey="risk"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>What changed recently</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLog.map((a) => (
              <div
                key={a.title}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {a.meta}
                    </div>
                  </div>
                  <Badge variant={a.badge.variant}>{a.badge.label}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card className="lg:col-span-3 rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex justify-between">
            <div>
              <CardTitle className="text-base">
                Upcoming Appointments
              </CardTitle>
              <CardDescription>
                Operational view
              </CardDescription>
            </div>
            <Link to="/patient/appointments">
              <Button size="sm" variant="secondary">
                Open scheduling
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Doctor</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appts.map((a) => (
                    <tr key={a.time} className="border-t">
                      <td className="px-4 py-3">{a.time}</td>
                      <td className="px-4 py-3">{a.doctor}</td>
                      <td className="px-4 py-3">{a.type}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            a.status === "Confirmed" ? "green" : "amber"
                          }
                        >
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
