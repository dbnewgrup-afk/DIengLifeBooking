import type { Product } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { formatUnitPrice } from "@/lib/format";
import { ROUTES, catalogPath } from "@/lib/routes";
import { HorizontalCarousel } from "./horizontal-carousel";

export function RecommendSection({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<Product>;
}) {
  if (!items?.length) return null;

  return (
    <HorizontalCarousel
      title={title}
      action={
        <Link
          href={catalogPath(items[0].type)}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5"
        >
          Lihat semua
        </Link>
      }
    >
      {items.slice(0, 4).map((p) => (
        <article
          key={p.id}
          className="min-w-[280px] snap-start overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)] md:min-w-[320px]"
        >
          <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
            <Image
              src={p.images?.[0] ?? "/images/placeholders/product.jpg"}
              alt={p.name}
              fill
              className="object-cover transition duration-500 hover:scale-105"
            />
            {typeof p.rating === "number" ? (
              <div className="absolute right-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-bold text-slate-900">
                ⭐ {p.rating.toFixed(1)}
              </div>
            ) : null}
          </div>
          <div className="space-y-3 p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
              {p.location ? <p className="mt-1 text-sm text-slate-500">{p.location}</p> : null}
            </div>
            {p.description ? <p className="line-clamp-2 text-sm leading-6 text-slate-600">{p.description}</p> : null}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Mulai dari</div>
                <div className="text-base font-bold text-slate-900">{formatUnitPrice(p.price, p.unit)}</div>
              </div>
              <Link
                href={ROUTES.product(p.type, p.slug)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Lihat detail
              </Link>
            </div>
          </div>
        </article>
      ))}
    </HorizontalCarousel>
  );
}
