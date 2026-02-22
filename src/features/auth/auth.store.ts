import type { UserRole } from "@/lib/utils";
import apiClient from "@/lib/apiClient";

export type AuthUser = {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthState = {
  isAuthed: boolean;
  role: UserRole | null;
  name: string | null;
  user_id: string | null;
  email: string | null;
};

const USER_KEY = "cs_user";

export function getAuth(): AuthState {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return { isAuthed: false, role: null, name: null, user_id: null, email: null };
  try {
    const u = JSON.parse(raw) as AuthUser;
    return { isAuthed: true, role: u.role, name: u.name, user_id: u.user_id, email: u.email };
  } catch {
    return { isAuthed: false, role: null, name: null, user_id: null, email: null };
  }
}

export function setAuth(data: { access_token: string; refresh_token: string; role: string; name: string; user_id: string; email?: string }) {
  localStorage.setItem("cs_access_token", data.access_token);
  localStorage.setItem("cs_refresh_token", data.refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify({
    user_id: data.user_id,
    name: data.name,
    role: data.role as UserRole,
    email: data.email ?? "",
  }));
}

export function logout(): void {
  const refreshToken = localStorage.getItem("cs_refresh_token");
  if (refreshToken) {
    apiClient.post("/auth/logout", { refresh_token: refreshToken }).catch(() => { });
  }
  localStorage.removeItem("cs_access_token");
  localStorage.removeItem("cs_refresh_token");
  localStorage.removeItem(USER_KEY);
}
