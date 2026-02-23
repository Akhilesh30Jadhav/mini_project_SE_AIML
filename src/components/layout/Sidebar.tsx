import { NavLink } from "react-router-dom";
import type { UserRole } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, HeartPulse, FileText, Calendar, History, Users,
  Activity, Zap, Brain, UtensilsCrossed, MessageSquare, User, Stethoscope,
  ShieldAlert,
} from "lucide-react";
import { logout } from "@/features/auth/auth.store";
import { useNavigate } from "react-router-dom";

export function Sidebar({ role }: { role: UserRole }) {
  const nav = useNavigate();

  const patientLinks = [
    { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
    { to: "/patient/labs", label: "Lab Reports", icon: FileText },
    { to: "/patient/lifestyle", label: "Lifestyle Score", icon: Activity },
    { to: "/patient/symptoms", label: "Symptom Checker", icon: Zap },
    { to: "/patient/mental", label: "Mental Wellness", icon: Brain },
    { to: "/patient/chronic", label: "Blood Pressure", icon: HeartPulse },
    { to: "/patient/diet", label: "Diet Plan", icon: UtensilsCrossed },
    { to: "/patient/diabetes-risk", label: "Diabetes Risk", icon: ShieldAlert },
    { to: "/patient/appointments", label: "Appointments", icon: Calendar },
    { to: "/patient/chatbot", label: "Health Chat", icon: MessageSquare },
    { to: "/patient/history", label: "History", icon: History },
    { to: "/patient/profile", label: "Profile", icon: User },
  ];

  const doctorLinks = [
    { to: "/doctor", label: "Dashboard", icon: LayoutDashboard },
    { to: "/doctor/patients", label: "Patients", icon: Users },
  ];

  const links = role === "doctor" ? doctorLinks : patientLinks;

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-4 pt-5 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <HeartPulse size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">CareSphere</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {role === "doctor" ? "Clinician Portal" : "Patient Portal"}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/patient" || to === "/doctor"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
              )
            }
          >
            <Icon size={16} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-slate-200">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
          <Stethoscope size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
