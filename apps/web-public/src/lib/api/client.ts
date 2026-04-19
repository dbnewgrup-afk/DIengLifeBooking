import { ZodSchema } from "zod";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ??
  "";
const MODE = (process.env.NEXT_PUBLIC_API_MODE ?? (BASE_URL ? "live" : "mock")) as "mock" | "live";

export async function apiFetch<T>(path: string, schema: ZodSchema<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { ...init, cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error(parsed.error.message);
  return parsed.data;
}

export function isLive() { return MODE === "live"; }
