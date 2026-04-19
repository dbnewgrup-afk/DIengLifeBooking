import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product, ProductType } from "@/types";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { getProductBySlug, listProductReviews, type ProductReview, type ProductReviewSummary } from "@/data/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Next 15: params di generateMetadata harus di-await
export async function generateMetadata(
  props: { params: Promise<{ type: ProductType; slug: string }> }
): Promise<Metadata> {
  const { type, slug } = await props.params;
  const p = await getProductBySlug(type, slug);
  return {
    title: p ? `${p.name} — Dieng Life Villas` : "Produk tidak ditemukan",
    description: p?.location ? `Detail ${p.name} di ${p.location}` : p ? `Detail ${p.name}` : "",
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ type: ProductType; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { type, slug } = await props.params;
  const sp = await props.searchParams;

  const product: Product | undefined = await getProductBySlug(type, slug);
  if (!product) return notFound();

  let reviews: ProductReview[] = [];
  let reviewSummary: ProductReviewSummary = {
    averageRating: 0,
    totalReviews: 0,
  };

  try {
    const reviewPayload = await listProductReviews(product.id);
    reviews = reviewPayload.items;
    reviewSummary = reviewPayload.summary;
  } catch {
    // Keep product detail usable even if review API is unavailable.
  }

  return (
    <ProductDetailClient
      product={product}
      reviews={reviews}
      reviewSummary={reviewSummary}
      initialQuery={{
        start: typeof sp.start === "string" ? sp.start : undefined,
        end:   typeof sp.end   === "string" ? sp.end   : undefined,
        date:  typeof sp.date  === "string" ? sp.date  : undefined,
        time:  typeof sp.time  === "string" ? sp.time  : undefined,
      }}
    />
  );
}
