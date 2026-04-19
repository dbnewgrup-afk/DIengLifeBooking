// Util sederhana: fetch aman + formatter angka/waktu

export async function safeFetchJSON<T>(url: string, headers?: HeadersInit): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store", headers });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return (await r.json()) as T;
  } catch (e) {
    console.error("safeFetchJSON", e);
    return null;
  }
}

export function fmtIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtNum(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return `${s}s lalu`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return `${d}h lalu`;
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
