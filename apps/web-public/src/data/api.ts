import type { Product, ProductType, SortKey } from "@/types";

export interface ListParams {
  type?: ProductType;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: SortKey;
  offset?: number;
  limit?: number;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") ??
  "";
const IS_BUILD_TIME =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

type ApiListing = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: "villa" | "jeep" | "transport" | "dokumentasi";
  unit?: "malam" | "jam" | "rute";
  location?: string;
  price: number;
  published?: boolean;
  rating?: number;
  trending?: boolean;
  images?: string[];
  maxOccupancy?: number;
};

type ApiAvailabilityItem = {
  id: string;
  date: string;
  stock: number;
  reservedCount: number;
  remainingStock: number;
  isAvailable: boolean;
  soldOut: boolean;
  priceOverride?: number | null;
};

type ApiPromo = {
  id: string;
  slug: string;
  title: string;
  code: string;
  discount: string;
  description: string;
  until: string;
  category: "villa" | "jeep" | "rent" | "dokumentasi" | "semua";
  href: string;
  badge?: string;
  imageUrl?: string;
  terms?: string;
};

function withApiPrefix(path: string) {
  return path.startsWith("/api/") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`;
}

export type WebsiteReview = {
  id: string;
  name: string;
  city?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  createdAt: string;
  updatedAt: string;
};

export type ProductReview = {
  id: string;
  rating: number;
  comment: string;
  status: "VISIBLE" | "HIDDEN" | "FLAGGED";
  createdAt: string;
  authorName: string;
  bookingCode: string;
  stayStart: string;
  stayEnd: string;
};

export type ProductReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

export type PublicAvailabilityDay = {
  id: string;
  date: string;
  stock: number;
  reservedCount: number;
  remainingStock: number;
  isAvailable: boolean;
  soldOut: boolean;
  priceOverride?: number | null;
};

export class PublicApiError extends Error {
  status?: number;
  path: string;

  constructor(message: string, options: { path: string; status?: number; cause?: unknown }) {
    super(message);
    this.name = "PublicApiError";
    this.path = options.path;
    this.status = options.status;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isPublicApiNotFound(error: unknown) {
  return error instanceof PublicApiError && error.status === 404;
}

function isTechnicalPublicApiMessage(message: string) {
  return /prisma|econn|connection refused|can't reach database server|can't connect to database server/i.test(
    message
  );
}

export function getPublicApiErrorMessage(
  error: unknown,
  fallback = "Gagal memuat data dari server."
) {
  if (error instanceof PublicApiError) {
    if ((error.status ?? 0) >= 500 || isTechnicalPublicApiMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }
  if (error instanceof Error && error.message.trim()) {
    if (isTechnicalPublicApiMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }
  return fallback;
}

function assertApiAvailable(path: string) {
  if (!API_BASE_URL) {
    throw new PublicApiError("URL API publik belum dikonfigurasi.", { path });
  }

  if (IS_BUILD_TIME) {
    throw new PublicApiError("API publik tidak tersedia saat proses build.", { path });
  }
}

function toProduct(item: ApiListing): Product {
  return {
    id: item.id,
    type: item.type,
    slug: item.slug,
    name: item.name,
    description: item.description,
    unit: item.unit,
    location: item.location,
    price: item.price,
    published: item.published ?? true,
    rating: item.rating,
    trending: item.trending,
    images: item.images ?? [],
    maxOccupancy: item.maxOccupancy,
  };
}

async function fetchJson<T>(path: string): Promise<T> {
  assertApiAvailable(path);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
  } catch (error) {
    throw new PublicApiError("Tidak bisa terhubung ke API publik.", {
      path,
      cause: error,
    });
  }

  if (!res.ok) {
    let message = `API ${res.status}`;
    try {
      const json = (await res.json()) as { message?: string; error?: string };
      message = json.message ?? json.error ?? message;
    } catch {
      // ignore invalid error body
    }
    throw new PublicApiError(message, { path, status: res.status });
  }
  return res.json() as Promise<T>;
}

/**
 * Frontend data gateway for public catalog pages.
 * Never hide API failure as an empty dataset.
 */
export async function listProducts(params: ListParams = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params.type) {
    qs.set(
      "type",
      params.type === "villa"
        ? "VILLA"
        : params.type === "jeep"
          ? "JEEP"
          : params.type === "transport"
            ? "TRANSPORT"
            : "PHOTOGRAPHER"
    );
  }
  if (params.q) qs.set("q", params.q);
  if (typeof params.minPrice === "number") qs.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") qs.set("maxPrice", String(params.maxPrice));
  qs.set("active", "true");
  qs.set("page", "1");
  qs.set("pageSize", String(params.limit ?? 24));

  const requestPath = `/api/products?${qs.toString()}`;
  const json = await fetchJson<{ items: ApiListing[] }>(requestPath);
  const rows = json.items.map(toProduct);
  let filtered = rows;

  if (typeof params.minRating === "number") {
    const minRating = params.minRating;
    filtered = filtered.filter((product) => (product.rating ?? 0) >= minRating);
  }

  switch (params.sort ?? "popular") {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "rating-desc":
      filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "popular":
    default:
      filtered.sort(
        (a, b) =>
          Number(Boolean(b.trending)) - Number(Boolean(a.trending)) ||
          (b.rating ?? 0) - (a.rating ?? 0)
      );
      break;
  }

  const offset = params.offset ?? 0;
  const limit = params.limit ?? 24;
  return filtered.slice(offset, offset + limit);
}

export async function getProductBySlug(
  type: ProductType,
  slug: string
): Promise<Product | undefined> {
  const requestPath = `/api/products/${slug}`;
  try {
    const json = await fetchJson<{ item: ApiListing }>(requestPath);
    const product = toProduct(json.item);
    return product.type === type ? product : undefined;
  } catch (error) {
    if (isPublicApiNotFound(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  const requestPath = `/api/products/${id}`;
  try {
    const json = await fetchJson<{ item: ApiListing }>(requestPath);
    return toProduct(json.item);
  } catch (error) {
    if (isPublicApiNotFound(error)) {
      return undefined;
    }
    throw error;
  }
}

export async function getProductAvailabilityMonth(idOrSlug: string, month: string) {
  const requestPath = `/api/products/${encodeURIComponent(idOrSlug)}/availability/public?month=${encodeURIComponent(
    month
  )}`;
  const json = await fetchJson<{ items: ApiAvailabilityItem[] }>(requestPath);

  return json.items.map(
    (item) =>
      ({
        id: item.id,
        date: item.date,
        stock: item.stock,
        reservedCount: item.reservedCount,
        remainingStock: item.remainingStock,
        isAvailable: item.isAvailable,
        soldOut: item.soldOut,
        priceOverride: item.priceOverride ?? null,
      }) satisfies PublicAvailabilityDay
  );
}

/** Untuk landing page: trending per tipe, default limit 4 */
export async function listTrending(params: {
  type?: ProductType;
  offset?: number;
  limit?: number;
} = {}): Promise<Product[]> {
  const rows = await listProducts({
    type: params.type,
    limit: params.limit ?? 4,
    offset: params.offset ?? 0,
    sort: "popular",
  });
  return rows.filter((product) => product.trending).slice(0, params.limit ?? 4);
}

export async function listPromos() {
  const requestPath = "/api/promos";
  const json = await fetchJson<{ items: ApiPromo[] }>(requestPath);
  return json.items;
}

export async function listWebsiteReviews(params?: { includePending?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.includePending) qs.set("includePending", "true");
  const requestPath = `${withApiPrefix("/website-reviews")}${qs.size ? `?${qs.toString()}` : ""}`;
  const json = await fetchJson<{ items: WebsiteReview[] }>(requestPath);
  return json.items;
}

export async function createWebsiteReview(payload: {
  name: string;
  city?: string;
  rating: number;
  comment: string;
  imageUrl?: string;
}) {
  const res = await fetch(`${API_BASE_URL}${withApiPrefix("/website-reviews")}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string; message?: string }).message || (json as { error?: string }).error || "Gagal mengirim review.");
  }

  return json as { ok: true; item: WebsiteReview; message?: string };
}

export async function listProductReviews(listingIdOrSlug: string) {
  const requestPath = `${withApiPrefix(`/reviews/listings/${encodeURIComponent(listingIdOrSlug)}`)}`;
  const json = await fetchJson<{
    summary: ProductReviewSummary;
    items: ProductReview[];
  }>(requestPath);

  return {
    summary: json.summary,
    items: json.items,
  };
}
