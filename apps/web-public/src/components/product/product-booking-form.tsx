"use client";

import { useMemo, useState } from "react";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

type Props = {
  productId: string;
  title: string;
  nightlyPrice: number;
  baseCapacity?: number;
  extraPricePerPerson?: number;
  rating?: number;
  location?: string;
  ctaText?: string;
  notes?: string;
};

export function ProductBookingForm({
  productId,
  title,
  nightlyPrice,
  baseCapacity = 2,
  extraPricePerPerson = 200_000,
  rating = 4.8,
  location = "Ubud",
  ctaText = "Booking Sekarang",
  notes = "Free reschedule H-7. Bayar aman.",
}: Props) {
  const [guests, setGuests] = useState(baseCapacity);
  const [extra, setExtra] = useState(0);

  const subtotal = useMemo(() => {
    const base = nightlyPrice;
    const add = extra * extraPricePerPerson;
    return base + add;
  }, [nightlyPrice, extra, extraPricePerPerson]);

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">mulai dari</div>
        <div className="text-2xl font-extrabold text-slate-900">
          {formatRupiah(nightlyPrice)} <span className="text-sm font-semibold text-slate-500">/ malam</span>
        </div>
        <div className="text-[11px] text-slate-500">start from {formatRupiahShort(nightlyPrice)}/malam</div>
      </div>

      <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{location} • {rating.toFixed(1)}/5</div>
      </div>

      <div className="mb-3">
        <label className="mb-1 block text-sm font-medium text-slate-700">Tamu (kapasitas dasar)</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setGuests((v) => Math.max(1, v - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
            aria-label="Kurangi tamu"
          >
            −
          </button>
          <div className="min-w-[3rem] text-center font-semibold">{guests}</div>
          <button
            type="button"
            onClick={() => setGuests((v) => v + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
            aria-label="Tambah tamu"
          >
            +
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">Kapasitas dasar: {baseCapacity} orang.</p>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Tambahan orang</label>
          <span className="text-xs text-slate-500">+{formatRupiah(extraPricePerPerson)} / orang / malam</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExtra((v) => Math.max(0, v - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
            aria-label="Kurangi tambahan"
          >
            −
          </button>
          <div className="min-w-[3rem] text-center font-semibold">{extra}</div>
          <button
            type="button"
            onClick={() => setExtra((v) => v + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200"
            aria-label="Tambah tambahan"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Estimasi / malam</span>
          <span className="text-lg font-extrabold text-slate-900">{formatRupiah(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{notes}</p>
      </div>

      <button
        type="button"
        onClick={() => {
          console.log("book-now", { productId, guests, extra });
        }}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#7dd3fc] to-[#a78bfa] px-5 py-3 font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
      >
        {ctaText}
      </button>
    </div>
  );
}
