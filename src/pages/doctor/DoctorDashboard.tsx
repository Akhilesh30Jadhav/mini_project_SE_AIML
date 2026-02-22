import PageHeader from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Users, Activity, CalendarClock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Link } from "react-router-dom";

const patients = [
  { id: "p1", name: "Riya Sharma", risk: "High", noshow: "Medium", lastReport: "2026-01-31" },
  { id: "p2", name: "Aman Verma", risk: "Medium", noshow: "Low", lastReport: "2026-01-29" },
  { id: "p3", name: "Neha Singh", risk: "Low", noshow: "High", lastReport: "2026-01-28" },
];

function badgeFor(level: string) {
  if (level === "High") return <Badge variant="red">High</Badge>;
  if (level === "Medium") return <Badge variant="amber">Medium</Badge>;
  return <Badge variant="green">Low</Badge>;
}

export default function DoctorDashboard() {
  return (
    <div>
      <PageHeader
        title="Doctor Dashboard"
        subtitle="Clinic overview with patient risk flags (demo)."
      />

      <div className="grid lg:grid-cols-4 gap-4">
        <StatCard title="Patients" value="24" hint="Active this month" icon={<Users size={18} />} />
        <StatCard title="High Risk" value="5" hint="Needs follow-up" icon={<Activity size={18} />} />
        <StatCard title="Appointments" value="12" hint="This week" icon={<CalendarClock size={18} />} />
        <StatCard title="Reports" value="31" hint="Parsed total" icon={<FileText size={18} />} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Patients (demo)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Risk</th>
                  <th className="text-left p-3">No-Show</th>
                  <th className="text-left p-3">Last Report</th>
                  <th className="text-left p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3">{badgeFor(p.risk)}</td>
                    <td className="p-3">{badgeFor(p.noshow)}</td>
                    <td className="p-3 text-slate-600">{p.lastReport}</td>
                    <td className="p-3">
                      <Link to={`/doctor/patients/${p.id}`} className="text-slate-900 underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
