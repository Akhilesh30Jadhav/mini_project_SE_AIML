import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = "patient" | "doctor";

export function formatPct(x: number) {
  const v = Math.max(0, Math.min(1, x));
  return `${Math.round(v * 100)}%`;
}