import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { logout, getAuth } from "@/features/auth/auth.store";
import { LogOut, Search, Menu } from "lucide-react";

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const nav = useNavigate();
  const auth = getAuth();

  return (
    <header className="h-14 sm:h-16 border-b border-slate-200 bg-white px-3 sm:px-5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 rounded-lg p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-xl hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            placeholder="Search patients, reports, appointments..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Badge variant={auth.role === "doctor" ? "blue" : "default"} className="hidden sm:inline-flex">
          {auth.role === "doctor" ? "Doctor" : "Patient"}
        </Badge>

        <div className="text-sm text-slate-700 hidden md:block">
          <span className="text-slate-500">Hi, </span>
          <span className="font-medium">{auth.name ?? "User"}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <LogOut size={16} className="sm:mr-2" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
