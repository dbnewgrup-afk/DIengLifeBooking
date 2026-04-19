export type ProductType = "villa" | "jeep" | "transport" | "dokumentasi";
export type ProductUnit = "malam" | "jam" | "rute";
export type SortKey = "popular" | "price-asc" | "price-desc" | "rating-desc";

export interface ProductPolicy {
  checkin?: string;
  checkout?: string;
  taxInclusive?: boolean;   // default true di UI
  refundDeduction?: number; // 0.2 = 20%
}

export interface Product {
  id: string;
  type: ProductType;
  slug: string;
  name: string;

  location?: string;
  price: number;
  unit?: ProductUnit;
  published: boolean;
  rating?: number;
  trending?: boolean;

  images?: string[];
  description?: string;
  amenities?: string[];
  policy?: ProductPolicy;

  baseCapacity?: number;
  extraPersonFee?: number;
  extraMax?: number;
  maxOccupancy?: number;
}
