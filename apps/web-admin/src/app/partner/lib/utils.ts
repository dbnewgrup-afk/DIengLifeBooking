/* apps/web-admin/src/app/partner/lib/utils.ts */

import { API_BASE_URL } from "@/lib/constants";
import { getToken } from "@/lib/auth/session";

function resolveApiUrl(url: string) {
  if (!API_BASE_URL || /^https?:\/\//i.test(url)) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function tryJSON<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const headers = new Headers(init?.headers);
    const token = getToken();
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    const r = await fetch(resolveApiUrl(url), {
      cache: "no-store",
      ...init,
      headers,
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export const fmtInt = (n: number | null | undefined) =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(Number(n)) ? Number(n) : 0);

export const fmtNum = fmtInt;

export const fmtIDR = (n: number | null | undefined) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
    Number.isFinite(Number(n)) ? Number(n) : 0
  );

export function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function startISO(dYmd: string) {
  return new Date(`${dYmd}T00:00:00.000Z`).toISOString();
}
export function endISO(dYmd: string) {
  return new Date(`${dYmd}T23:59:59.999Z`).toISOString();
}

export function getWeekKey(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diffDays = Math.floor((+d - +start) / 86400000);
  const week = Math.floor(diffDays / 7) + 1;
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
export function fmtWeekLabel(key: string) {
  return key.replace("W", "Wk ");
}
