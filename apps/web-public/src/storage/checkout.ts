import type { CartItem } from "./cart";
import { getCartLocalized, type Lang } from "./cart";

const KEY = "checkout_draft";

export function setCheckoutDraft(item: CartItem): void {
  localStorage.setItem(KEY, JSON.stringify(item));
}

export function getCheckoutDraft(): CartItem | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as CartItem) : null;
  } catch {
    return null;
  }
}

/** Versi berlabel sesuai bahasa. Gunakan di UI checkout. */
export function getCheckoutDraftLocalized(lang: Lang): CartItem | null {
  const raw = getCheckoutDraft();
  if (!raw) return null;
  // reuse util getCartLocalized untuk menerjemahkan breakdown
  return getCartLocalized(lang).find((x) => x.id === raw.id) ?? raw;
}
