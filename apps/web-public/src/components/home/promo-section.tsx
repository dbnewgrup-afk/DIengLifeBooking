"use client";

import Link from "next/link";
import Image from "next/image";
import type { PromoItem } from "@/lib/contracts";
import type { HomepagePromoContent } from "@/lib/homepage-cms";
import { useI18n } from "@/components/i18n/useI18n";

export function PromoSection({
  promos,
  content,
}: {
  promos: ReadonlyArray<PromoItem>;
  content: HomepagePromoContent;
}) {
  const { t } = useI18n();
  if (!promos?.length) return null;

  return (
    <section className="container-page py-8" aria-labelledby="promo-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="promo-title" className="text-xl font-semibold text-slate-900">{content.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{t("promo_home_subtitle")}</p>
        </div>
        <Link href={content.ctaHref} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5">
          {content.ctaLabel}
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {promos.slice(0, 4).map((promo) => (
          <article
            key={promo.id}
            className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_50px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <Image
                src={promo.imageUrl || "/images/slider.png"}
                alt={promo.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-900">
                  {promo.discount}
                </span>
                {promo.badge ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {promo.badge}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">{promo.title}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  {promo.code}
                </span>
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-slate-600">{promo.description}</p>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <Link
                  href={`/promo/${promo.slug}`}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t("promo_view")}
                </Link>
                <Link href={promo.href} className="text-sm font-semibold text-sky-700 underline-offset-4 hover:underline">
                  {t("promo_apply")}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
