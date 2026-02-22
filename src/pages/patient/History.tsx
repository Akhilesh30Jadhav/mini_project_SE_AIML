import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const items = [
  { type: "Risk", label: "Diabetes risk predicted", date: "2026-02-01", meta: "34% (Medium)" },
  { type: "Report", label: "Lab report analyzed", date: "2026-01-31", meta: "2 abnormal values" },
  { type: "No-Show", label: "No-show predicted", date: "2026-01-30", meta: "20% (Low)" },
];

export default function History() {
  return (
    <div>
      <PageHeader title="History" subtitle="All generated insights (demo data)." />

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {items.map((x, idx) => (
              <div key={idx} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{x.label}</div>
                  <div className="text-sm text-slate-600 mt-1">{x.date} • {x.meta}</div>
                </div>
                <Badge variant={x.type === "Risk" ? "amber" : x.type === "Report" ? "blue" : "green"}>
                  {x.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
