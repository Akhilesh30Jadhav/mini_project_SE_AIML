import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { UtensilsCrossed, RefreshCw } from "lucide-react";
import apiClient from "@/lib/apiClient";

const DIET_TYPES = [
    { value: "veg", label: "Vegetarian", emoji: "🥦" },
    { value: "nonveg", label: "Non-Vegetarian", emoji: "🍗" },
    { value: "vegan", label: "Vegan", emoji: "🌱" },
];
const GOALS = [
    { value: "balanced", label: "Balanced / Maintenance" },
    { value: "weight_loss", label: "Weight Loss" },
    { value: "muscle_gain", label: "Muscle Gain" },
];

const DAYS = ["day_1", "day_2", "day_3", "day_4", "day_5", "day_6", "day_7"];
const MEALS = ["breakfast", "mid_morning_snack", "lunch", "evening_snack", "dinner"];
const MEAL_LABELS: Record<string, string> = {
    breakfast: "☀️ Breakfast",
    mid_morning_snack: "🍵 Mid-Morning",
    lunch: "🍽️ Lunch",
    evening_snack: "🍌 Evening Snack",
    dinner: "🌙 Dinner",
};

type DietPlan = { id: string; plan: { meal_plan: Record<string, Record<string, string>>; deficiency_recommendations: Record<string, { eat: string[]; avoid: string[] }> }; created_at: string };

export default function DietPlan() {
    const [dietType, setDietType] = useState("nonveg");
    const [goal, setGoal] = useState("balanced");
    const [generating, setGenerating] = useState(false);
    const [plan, setPlan] = useState<DietPlan | null>(null);
    const [activeDay, setActiveDay] = useState("day_1");

    useEffect(() => {
        apiClient.get("/patient/diet/latest").then(r => setPlan(r.data)).catch(() => { });
    }, []);

    async function generate() {
        setGenerating(true);
        try {
            const res = await apiClient.post("/patient/diet/plan", { diet_type: dietType, goal, allergies: [] });
            setPlan(res.data);
        } catch (e: any) { alert(e?.response?.data?.detail ?? "Failed to generate plan."); }
        finally { setGenerating(false); }
    }

    const mealPlan = plan?.plan.meal_plan ?? {};
    const defRecs = plan?.plan.deficiency_recommendations ?? {};

    return (
        <div className="space-y-6">
            <PageHeader title="Diet Plan Generator" subtitle="Get a 7-day personalised meal plan based on your deficiencies and dietary preferences." />

            {/* Config */}
            <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base">Your Preferences</CardTitle>
                    <CardDescription>We'll adapt your plan to address any detected deficiencies automatically</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">Diet type</div>
                        <div className="flex gap-2 flex-wrap">
                            {DIET_TYPES.map(d => (
                                <button key={d.value} type="button" onClick={() => setDietType(d.value)}
                                    className={["rounded-xl border px-4 py-2 text-sm font-medium transition-all", dietType === d.value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                    {d.emoji} {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-700 mb-2">Goal</div>
                        <div className="flex gap-2 flex-wrap">
                            {GOALS.map(g => (
                                <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                                    className={["rounded-xl border px-4 py-2 text-sm font-medium transition-all", goal === g.value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white hover:bg-slate-50"].join(" ")}>
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Button onClick={generate} disabled={generating}>
                        {generating ? "Generating…" : plan ? <><RefreshCw size={14} className="mr-2" />Regenerate Plan</> : <><UtensilsCrossed size={14} className="mr-2" />Generate 7-Day Plan</>}
                    </Button>
                </CardContent>
            </Card>

            {/* Meal Plan */}
            {plan && (
                <>
                    <Card className="rounded-2xl border-slate-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">7-Day Meal Plan <Badge variant="green">Generated</Badge></CardTitle>
                            <CardDescription>Generated on {new Date(plan.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Day tabs */}
                            <div className="flex gap-1.5 flex-wrap">
                                {DAYS.map((d, i) => (
                                    <button key={d} onClick={() => setActiveDay(d)}
                                        className={["rounded-xl border px-3 py-1.5 text-xs font-medium transition-all", activeDay === d ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"].join(" ")}>
                                        Day {i + 1}
                                    </button>
                                ))}
                            </div>
                            {/* Meals */}
                            <div className="space-y-2">
                                {MEALS.map(meal => (
                                    <div key={meal} className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="w-28 shrink-0 text-xs font-semibold text-slate-700">{MEAL_LABELS[meal]}</div>
                                        <div className="text-sm text-slate-700">{mealPlan[activeDay]?.[meal] ?? "—"}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deficiency recommendations */}
                    {Object.keys(defRecs).length > 0 && (
                        <Card className="rounded-2xl border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base">🔬 Deficiency-Based Recommendations</CardTitle>
                                <CardDescription>Foods to eat and avoid based on your latest lab results</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(defRecs).map(([def, recs]) => (
                                    <div key={def} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="font-semibold text-slate-800 text-sm mb-2">{def}</div>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <div className="text-xs font-medium text-green-700 mb-1">✅ Eat more</div>
                                                <div className="flex flex-wrap gap-1">{(recs as any).eat.map((f: string) => <span key={f} className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">{f}</span>)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-red-700 mb-1">❌ Reduce</div>
                                                <div className="flex flex-wrap gap-1">{(recs as any).avoid.map((f: string) => <span key={f} className="text-xs bg-red-100 text-red-700 rounded-full px-2 py-0.5">{f}</span>)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                ⚠️ This diet plan is for informational purposes only. Consult a registered dietitian or doctor before making major dietary changes, especially if you have a medical condition.
            </div>
        </div>
    );
}
