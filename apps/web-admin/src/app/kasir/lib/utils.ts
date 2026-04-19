import type { Product } from "./types";

export const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtDateTime = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export function calcNights(start?: string, end?: string) {
  if (!start || !end) return 1;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / 86400000);
  return isFinite(diff) && diff > 0 ? diff : 1;
}

export function calcTotal(product?: Product, qty = 1, nights = 1) {
  if (!product) return 0;
  return product.unit === "malam" ? product.price * qty * nights : product.price * qty;
}
