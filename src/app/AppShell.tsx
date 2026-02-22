import { Outlet } from "react-router-dom";
import type { UserRole } from "@/lib/utils";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppShell({ role }: { role: UserRole }) {
  return (
    <div className="h-full flex">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
