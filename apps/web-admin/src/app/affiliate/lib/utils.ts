/* apps/web-admin/src/app/affiliate/lib/utils.ts */

/* =========================
   Types (dipakai lintas affiliate)
========================= */
export type AffiliateProfile = {
  id: string;
  code: string;
  name: string;
  mainLink: string;
};

export type PerformanceToday = {
  clicks: number;
  conversions: number;
  pendingCommission: number;
  cr?: number;
};

export type PayoutInfo = {
  pending: number;
  lastPaidAt?: string;
  lastPaidAmount?: number;
  nextCutoff?: string;
};

export type LinksData = {
  main: string;
  short?: string;
  utm?: string;
};

export type WithdrawReq = {
  id: string;
  createdAt: string; // ISO
  amount: number;
  bank: string;
  account: string;
  owner: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
};

export type TabKey = "OVERVIEW" | "LINKS" | "PAYOUT" | "PERFORMANCE";

/* =========================
   Utils
========================= */
export const fmtNum = (n: number | null | undefined): string =>
  new Intl.NumberFormat("id-ID").format(Number.isFinite(Number(n)) ? Number(n) : 0);

export const fmtIDR = (n: number | null | undefined): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

/** UID pendek buat dummy data/UI key */
export const uid = (prefix = "id"): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;

/** "3 menit lalu", "2 jam lalu", "kemarin", dst */
export function timeAgo(iso?: string | number | Date): string {
  if (!iso) return "-";
  const t = typeof iso === "string" || typeof iso === "number" ? new Date(iso) : iso;
  const diff = Date.now() - t.getTime();
  if (!Number.isFinite(diff)) return "-";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "kemarin";
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  return `${weeks} minggu lalu`;
}
