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

const FIELDS = [
    { key: "pregnancies", label: "Pregnancies", hint: "Number of pregnancies", min: 0, max: 20, step: 1, defaultVal: 1 },
    { key: "glucose", label: "Glucose (mg/dL)", hint: "Plasma glucose concentration", min: 0, max: 300, step: 1, defaultVal: 120 },
    { key: "blood_pressure", label: "Blood Pressure (mm Hg)", hint: "Diastolic blood pressure", min: 0, max: 200, step: 1, defaultVal: 72 },
    { key: "skin_thickness", label: "Skin Thickness (mm)", hint: "Triceps skin fold thickness", min: 0, max: 100, step: 1, defaultVal: 20 },
    { key: "insulin", label: "Insulin (mu U/ml)", hint: "2-hour serum insulin", min: 0, max: 900, step: 1, defaultVal: 80 },
    { key: "bmi", label: "BMI (kg/m²)", hint: "Body mass index", min: 10, max: 70, step: 0.1, defaultVal: 26.5 },
    { key: "diabetes_pedigree", label: "Diabetes Pedigree", hint: "Genetic risk function (0-2.5)", min: 0, max: 2.5, step: 0.01, defaultVal: 0.5 },
    { key: "age", label: "Age (years)", hint: "Your current age", min: 10, max: 120, step: 1, defaultVal: 30 },
] as const;

type FormData = Record<string, number>;

function defaultForm(): FormData {
    const obj: FormData = {};
    FIELDS.forEach(f => { obj[f.key] = f.defaultVal; });
    return obj;
}

function riskColor(level: string) {
    if (level === "Low") return "green" as const;
    if (level === "Medium") return "amber" as const;
    return "red" as const;
}

export default function RiskPrediction() {
    const [form, setForm] = useState<FormData>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState("");

    function update(key: string, val: string) {
        setForm(prev => ({ ...prev, [key]: val === "" ? 0 : parseFloat(val) }));
    }

    async function predict() {
        setLoading(true);
        setError("");
        try {
            const res = await apiClient.post("/patient/predict/diabetes", form);
            setResult(res.data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Prediction failed. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Diabetes Risk Prediction"
                subtitle="ML-powered diabetes risk assessment using trained Random Forest model."
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
                        <CardTitle className="text-base">Health Metrics</CardTitle>
                        <CardDescription>Enter your health parameters for diabetes risk assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            {FIELDS.map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-medium text-slate-700 mb-1 block">{f.label}</label>
                                    <Input
                                        type="number"
                                        min={f.min}
                                        max={f.max}
                                        step={f.step}
                                        value={form[f.key]}
                                        onChange={e => update(f.key, e.target.value)}
                                        id={`diabetes-${f.key}`}
                                    />
                                    <div className="text-[10px] text-slate-400 mt-0.5">{f.hint}</div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-2 text-xs text-red-700">{error}</div>
                        )}

                        <Button onClick={predict} disabled={loading} className="w-full mt-2">
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
                                    ⚠️ This prediction is for informational purposes only. It is based on a machine learning model
                                    trained on the Pima Indians Diabetes Dataset. Always consult a qualified healthcare professional
                                    for medical advice.
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-slate-400 text-sm">
                                <ShieldAlert size={40} className="mx-auto mb-3 text-slate-300" />
                                Enter your health metrics and click <strong>Predict</strong> to get your diabetes risk assessment.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
