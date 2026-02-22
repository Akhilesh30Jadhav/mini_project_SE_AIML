import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { logout, getAuth } from "@/features/auth/auth.store";
import { LogOut, Search } from "lucide-react";

export function Topbar() {
  const nav = useNavigate();
  const auth = getAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-5 flex items-center justify-between">
      <div className="flex items-center gap-3 w-full max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            placeholder="Search patients, reports, appointments..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={auth.role === "doctor" ? "blue" : "default"}>
          {auth.role === "doctor" ? "Doctor" : "Patient"}
        </Badge>

        <div className="text-sm text-slate-700">
          <span className="text-slate-500">Hi, </span>
          <span className="font-medium">{auth.name ?? "User"}</span>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            logout();
            nav("/login");
          }}
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </header>
  );
}
