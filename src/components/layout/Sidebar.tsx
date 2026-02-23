import { NavLink } from "react-router-dom";
import type { UserRole } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, HeartPulse, FileText, Calendar, History, Users,
  Activity, Zap, Brain, UtensilsCrossed, MessageSquare, User, Stethoscope,
  ShieldAlert, X,
} from "lucide-react";
import { logout } from "@/features/auth/auth.store";
import { useNavigate } from "react-router-dom";

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: UserRole;
  open: boolean;
  onClose: () => void;
}) {
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
    <aside
      className={cn(
        // Base styles
        "w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col",
        // Mobile: fixed offscreen, slides in when open
        "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible, relative position
        "lg:relative lg:translate-x-0"
      )}
    >
      <div className="px-4 pt-5 pb-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <HeartPulse size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">CareSphere</span>
        </div>

        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-1.5 text-xs text-slate-500">
        {role === "doctor" ? "Clinician Portal" : "Patient Portal"}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/patient" || to === "/doctor"}
            onClick={onClose}
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
