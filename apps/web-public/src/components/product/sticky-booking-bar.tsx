"use client";

import { formatRupiah } from "@/lib/format";
import { useLang } from "@/components/i18n/lang";

type Props = {
  title: string;
  nightlyPrice: number;
  productId: string;
  ctaLabel?: string;
  onBookNow?: () => void;
  priceSuffix?: string;
};

export function StickyBookingBar({
  title,
  nightlyPrice,
  ctaLabel,
  onBookNow,
  priceSuffix,
}: Props) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="sticky bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 lg:hidden">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600">
            {formatRupiah(nightlyPrice)}{" "}
            <span className="text-[11px] text-slate-500">
              {priceSuffix ?? L("/ malam", "/ night")}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onBookNow}
          className="rounded-xl bg-gradient-to-r from-[#7dd3fc] to-[#a78bfa] px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          {ctaLabel ?? L("Booking", "Book")}
        </button>
      </div>
    </div>
  );
}
