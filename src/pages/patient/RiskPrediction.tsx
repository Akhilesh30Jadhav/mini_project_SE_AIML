import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RiskGauge } from "@/components/common/RiskGauge";
import { ShieldAlert } from "lucide-react";
import apiClient from "@/lib/apiClient";

type FeatureImportance = { feature: string; importance: number };
type PredictionResult = {
    probability: number;
    risk_level: string;
    accuracy: number;
    feature_importances: FeatureImportance[];
};

function riskColor(level: string) {
    if (level === "Low") return "green" as const;
    if (level === "Medium") return "amber" as const;
    return "red" as const;
}

export default function RiskPrediction() {
    const [age, setAge] = useState(30);
    const [gender, setGender] = useState("female");
    const [pregnancies, setPregnancies] = useState(0);
    const [heightCm, setHeightCm] = useState(165);
    const [weightKg, setWeightKg] = useState(65);
    const [familyHistory, setFamilyHistory] = useState("none");
    const [activityLevel, setActivityLevel] = useState("moderate");
    const [knowsGlucose, setKnowsGlucose] = useState(false);
    const [glucose, setGlucose] = useState(100);
    const [knowsBP, setKnowsBP] = useState(false);
    const [bloodPressure, setBloodPressure] = useState(72);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState("");

    const bmi = heightCm > 0 ? (weightKg / ((heightCm / 100) ** 2)).toFixed(1) : "—";

    async function predict() {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.post("/patient/predict/diabetes", {
                age, gender, pregnancies,
                height_cm: heightCm,
                weight_kg: weightKg,
                family_history: familyHistory,
                activity_level: activityLevel,
                glucose: knowsGlucose ? glucose : null,
                blood_pressure: knowsBP ? bloodPressure : null,
            });
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Prediction failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Diabetes Risk Prediction"
                subtitle="AI-powered diabetes risk assessment — just answer a few simple questions."
                right={
                    <Badge variant="blue" className="flex items-center gap-1">
                        <ShieldAlert size={12} /> AI Powered
                    </Badge>
                }
            />

            <div className="grid lg:grid-cols-2 gap-4">
                {/* Input Card */}
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base">Your Details</CardTitle>
                        <CardDescription>Simple everyday information — no lab tests required</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Age + Gender */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Age</label>
                                <Input type="number" min={10} max={120} value={age} onChange={e => setAge(+e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Gender</label>
                                <select value={gender} onChange={e => setGender(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                </select>
                            </div>
                        </div>

                        {/* Pregnancies (females only) */}
                        {gender === "female" && (
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Number of Pregnancies</label>
                                <Input type="number" min={0} max={20} value={pregnancies} onChange={e => setPregnancies(+e.target.value)} />
                            </div>
                        )}

                        {/* Height + Weight → BMI */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Height (cm)</label>
                                <Input type="number" min={100} max={250} value={heightCm} onChange={e => setHeightCm(+e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Weight (kg)</label>
                                <Input type="number" min={20} max={250} value={weightKg} onChange={e => setWeightKg(+e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-700 mb-1 block">Your BMI</label>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-blue-700">
                                    {bmi}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Auto-calculated</div>
                            </div>
                        </div>

                        {/* Family History */}
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-1 block">Family History of Diabetes</label>
                            <select value={familyHistory} onChange={e => setFamilyHistory(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                                <option value="none">No family history</option>
                                <option value="grandparent">Grandparent(s) had diabetes</option>
                                <option value="one_parent">One parent has diabetes</option>
                                <option value="both_parents">Both parents have diabetes</option>
                            </select>
                        </div>

                        {/* Activity Level */}
                        <div>
                            <label className="text-xs font-medium text-slate-700 mb-2 block">Physical Activity Level</label>
                            <div className="flex gap-2 flex-wrap">
                                {([
                                    { value: "sedentary", label: "🪑 Sedentary", desc: "Little to no exercise" },
                                    { value: "light", label: "🚶 Light", desc: "1-2 days/week" },
                                    { value: "moderate", label: "🏃 Moderate", desc: "3-5 days/week" },
                                    { value: "active", label: "💪 Active", desc: "6-7 days/week" },
                                ] as const).map(a => (
                                    <button key={a.value} type="button" onClick={() => setActivityLevel(a.value)}
                                        className={[
                                            "rounded-xl border px-3 py-2 text-xs font-medium transition-all text-left",
                                            activityLevel === a.value
                                                ? "border-blue-500 bg-blue-50 text-blue-800"
                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                        ].join(" ")}>
                                        <div>{a.label}</div>
                                        <div className="text-[10px] text-slate-400 font-normal">{a.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Optional: Glucose */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <input type="checkbox" checked={knowsGlucose} onChange={e => setKnowsGlucose(e.target.checked)}
                                    className="rounded" />
                                I know my fasting glucose level (mg/dL)
                                <span className="text-slate-400 font-normal">— optional</span>
                            </label>
                            {knowsGlucose && (
                                <Input type="number" min={50} max={300} value={glucose} onChange={e => setGlucose(+e.target.value)}
                                    className="mt-2" />
                            )}
                        </div>

                        {/* Optional: Blood Pressure */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                <input type="checkbox" checked={knowsBP} onChange={e => setKnowsBP(e.target.checked)}
                                    className="rounded" />
                                I know my blood pressure (diastolic mm Hg)
                                <span className="text-slate-400 font-normal">— optional</span>
                            </label>
                            {knowsBP && (
                                <Input type="number" min={40} max={200} value={bloodPressure} onChange={e => setBloodPressure(+e.target.value)}
                                    className="mt-2" />
                            )}
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-xs text-red-700">{error}</div>
                        )}

                        <Button onClick={predict} disabled={loading} className="w-full">
                            {loading ? "Predicting…" : result ? "Re-Predict" : "Predict Diabetes Risk"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Result Card */}
                <Card className="rounded-2xl border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Prediction Result</CardTitle>
                            <CardDescription>
                                {result
                                    ? `Model accuracy: ${(result.accuracy * 100).toFixed(1)}%`
                                    : "Fill in your details and click Predict"}
                            </CardDescription>
                        </div>
                        {result && <Badge variant={riskColor(result.risk_level)}>{result.risk_level} Risk</Badge>}
                    </CardHeader>

                    <CardContent className="space-y-5">
                        {result ? (
                            <>
                                <RiskGauge value={result.probability} />

                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900">
                                        {(result.probability * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-slate-500">Probability of developing diabetes</div>
                                </div>

                                {/* Feature Importances */}
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="font-semibold text-sm mb-3">Top Contributing Factors</div>
                                    <div className="space-y-2">
                                        {result.feature_importances.map(fi => (
                                            <div key={fi.feature} className="flex items-center gap-2">
                                                <div className="w-28 shrink-0 text-xs font-medium text-slate-700 truncate">{fi.feature}</div>
                                                <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${(fi.importance / result.feature_importances[0].importance) * 100}%`,
                                                            backgroundColor: fi.importance > 0.15 ? "#ef4444" : fi.importance > 0.1 ? "#f59e0b" : "#3b82f6",
                                                        }}
                                                    />
                                                </div>
                                                <div className="w-12 text-right text-xs text-slate-500">{(fi.importance * 100).toFixed(1)}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                                    ⚠️ This prediction is for informational purposes only. It uses a machine learning model
                                    trained on medical data. Always consult a qualified healthcare professional for medical advice.
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-400 text-sm">
                                <ShieldAlert size={40} className="mx-auto mb-3 text-slate-300" />
                                Answer the simple questions on the left and click <strong>Predict</strong> to get your diabetes risk assessment.
                                <div className="mt-2 text-[11px]">No lab tests needed — just everyday health info!</div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
