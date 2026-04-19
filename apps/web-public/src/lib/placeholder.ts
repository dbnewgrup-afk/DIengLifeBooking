import type { ProductType } from "@/types";

/** Placeholder gambar per tipe produk, ukuran bebas (default 800x500). */
export function ph(type: ProductType, w = 800, h = 500): string {
  const bg: Record<ProductType, string> = {
    villa: "#EAF6EE",
    jeep: "#EAF1FF",
    transport: "#F7F1E6",
    dokumentasi: "#F4EAFB",
  };

  const emoji: Record<ProductType, string> = {
    villa: "🏡",
    jeep: "🚙",
    transport: "🚌",
    dokumentasi: "📷",
  };

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
    `<rect width='100%' height='100%' fill='${bg[type]}'/>` +
    `<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' ` +
    `font-family='system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' font-size='64' fill='#9AA1A9'>` +
    `${emoji[type]}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
