import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function StatCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {hint && <div className="text-sm text-slate-600 mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
