/** Ambil locale sekarang dari <html lang="...">; default ke id-ID */
function currentLocale(): "id-ID" | "en-US" {
  if (typeof document !== "undefined") {
    const l = (document.documentElement.getAttribute("lang") || "id").toLowerCase();
    return l === "en" ? "en-US" : "id-ID";
  }
  // server render: fallback Indonesia biar konsisten
  return "id-ID";
}

/** Translate unit label sesuai <html lang> */
function unitLabel(u?: "malam" | "jam" | "rute"): string | undefined {
  if (!u) return undefined;
  const loc = currentLocale();
  if (loc === "en-US") {
    return u === "malam" ? "night" : u === "jam" ? "hour" : "route";
  }
  return u;
}

/** Format angka ke Rupiah standar, default tanpa desimal */
export function formatRupiah(
  n: number | bigint,
  opts: { fractionDigits?: number } = {}
) {
  const value = typeof n === "bigint" ? Number(n) : n;
  const maximumFractionDigits = opts.fractionDigits ?? 0;
  if (!Number.isFinite(value)) return "Rp 0";
  const locale = currentLocale();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value);
}

/** Versi singkat: Rp1.2K / Rp3.5M tergantung locale */
export function formatRupiahShort(n: number | bigint) {
  const value = typeof n === "bigint" ? Number(n) : n;
  if (!Number.isFinite(value)) return "Rp 0";
  const locale = currentLocale();
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatUnitPrice(n: number | bigint, unit?: "malam" | "jam" | "rute") {
  const u = unitLabel(unit);
  return u ? `${formatRupiah(n)} / ${u}` : formatRupiah(n);
}

export function parseRupiahToNumber(s: string): number | null {
  const cleaned = s.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}
