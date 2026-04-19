export type FeatureFlags = {
  /** Tampilkan section "Paket & Promo" di landing page */
  showPromoPackages: boolean;
};

/**
 * Bisa di-override lewat ENV:
 *  - NEXT_PUBLIC_SHOW_PROMOS=true | false
 * (NEXT_PUBLIC_* akan di-inline ke client oleh Next.js)
 */
function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return /^(1|true|yes|on)$/i.test(raw);
}

export const features: FeatureFlags = {
  showPromoPackages: envBool("NEXT_PUBLIC_SHOW_PROMOS", true),
};

export function isPromoEnabled() {
  return features.showPromoPackages;
}

export type Promo = never;

export function getPromos(): never {
  throw new Error("Fallback promo statis sudah dihapus. Gunakan API /api/promos.");
}
