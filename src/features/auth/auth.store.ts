import type { UserRole } from "@/lib/utils";

const KEY = "caresphere_auth";

export type AuthState = {
  isAuthed: boolean;
  role: UserRole | null;
  name: string | null;
};

export function getAuth(): AuthState {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { isAuthed: false, role: null, name: null };
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return { isAuthed: false, role: null, name: null };
  }
}

export function login(role: UserRole, name: string): AuthState {
  const state: AuthState = { isAuthed: true, role, name };
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
}

export function logout(): void {
  localStorage.removeItem(KEY);
}
