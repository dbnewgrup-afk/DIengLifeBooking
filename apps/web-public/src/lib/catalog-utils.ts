import type { ProductType, SortKey } from "@/types";

export type Bucket = { id: string; label: string; min: number; max: number };
export type CatalogInitialState = {
  q: string;
  bucketId: string;
  rating: number;     // 0 = semua
  sort: SortKey;
};

const SORT_KEYS = ["popular", "price-asc", "price-desc", "rating-desc"] as const;
function isSortKey(v: string): v is SortKey {
  return (SORT_KEYS as readonly string[]).includes(v);
}

/** Definisi bucket harga per tipe produk */
export function getBucketsFor(type: ProductType): Bucket[] {
  // angka contoh; sesuaikan nanti
  if (type === "villa") {
    return [
      { id: "v1", label: "≤ 1 jt",   min: 0,       max: 1_000_000 },
      { id: "v2", label: "1–2 jt",   min: 1_000_000, max: 2_000_000 },
      { id: "v3", label: "2–3 jt",   min: 2_000_000, max: 3_000_000 },
      { id: "v4", label: "≥ 3 jt",   min: 3_000_000, max: Number.MAX_SAFE_INTEGER },
    ];
  }
  if (type === "jeep" || type === "dokumentasi") {
    return [
      { id: "h1", label: "≤ 500 rb", min: 0,       max: 500_000 },
      { id: "h2", label: "500–700",  min: 500_000, max: 700_000 },
      { id: "h3", label: "≥ 700 rb", min: 700_000, max: Number.MAX_SAFE_INTEGER },
    ];
  }
  // transport
  return [
    { id: "t1", label: "≤ 300 rb", min: 0,       max: 300_000 },
    { id: "t2", label: "300–800",  min: 300_000, max: 800_000 },
    { id: "t3", label: "≥ 800 rb", min: 800_000, max: Number.MAX_SAFE_INTEGER },
  ];
}

export function getBucketById(buckets: Bucket[], id?: string | null) {
  return id ? buckets.find(b => b.id === id) : undefined;
}

/** Parse query katalog → state awal (AMAN untuk Next 15: `searchParams` sudah di-await) */
export function parseCatalogQuery(
  _type: ProductType, // disertakan untuk future-proof; tidak dipakai di sini
  sp: Record<string, string | string[] | undefined>
): CatalogInitialState {
  const pick = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };

  const q        = String(pick("q") || "");
  const bucketId = String(pick("bucket") || "");
  const rating   = Number(pick("rating")) || 0;
  const sortRaw  = String(pick("sort") || "");
  const sort: SortKey = isSortKey(sortRaw) ? sortRaw : "popular";

  return { q, bucketId, rating, sort };
}

/** Bangun querystring dari state (untuk sinkronisasi URL) */
export function toSearchString(state: {
  q?: string;
  bucketId?: string;
  rating?: number;
  sort?: SortKey;
}) {
  const qs = new URLSearchParams();
  if (state.q) qs.set("q", state.q);
  if (state.bucketId) qs.set("bucket", state.bucketId);
  if (state.rating && state.rating > 0) qs.set("rating", String(state.rating));
  if (state.sort && state.sort !== "popular") qs.set("sort", state.sort);
  return qs.toString();
}
