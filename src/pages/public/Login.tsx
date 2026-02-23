import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HeartPulse, Stethoscope, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { setAuth } from "@/features/auth/auth.store";
import type { UserRole } from "@/lib/utils";
import apiClient from "@/lib/apiClient";

function RoleTile({ title, subtitle, icon, selected, onClick }: {
  title: string; subtitle: string; icon: React.ReactNode; selected: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={["w-full rounded-2xl border p-4 text-left transition-all", selected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className={["grid h-10 w-10 place-items-center rounded-xl border", selected ? "border-blue-200 bg-blue-100" : "border-slate-200 bg-white"].join(" ")}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-slate-900">{title}</div>
            {selected && <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700"><CheckCircle2 size={11} /> Selected</span>}
          </div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation() as any;
  const fromPath: string | null = loc?.state?.from ?? null;

  const [role, setRole] = useState<UserRole>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post("/auth/login", { email: email.trim(), password });
      setAuth({ ...res.data, email: email.trim() });
      const dest = res.data.role === "doctor" ? "/doctor" : "/patient";
      nav(fromPath ?? dest, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-16">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-4">
            <HeartPulse size={16} /> CareSphere Health Platform
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-500">Sign in to access your health dashboard</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Info */}
          <Card className="rounded-2xl border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Sign In</CardTitle>
              <CardDescription>Access your personalised health data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="text-sm font-semibold text-blue-900 mb-2">What you can access</div>
                <ul className="space-y-1.5 text-sm text-blue-800">
                  {["Lab report analyzer & deficiency detection", "Lifestyle scoring & wellness trends", "Symptom triage checker", "PHQ-9 & GAD-7 mental wellness", "Blood pressure tracker", "AI diet plan generator", "Smart chatbot with context-aware Q&A"].map(f => (
                    <li key={f} className="flex gap-2"><CheckCircle2 size={13} className="mt-0.5 shrink-0 text-blue-600" />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 flex gap-2 text-xs text-slate-600">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-green-600" />
                Passwords are securely hashed. JWT-protected APIs. No PHI is shared externally.
              </div>
              <div className="text-xs text-slate-500">
                New user? <Link to="/register" className="text-blue-600 font-medium hover:underline">Create an account</Link>
              </div>
            </CardContent>
          </Card>

          {/* Right Form */}
          <Card className="rounded-2xl border-slate-200 shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Sign in to CareSphere</CardTitle>
              <CardDescription>Select your role, enter credentials, and continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5">
                {/* Role selector */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <RoleTile title="Patient" subtitle="Labs · Symptoms · Wellness · Chat"
                    icon={<HeartPulse size={18} className="text-blue-600" />}
                    selected={role === "patient"} onClick={() => setRole("patient")} />
                  <RoleTile title="Doctor" subtitle="Patients · Trends · Appointments"
                    icon={<Stethoscope size={18} className="text-blue-600" />}
                    selected={role === "doctor"} onClick={() => setRole("doctor")} />
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Email address</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle size={14} />{error}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={loading || !email || !password}>
                    {loading ? "Signing in…" : <>Sign In <ArrowRight size={15} className="ml-1" /></>}
                  </Button>
                  <Link to="/register">
                    <Button type="button" variant="secondary">Create account</Button>
                  </Link>
                </div>

                {/* Demo shortcuts */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-medium text-slate-700 mb-2">Quick demo credentials</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition"
                      onClick={() => { setRole("patient"); setEmail("patient@demo.com"); setPassword("demo1234"); }}>
                      Patient demo
                    </button>
                    <button type="button" className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 transition"
                      onClick={() => { setRole("doctor"); setEmail("doctor@demo.com"); setPassword("demo1234"); }}>
                      Doctor demo
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
