import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RiskGauge } from "@/components/common/RiskGauge";

type Mode = "diabetes" | "heart";

function riskCategory(score: number) {
  if (score < 0.33) return { label: "Low", variant: "green" as const };
  if (score < 0.66) return { label: "Medium", variant: "amber" as const };
  return { label: "High", variant: "red" as const };
}

export default function RiskPrediction() {
  const [mode, setMode] = useState<Mode>("diabetes");
  const [score, setScore] = useState(0.34);

  const cat = useMemo(() => riskCategory(score), [score]);

  return (
    <div>
      <PageHeader
        title="Risk Prediction"
        subtitle="Estimate chronic disease risk using a clean, explainable workflow (demo outputs for now)."
        right={
          <div className="flex gap-2">
            <Button variant={mode === "diabetes" ? "primary" : "secondary"} onClick={() => setMode("diabetes")}>
              Diabetes
            </Button>
            <Button variant={mode === "heart" ? "primary" : "secondary"} onClick={() => setMode("heart")}>
              Heart
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Fill basic health metrics (we’ll connect ML later).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Age</label>
              <Input type="number" defaultValue={24} />
            </div>
            <div>
              <label className="text-sm text-slate-600">BMI</label>
              <Input type="number" defaultValue={26.4} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Blood Pressure</label>
              <Input type="number" defaultValue={122} />
            </div>
            <div>
              <label className="text-sm text-slate-600">
                {mode === "diabetes" ? "Glucose" : "Cholesterol"}
              </label>
              <Input type="number" defaultValue={mode === "diabetes" ? 118 : 210} />
            </div>

            <div className="col-span-2 flex gap-2 mt-2">
              <Button
                onClick={() => {
                  // demo randomness to mimic model output
                  const v = Math.min(0.95, Math.max(0.05, score + (Math.random() - 0.5) * 0.2));
                  setScore(Number(v.toFixed(2)));
                }}
              >
                Predict (Demo)
              </Button>
              <Button variant="secondary">Save to History</Button>
              <Button variant="secondary">Export PDF</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Result</CardTitle>
              <CardDescription>Risk score + category + drivers (placeholder).</CardDescription>
            </div>
            <Badge variant={cat.variant}>{cat.label} Risk</Badge>
          </CardHeader>

          <CardContent className="space-y-5">
            <RiskGauge value={score} />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold">Top contributing factors (placeholder)</div>
              <ul className="mt-2 text-sm text-slate-600 list-disc ml-5">
                <li>BMI / weight index</li>
                <li>{mode === "diabetes" ? "Glucose level" : "Cholesterol level"}</li>
                <li>Age</li>
                <li>Blood pressure</li>
              </ul>
              <div className="mt-3 text-xs text-slate-500">
                Later: SHAP explanation will populate these automatically.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
