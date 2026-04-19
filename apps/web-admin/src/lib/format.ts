// apps/web-admin/src/lib/format.ts

import { DEFAULT_LOCALE, DEFAULT_TIMEZONE } from "./constants";

/**
 * Format rupiah dengan pemisah ribuan.
 * Contoh: 1500000 -> "Rp1.500.000"
 */
export function formatMoneyIDR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Format tanggal ringkas default Asia/Jakarta.
 * Contoh: "2025-10-20T10:11:12Z" -> "20 Okt 2025 17.11" (WIB)
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    timeZone: DEFAULT_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...opts,
  }).format(d);
}

/**
 * Compact number untuk badge/metrics.
 * Contoh: 12500 -> "12,5 rb"
 */
export function compactNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Hitung selisih hari bulat (end - start) minimal 0.
 */
export function diffDays(start?: string | Date, end?: string | Date): number {
  if (!start || !end) return 0;
  const s = new Date(start).setHours(0, 0, 0, 0);
  const e = new Date(end).setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

/**
 * Join kelas sederhana.
 */
export function clsx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}
