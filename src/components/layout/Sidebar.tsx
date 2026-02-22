import { NavLink } from "react-router-dom";
import type { UserRole } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { LayoutDashboard, HeartPulse, FileText, Calendar, History, Users } from "lucide-react";

export function Sidebar({ role }: { role: UserRole }) {
  const patientLinks = [
    { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patient/risk", label: "Risk Prediction", icon: HeartPulse },
    { to: "/patient/reports", label: "Report Analyzer", icon: FileText },
    { to: "/patient/appointments", label: "Appointments", icon: Calendar },
    { to: "/patient/history", label: "History", icon: History },
  ];

  const doctorLinks = [
    { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/patients", label: "Patients", icon: Users },
  ];

  const links = role === "doctor" ? doctorLinks : patientLinks;

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-white p-4">
      <div className="text-lg font-semibold tracking-tight">CareSphere</div>
      <div className="text-xs text-slate-500 mt-1">All-in-one healthcare platform</div>

      <nav className="mt-6 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/patient" || to === "/doctor"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm",
                isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
