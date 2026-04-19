import { NextResponse } from "next/server";
import { getPublicApiErrorMessage, listProducts } from "@/data/api";
import type { Product } from "@/types";

/** ===== Helpers type-safe ===== */
type CatalogType = "villa" | "jeep" | "transport" | "dokumentasi";
type Sort = "popular" | "price_asc" | "price_desc" | "rating_desc";

const isType = (v: string | null): v is CatalogType =>
  v === "villa" || v === "jeep" || v === "transport" || v === "dokumentasi";

const isSort = (v: string | null): v is Sort =>
  v === "popular" || v === "price_asc" || v === "price_desc" || v === "rating_desc";

/** Ambil angka/string opsional dari object tanpa any */
function getNum(obj: Record<string, unknown>, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
}
function getStr(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

/** Harga normalisasi: dukung price, pricePerNight/Hour/Route */
function priceOf(p: Product): number {
  const o = p as unknown as Record<string, unknown>;
  return (
    getNum(o, "price") ??
    getNum(o, "pricePerNight") ??
    getNum(o, "pricePerHour") ??
    getNum(o, "pricePerRoute") ??
    0
  );
}

/** RatingCount opsional untuk "popular" */
function ratingCountOf(p: Product): number {
  const o = p as unknown as Record<string, unknown>;
  return getNum(o, "ratingCount") ?? 0;
}

/** Text searchable opsional: partner/description/location jika ada */
function searchableText(p: Product): string {
  const o = p as unknown as Record<string, unknown>;
  const parts = [
    p.name,
    getStr(o, "partner"),
    getStr(o, "description"),
    getStr(o, "location"),
  ].filter(Boolean) as string[];
  return parts.join(" ").toLowerCase();
}

/** ===== Handler ===== */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const type: CatalogType = isType(url.searchParams.get("type"))
      ? (url.searchParams.get("type") as CatalogType)
      : "villa";

    const q = url.searchParams.get("q")?.toLowerCase() ?? "";

    const priceMin = Number(url.searchParams.get("priceMin") ?? 0);
    const priceMax = Number(url.searchParams.get("priceMax") ?? 9_999_999_999);

    const ratingMin = Number(url.searchParams.get("ratingMin") ?? 0);

    const sort: Sort = isSort(url.searchParams.get("sort"))
      ? (url.searchParams.get("sort") as Sort)
      : "popular";

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(Math.max(1, Number(url.searchParams.get("pageSize") ?? 12)), 40);

    let data = await listProducts({
      type,
      q,
      minPrice: priceMin,
      maxPrice: priceMax,
      limit: 200,
    });

    // 4) rating minimal (kalau ada field rating)
    if (ratingMin > 0) {
      data = data.filter((p) => (p.rating ?? 0) >= ratingMin);
    }

    // 5) sorting
    switch (sort) {
      case "price_asc":
        data.sort((a, b) => priceOf(a) - priceOf(b));
        break;
      case "price_desc":
        data.sort((a, b) => priceOf(b) - priceOf(a));
        break;
      case "rating_desc":
        data.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default: {
        // popular: rating tinggi, ratingCount (kalau ada), sedikit shuffle deterministik
        data.sort(
          (a, b) =>
            (b.rating ?? 0) - (a.rating ?? 0) ||
            ratingCountOf(b) - ratingCountOf(a) ||
            (priceOf(a) % 7) - (priceOf(b) % 7)
        );
      }
    }

    // 6) paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = data.slice(start, end);
    const nextPage = end < data.length ? page + 1 : undefined;

    return NextResponse.json({ items, nextPage });
  } catch (cause) {
    return NextResponse.json(
      {
        error: "catalog_fetch_failed",
        message: getPublicApiErrorMessage(cause, "Katalog publik gagal dimuat."),
      },
      { status: 502 }
    );
  }
}
