export type Lang = "id" | "en";

export type CartItem = {
  id: string;
  type: "villa" | "jeep" | "transport" | "dokumentasi";
  productId: string;
  name: string;
  image?: string;
  unitPrice: number;
  params: {
    start?: string; end?: string;
    date?: string; time?: string;
    baseGuests?: number; extraGuests?: number;
  };
  pricing: {
    nights?: number; hours?: number;
    subtotal: number;
    /**
     * Lebih baik simpan key standar supaya bisa diterjemahkan dinamis.
     * label lama tetap diterima sebagai fallback agar backward compatible.
     */
    breakdown: Array<{ key?: string; label?: string; amount: number }>;
  };
};

const KEY = "cart_items";

/** Kamus label breakdown bilingual */
const LABELS: Record<
  string,
  { id: string; en: string }
> = {
  room: { id: "Harga kamar", en: "Room price" },
  extra_person: { id: "Tambahan orang", en: "Extra person" },
  late_checkout: { id: "Late checkout", en: "Late checkout" },
  base_hours: { id: "Harga dasar", en: "Base price" },
  package: { id: "Paket", en: "Package" },
  route: { id: "Harga per rute", en: "Per route" },
  tax_fee: { id: "Pajak & Biaya", en: "Tax & Fees" },
  subtotal: { id: "Subtotal", en: "Subtotal" },
};

function tr(keyOrLabel: { key?: string; label?: string }, lang: Lang) {
  if (keyOrLabel.key && LABELS[keyOrLabel.key]) {
    return lang === "en" ? LABELS[keyOrLabel.key].en : LABELS[keyOrLabel.key].id;
  }
  // fallback ke label mentah bila key tidak tersedia
  return keyOrLabel.label ?? "";
}

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
}

/** Versi berlabel sesuai bahasa. Gunakan ini di UI. */
export function getCartLocalized(lang: Lang): CartItem[] {
  const raw = getCart();
  return raw.map((it) => ({
    ...it,
    pricing: {
      ...it.pricing,
      breakdown: (it.pricing.breakdown ?? []).map((b) => ({
        ...b,
        label: tr(b, lang),
      })),
    },
  }));
}

export function addToCart(item: CartItem): void {
  const list = getCart();
  list.push(item);
  localStorage.setItem(KEY, JSON.stringify(list));
}

/**
 * Optional helper: normalisasi item supaya breakdown selalu berisi key standar.
 * Panggil kalau kamu pengin menulis item yang konsisten.
 */
export function normalizeBreakdownKeys(item: CartItem): CartItem {
  const mapByGuess: Record<string, string> = {
    "Harga kamar": "room",
    "Room price": "room",
    "Tambahan orang": "extra_person",
    "Extra person": "extra_person",
    "Late checkout": "late_checkout",
    "Harga dasar": "base_hours",
    "Base price": "base_hours",
    "Paket": "package",
    "Per route": "route",
    "Harga per rute": "route",
    "Pajak & Biaya": "tax_fee",
    "Subtotal": "subtotal",
  };
  return {
    ...item,
    pricing: {
      ...item.pricing,
      breakdown: (item.pricing.breakdown ?? []).map((b) => ({
        amount: b.amount,
        key: b.key ?? mapByGuess[b.label ?? ""] ?? undefined,
        label: b.label,
      })),
    },
  };
}
