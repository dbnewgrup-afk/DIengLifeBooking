// apps/web-public/src/app/product/[type]/[slug]/[id]/page.tsx
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/product/product-gallery";
import { ProductBookingForm } from "@/components/product/product-booking-form";
import { ProductInfo } from "@/components/product/product-info";
import { StickyBookingBar } from "@/components/product/sticky-booking-bar";

import type { Product } from "@/types";
import { formatRupiah } from "@/lib/format";
import { getProductById } from "@/data/api";

// Tambahan field opsional yang ada di data, tapi belum ada di type global
type ProductExtras = {
  facilities?: string[];
  rules?: string[];
  baseCapacity?: number;
  extraPricePerPerson?: number;
  images?: string[];
  description?: string;
  rating?: number;
  location?: string;
};
type PX = Product & ProductExtras;

async function loadProduct(id: string, slug?: string): Promise<PX | null> {
  const p = await getProductById(String(id));
  if (p) return p as PX;
  return null;
}

type PageProps = {
  params: Promise<{ type: string; slug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductDetailPage({ params }: PageProps) {
  const { id, slug, type } = await params;
  const product = await loadProduct(id, slug);
  if (!product) notFound();

  const nightly = product.price || 0;
  const title = product.name || "Tanpa Nama";
  const location = product.location || "Lokasi rahasia";
  const rating = product.rating ?? 4.8;

  // Safe fallback untuk properti opsional
  const facilities = Array.isArray(product.facilities) ? product.facilities : [];
  const rules = Array.isArray(product.rules) ? product.rules : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const baseCapacity = typeof product.baseCapacity === "number" ? product.baseCapacity : 2;
  const extraPricePerPerson =
    typeof product.extraPricePerPerson === "number" ? product.extraPricePerPerson : 200_000;
  const description =
    typeof product.description === "string" && product.description.trim()
      ? product.description
      : "Deskripsi singkat yang no-drama. Semua yang kamu butuh untuk liburan santai tanpa ribet.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f9ff] via-[#f9fbff] to-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-4 text-sm text-slate-500">
          <span className="opacity-80">Home</span>
          <span className="mx-2">/</span>
          <span className="capitalize opacity-80">{type || "villa"}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">{title}</span>
        </nav>

        <header className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {title} <span className="ml-1 align-middle">🌴✨</span>
            </h1>
            <p className="text-slate-500">
              {location} • Disukai{" "}
              <span className="font-semibold text-slate-700">{rating.toFixed(1)}</span> / 5
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">mulai dari</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {formatRupiah(nightly)}{" "}
              <span className="text-sm font-semibold text-slate-500">/ malam</span>
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-8">
            <ProductGallery images={images} title={title} badge="🔥 Banyak dicari minggu ini" />

            <div className="mt-6">
              <ProductInfo
                title={`Kenapa harus ${title}?`}
                shortDescription={description}
                facilities={facilities}
                rules={rules}
              />
            </div>
          </section>

          <aside className="lg:col-span-4">
            <ProductBookingForm
              productId={String(product.id)}
              title={title}
              nightlyPrice={nightly}
              baseCapacity={baseCapacity}
              extraPricePerPerson={extraPricePerPerson}
              rating={rating}
              location={location}
              ctaText="Booking Sekarang"
              notes="Free reschedule H-7. Bayar aman pakai Xendit."
            />
          </aside>
        </div>
      </div>

      <StickyBookingBar title={title} nightlyPrice={nightly} productId={String(product.id)} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id, slug } = await params;
  const product = await loadProduct(id, slug);
  if (!product) return {};
  const title = `${product.name} | Dieng Life Villas`;
  const description =
    product.description ??
    "Liburan santai, dompet tetap damai. Lihat detail dan booking sekarang.";
  const images = Array.isArray(product.images) ? product.images.slice(0, 1) : [];

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
