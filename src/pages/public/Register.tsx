import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { HeartPulse, Stethoscope, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { setAuth } from "@/features/auth/auth.store";
import type { UserRole } from "@/lib/utils";
import apiClient from "@/lib/apiClient";

export default function Register() {
    const nav = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [role, setRole] = useState<UserRole>("patient");
    const [specialization, setSpecialization] = useState("General Practice");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password) { setError("All fields are required."); return; }
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setLoading(true);
        setError(null);
        try {
            const payload: any = { name: name.trim(), email: email.trim(), password, role };
            if (role === "doctor") payload.specialization = specialization;
            const res = await apiClient.post("/auth/register", payload);
            setAuth({ ...res.data, email: email.trim() });
            nav(role === "doctor" ? "/doctor" : "/patient", { replace: true });
        } catch (err: any) {
            setError(err?.response?.data?.detail ?? "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const specializations = ["General Practice", "Cardiology", "Endocrinology", "Neurology", "Orthopedics", "Psychiatry", "Dermatology", "Oncology", "Pediatrics", "Gastroenterology"];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            <div className="mx-auto max-w-2xl px-4 py-16">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 mb-4">
                        <HeartPulse size={16} /> CareSphere
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
                    <p className="mt-2 text-slate-500">Join CareSphere for personalized health insights</p>
                </div>

                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Register</CardTitle>
                        <CardDescription>Choose your role and fill in your details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-5">
                            {/* Role */}
                            <div>
                                <label className="mb-2 block text-xs font-medium text-slate-700">I am a…</label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {([["patient", "Patient", "Labs · Wellness · Chat", HeartPulse], ["doctor", "Doctor", "Patient care · Appointments", Stethoscope]] as const).map(([r, label, sub, Icon]) => (
                                        <button key={r} type="button" onClick={() => setRole(r as UserRole)}
                                            className={["w-full rounded-xl border p-3.5 text-left transition-all", role === r ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                            <div className="flex items-center gap-3">
                                                <div className={["grid h-9 w-9 place-items-center rounded-lg border", role === r ? "border-blue-200 bg-blue-100" : "border-slate-200 bg-white"].join(" ")}>
                                                    <Icon size={16} className={role === r ? "text-blue-600" : "text-slate-600"} />
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-sm text-slate-900">{label}</div>
                                                    <div className="text-xs text-slate-500">{sub}</div>
                                                </div>
                                                {role === r && <CheckCircle2 size={14} className="ml-auto text-blue-600" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fields */}
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Full name</label>
                                    <Input placeholder={role === "doctor" ? "Dr. Smith" : "Your name"} value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Email address</label>
                                    <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
                                    <Input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700">Confirm password</label>
                                    <Input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                                </div>
                                {role === "doctor" && (
                                    <div className="sm:col-span-2">
                                        <label className="mb-1.5 block text-xs font-medium text-slate-700">Specialization</label>
                                        <select value={specialization} onChange={e => setSpecialization(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            {specializations.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                    <AlertCircle size={14} />{error}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 pt-1">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Creating account…" : <>Create Account <ArrowRight size={15} className="ml-1" /></>}
                                </Button>
                                <Link to="/login"><Button type="button" variant="secondary">Sign in instead</Button></Link>
                            </div>
                            <p className="text-xs text-slate-400">
                                ⚠️ CareSphere is an informational platform only. It does not provide medical diagnoses or treatment.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
