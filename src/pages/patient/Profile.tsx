import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuth } from "@/features/auth/auth.store";
import { CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/apiClient";

type Profile = { age?: number; gender?: string; height_cm?: number; weight_kg?: number; name?: string; email?: string };

export default function Profile() {
    const auth = getAuth();
    const [profile, setProfile] = useState<Profile>({});
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        apiClient.get("/patient/profile").then(r => {
            setProfile(r.data);
            setAge(r.data.age?.toString() ?? "");
            setGender(r.data.gender ?? "");
            setHeight(r.data.height_cm?.toString() ?? "");
            setWeight(r.data.weight_kg?.toString() ?? "");
        }).catch(() => { });
    }, []);

    async function save() {
        setSaving(true); setSaved(false);
        try {
            await apiClient.put("/patient/profile", {
                age: age ? parseInt(age) : undefined,
                gender: gender || undefined,
                height_cm: height ? parseFloat(height) : undefined,
                weight_kg: weight ? parseFloat(weight) : undefined,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) { alert(e?.response?.data?.detail ?? "Failed to save."); }
        finally { setSaving(false); }
    }

    const bmi = height && weight ? (parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null;
    const bmiCategory = bmi ? (parseFloat(bmi) < 18.5 ? "Underweight" : parseFloat(bmi) < 25 ? "Normal" : parseFloat(bmi) < 30 ? "Overweight" : "Obese") : null;

    return (
        <div className="space-y-6 max-w-lg">
            <PageHeader title="My Profile" subtitle="Update your personal health details for accurate insights." />
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="h-12 w-12 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-lg font-bold text-blue-700">
                            {auth.name?.[0]?.toUpperCase() ?? "P"}
                        </div>
                        <div>
                            <div className="font-semibold text-slate-900">{auth.name}</div>
                            <div className="text-sm text-slate-500">{auth.email}</div>
                            <div className="text-xs text-blue-600 font-medium mt-0.5 capitalize">{auth.role}</div>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Age (years)</label>
                            <Input type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 28" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Gender</label>
                            <select value={gender} onChange={e => setGender(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select…</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Height (cm)</label>
                            <Input type="number" min={50} max={250} value={height} onChange={e => setHeight(e.target.value)} placeholder="e.g. 170" />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-700">Weight (kg)</label>
                            <Input type="number" min={1} max={300} value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 70" />
                        </div>
                    </div>

                    {bmi && (
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <div className="text-xs font-medium text-slate-600">BMI (calculated)</div>
                            <div className="text-2xl font-bold text-slate-900 mt-0.5">{bmi}</div>
                            <div className="text-xs text-slate-500">{bmiCategory} · Based on height/weight above</div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</Button>
                        {saved && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 size={15} />Saved!</span>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
