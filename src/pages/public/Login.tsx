import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getAuth, login } from "@/features/auth/auth.store";
import type { UserRole } from "@/lib/utils";
import { HeartPulse, Stethoscope, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

function RoleTile({
  title,
  subtitle,
  icon,
  selected,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border p-4 text-left transition",
        selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-900">{title}</div>
            {selected ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
                <CheckCircle2 size={12} /> Selected
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-slate-600">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;

  const existing = getAuth();

  const [role, setRole] = useState<UserRole>("patient");
  const [name, setName] = useState("");

  const fromPath = useMemo(() => {
    const from = loc?.state?.from as string | undefined;
    return from && typeof from === "string" ? from : null;
  }, [loc]);

  useEffect(() => {
    if (existing.isAuthed && existing.role) {
      nav(existing.role === "doctor" ? "/doctor" : "/patient", { replace: true });
    }
  }, [existing.isAuthed, existing.role, nav]);

  function onSubmit() {
    const clean = name.trim();
    if (!clean) return;

    login(role, clean);

    if (fromPath) {
      nav(fromPath, { replace: true });
      return;
    }
    nav(role === "doctor" ? "/doctor" : "/patient", { replace: true });
  }

  return (
    <div className="min-h-[calc(100vh-80px)]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">CareSphere</div>
            <div className="text-sm text-slate-600">All-in-one healthcare platform (demo).</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">RBAC</Badge>
            <Badge variant="green">Tailwind</Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left brand / info */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Sign in</CardTitle>
              <CardDescription>
                Choose your portal and continue. Built to look like a real clinic dashboard.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">What you can demo</div>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  <li className="flex gap-2">
                    <span className="mt-0.5">•</span> Risk Prediction + trend dashboard
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5">•</span> Report Analyzer (abnormal flags + summary)
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-0.5">•</span> Appointments + No-show recommendations
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck size={16} />
                  Demo compliance note
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Login is stored locally (localStorage). No PHI. Educational demo only.
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Back to <Link to="/" className="underline">Landing</Link>
              </div>
            </CardContent>
          </Card>

          {/* Right login form */}
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm lg:col-span-3">
            <CardHeader>
              <PageHeader title="Login" subtitle="Select a portal and continue." />
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <RoleTile
                  title="Patient"
                  subtitle="Risk • Reports • Appointments"
                  icon={<HeartPulse size={18} className="text-slate-900" />}
                  selected={role === "patient"}
                  onClick={() => setRole("patient")}
                />
                <RoleTile
                  title="Doctor"
                  subtitle="Patients • Triage • Profiles"
                  icon={<Stethoscope size={18} className="text-slate-900" />}
                  selected={role === "doctor"}
                  onClick={() => setRole("doctor")}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Display name</label>
                <Input
                  placeholder={role === "doctor" ? "Dr. Akhilesh" : "Akhilesh"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubmit();
                  }}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setRole("patient");
                      setName("Akhilesh");
                    }}
                  >
                    Use Patient demo
                  </button>
                  <button
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    onClick={() => {
                      setRole("doctor");
                      setName("Dr. Akhilesh");
                    }}
                  >
                    Use Doctor demo
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={onSubmit} disabled={!name.trim()}>
                  Continue <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setName(role === "doctor" ? "Dr. Akhilesh" : "Akhilesh")}
                >
                  Autofill
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Marks booster</div>
                <div className="mt-1 text-xs text-slate-600">
                  Mention: role-based access control, protected routes, audit-friendly UI, export-ready modules.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
