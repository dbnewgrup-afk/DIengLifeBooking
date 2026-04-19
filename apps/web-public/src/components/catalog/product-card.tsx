"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { formatUnitPrice } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { useLang } from "@/components/i18n/lang";

export function ProductCard({ p }: { p: Product }) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const cover = p.images?.[0] ?? "/images/placeholders/product.jpg";

  return (
    <Link href={ROUTES.product(p.type, p.slug)} className="card block hover:shadow-md transition">
      <img
        src={cover}
        alt={p.name}
        loading="lazy"
        width={800}
        height={500}
        className="w-full aspect-[16/10] object-cover rounded-xl mb-3 block"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{p.name}</div>
        {typeof p.rating === "number" && (
          <span
            className="badge"
            aria-label={L(`Rating ${p.rating} dari 5`, `Rating ${p.rating} out of 5`)}
          >
            ⭐ {p.rating.toFixed(1)}
          </span>
        )}
      </div>

      {p.location && <div className="text-sm text-[var(--muted)]">{p.location}</div>}

      <div className="mt-2 text-sm">
        <span className="font-semibold">{formatUnitPrice(p.price, p.unit)}</span>
      </div>
    </Link>
  );
}
