import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Activity,
  FileText,
  CalendarClock,
  ShieldCheck,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { text: string; variant: "green" | "amber" | "red" | "default" };
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-600">{label}</div>
        {delta ? <Badge variant={delta.variant}>{delta.text}</Badge> : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">Demo data • Replace with real API later</div>
    </div>
  );
}

function Module({
  icon: Icon,
  title,
  description,
  chips,
  to,
  badge,
}: {
  icon: any;
  title: string;
  description: string;
  chips: string[];
  to: string;
  badge: { label: string; variant: "green" | "amber" | "blue" | "red" | "default" };
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-slate-50">
              <Icon size={18} className="text-slate-900" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Role-based access • Audit-ready logs (demo)</span>
          <Link to={to} className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
            Open <ArrowRight size={16} />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({
  n,
  title,
  desc,
  icon: Icon,
}: {
  n: string;
  title: string;
  desc: string;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
          <Icon size={18} className="text-slate-900" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">STEP {n}</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-sm font-semibold text-slate-900">{title}</span>
          </div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50">
              <Stethoscope size={16} className="text-slate-900" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">CareSphere</div>
              <div className="text-xs text-slate-500 hidden sm:block">All-in-one Healthcare Platform</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => nav("/login")}>
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
              AI-powered Healthcare Platform
            </h1>
            <p className="mt-2 sm:mt-3 text-base sm:text-lg text-slate-600">
              Risk Prediction, Medical Report Analyzer, and Appointment No-Show Insights — in one clean,
              clinician-friendly dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => nav("/login")}>Get Started</Button>
              <Button variant="secondary" onClick={() => document.getElementById("modules")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Modules
              </Button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Educational demo only. Not a medical diagnosis. Designed for semester evaluation and product demo.
            </div>

            {/* Trust strip */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="blue">Role-based portals</Badge>
              <Badge variant="green">Audit-ready history</Badge>
              <Badge variant="default">Export-ready reports (demo)</Badge>
              <Badge variant="amber">Model-agnostic backend ready</Badge>
            </div>
          </div>

          {/* KPI */}
          <div className="lg:col-span-5">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Operational Snapshot</CardTitle>
                <CardDescription>Realistic KPIs to make the project feel production-ready</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <StatCard label="Patients monitored" value="1,248" delta={{ text: "+6% WoW", variant: "green" }} />
                <StatCard label="Reports analyzed" value="312" delta={{ text: "Today", variant: "default" }} />
                <StatCard label="Avg risk score" value="0.41" delta={{ text: "Stable", variant: "default" }} />
                <StatCard label="No-show reduction" value="−12%" delta={{ text: "Pilot", variant: "green" }} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modules */}
        <section id="modules" className="mt-8 sm:mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">Core Modules</h2>
              <p className="mt-1 text-sm text-slate-600">
                Three integrated workflows: prediction, documents, and scheduling insights.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 size={16} /> Built with Vite + React + Tailwind
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Module
              icon={Activity}
              title="Risk Prediction"
              description="Diabetes/Heart risk scoring with explainability placeholders."
              chips={["Risk score", "Key drivers", "Triage badge"]}
              to="/patient/risk"
              badge={{ label: "Patient", variant: "blue" }}
            />
            <Module
              icon={FileText}
              title="Report Analyzer"
              description="Upload PDFs → extracted values → abnormal flags → summary."
              chips={["PDF upload", "Lab table", "Abnormal flags"]}
              to="/patient/reports"
              badge={{ label: "Patient", variant: "blue" }}
            />
            <Module
              icon={CalendarClock}
              title="No-Show Insights"
              description="Predict no-show probability + recommend reminders."
              chips={["Probability", "Factors", "Reminder plan"]}
              to="/patient/appointments"
              badge={{ label: "Patient", variant: "blue" }}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="mt-8 sm:mt-10">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">How it works</h2>
          <p className="mt-1 text-sm text-slate-600">
            Simple, explainable workflow suitable for a healthcare product demo.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Step
              n="01"
              icon={ClipboardList}
              title="Capture input"
              desc="Vitals, lab PDFs, and appointment metadata are collected from the UI (demo forms)."
            />
            <Step
              n="02"
              icon={Activity}
              title="Generate insights"
              desc="Run prediction + extract report values + compute no-show risk (mock now, API later)."
            />
            <Step
              n="03"
              icon={ShieldCheck}
              title="Review & store"
              desc="Role-based dashboards with history logs for auditability and future export."
            />
          </div>
        </section>

        {/* Compliance / Trust */}
        <section className="mt-8 sm:mt-10">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Security & Compliance (demo-ready)</div>
                <div className="mt-1 text-sm text-slate-600">
                  Labels included for presentation: access control, encryption, audit logs, and secure storage.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="green">RBAC</Badge>
                <Badge variant="blue">Audit Logs</Badge>
                <Badge variant="default">Encryption at rest</Badge>
                <Badge variant="default">Secure upload</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} CareSphere • Semester Project Demo</div>
            <div className="flex items-center gap-3">
              <Link className="hover:text-slate-700" to="/login">
                Login
              </Link>
              <span className="text-slate-300">|</span>
              <span>Not for clinical use</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
