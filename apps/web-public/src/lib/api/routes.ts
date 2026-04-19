import type { Product, ProductType } from "@/types";

export const ROUTES = {
  home: "/",
  villa: "/villa",
  jeep: "/jeep",
  transport: "/rent",            // path katalog untuk transport
  dokumentasi: "/dokumentasi",
  booking: "/booking",
  product: (type: ProductType, slug: string) => `/product/${type}/${slug}`,
} as const;

/** Helper: path katalog berdasarkan tipe */
export function catalogPath(type: ProductType): string {
  switch (type) {
    case "villa": return ROUTES.villa;
    case "jeep": return ROUTES.jeep;
    case "transport": return ROUTES.transport;
    case "dokumentasi": return ROUTES.dokumentasi;
  }
}

/** Helper: path detail dari objek product */
export function productPath(p: Pick<Product, "type" | "slug">): string {
  return ROUTES.product(p.type, p.slug);
}
