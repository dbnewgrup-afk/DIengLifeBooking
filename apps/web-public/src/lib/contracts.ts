// src/lib/contracts.ts
import type { Product, ProductType } from "@/types";

/** Item ringan untuk list card (sesuai kebutuhan ProductCard) */
export type ProductListItem = Pick<
  Product,
  "id" | "type" | "slug" | "name" | "location" | "price" | "unit" | "rating"
> & {
  /** URL cover opsional; FE sudah punya placeholder kalau kosong */
  cover?: string;
};

/** Data promo untuk landing */
export type PromoItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  href: string;
  badge?: string;
  imageUrl?: string;
  terms?: string;
  until?: string;
  category?: "villa" | "jeep" | "rent" | "dokumentasi" | "semua";
};

export type TrendingParams = {
  type: ProductType;
  limit?: number;
};

/** Query katalog yang kita pakai di FE/BE */
export type CatalogSearchParams = {
  type: ProductType;
  q?: string;       // keyword "where"
  start?: string;   // YYYY-MM-DD (villa)
  end?: string;     // YYYY-MM-DD (villa)
  date?: string;    // YYYY-MM-DD (hour-based)
  time?: string;    // HH:mm (hour-based)
  page?: number;
  pageSize?: number;
};

/** Alias untuk kompatibilitas dengan kode lama */
export type SearchParams = CatalogSearchParams;
