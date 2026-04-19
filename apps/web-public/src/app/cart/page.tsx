"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { daysBetween } from "@/lib/availability";
import { useLang } from "@/components/i18n/lang";
import { formatRupiah } from "@/lib/format";
import {
  CartItem,
  getCartItemSubtotal,
  getCartItemUnitLabel,
  getCartItemUnitPrice,
  getCartTotals,
  useCart,
} from "@/store/cart";

function formatDisplayDate(value: string | undefined, lang: "id" | "en") {
  if (!value) return lang === "en" ? "Not set" : "Belum diatur";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(lang === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function translateUnit(unit: "malam" | "jam" | "rute", lang: "id" | "en") {
  if (lang === "en") {
    if (unit === "malam") return "night";
    if (unit === "jam") return "hour";
    return "route";
  }
  return unit;
}

function kindLabel(item: CartItem, lang: "id" | "en") {
  if (item.categoryLabel) return item.categoryLabel;
  if (lang === "en") {
    if (item.kind === "villa") return "Villa";
    if (item.kind === "jeep") return "Jeep";
    if (item.kind === "transport") return "Transport";
    return "Documentation";
  }
  if (item.kind === "villa") return "Villa";
  if (item.kind === "jeep") return "Jeep";
  if (item.kind === "transport") return "Transport";
  return "Dokumentasi";
}

function itemHeadline(item: CartItem, lang: "id" | "en") {
  if (item.kind === "villa") {
    return `${formatDisplayDate(item.start, lang)} - ${formatDisplayDate(item.end, lang)}`;
  }
  return `${formatDisplayDate(item.date, lang)}${item.time ? `, ${item.time}` : ""}`;
}

function itemMeta(item: CartItem, lang: "id" | "en") {
  if (item.kind === "villa") {
    const nights = daysBetween(item.start, item.end);
    return `${nights} ${lang === "en" ? (nights === 1 ? "night" : "nights") : "malam"} | ${item.pax} ${
      lang === "en" ? "guests" : "tamu"
    }`;
  }

  if (item.kind === "transport") {
    return item.route
      ? `${lang === "en" ? "Route" : "Rute"}: ${item.route}`
      : lang === "en"
        ? "Single route service"
        : "Layanan satu rute";
  }

  const duration = `${item.hours} ${translateUnit("jam", lang)}`;
  if (item.kind === "dokumentasi" && item.packagePrice) {
    return `${duration} | ${lang === "en" ? "with package" : "dengan paket"}`;
  }
  return duration;
}

function cartItemBookingHref(item: CartItem) {
  const category = item.kind === "dokumentasi" ? "dokumentasi" : item.kind;
  return `/booking/details?category=${encodeURIComponent(category)}&productId=${encodeURIComponent(item.productId)}`;
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className={strong ? "text-base font-bold text-slate-950" : "font-semibold text-slate-900"}>
        {value}
      </span>
    </div>
  );
}

export default function CartPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);
  const { items, remove, clear, increment, decrement } = useCart();
  const summary = useMemo(() => getCartTotals(items), [items]);

  if (items.length === 0) {
    return (
      <main className="container-page py-10 text-[var(--text)]">
        <div className="mx-auto max-w-3xl rounded-[36px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.96)_100%)] p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-100 bg-[linear-gradient(180deg,#f5faff_0%,#e8f3ff_100%)] text-sm font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_25px_rgba(56,122,184,0.12)]">
            Cart
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            {L("Keranjang", "Cart")}
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            {L("Keranjangmu masih kosong", "Your cart is still empty")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            {L(
              "Pilih villa, jeep, transport, atau dokumentasi dulu. Semua pilihanmu akan muncul rapi di sini sebelum lanjut ke checkout.",
              "Pick your villa, jeep, transport, or documentation first. Everything you choose will appear here before you continue to checkout."
            )}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/booking" className="btn btn-brand">
              {L("Kembali Belanja", "Browse Products")}
            </Link>
            <Link href="/" className="btn btn-ghost">
              {L("Lihat Halaman Utama", "Back to Homepage")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container-page py-10 text-[var(--text)]">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            {L("Keranjang", "Cart")}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            {L("Ringkasan pesananmu", "Your booking summary")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {L(
              "Cart sekarang sudah bisa dipakai untuk checkout multi-item. Semua item akan dibuat sebagai booking terpisah, tapi tetap dibayar dalam satu invoice checkout.",
              "The cart can now be used for multi-item checkout. Each item becomes its own booking, but they are paid through a single checkout invoice."
            )}
          </p>
        </div>

        <Link href="/booking" className="btn btn-ghost self-start lg:self-auto">
          {L("Tambah Produk Lagi", "Add More Products")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="space-y-4">
          {items.map((item) => {
            const unitLabel = translateUnit(getCartItemUnitLabel(item), lang);
            const unitPrice = getCartItemUnitPrice(item);
            const subtotal = getCartItemSubtotal(item);

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.95)_100%)] p-4 shadow-[0_22px_52px_rgba(15,23,42,0.08)] backdrop-blur"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative h-40 overflow-hidden rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,#f6fbff_0%,#edf5ff_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] md:h-36 md:w-44 md:flex-none">
                    <Image
                      src={item.image ?? "/images/products/villa-aster.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 176px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full border border-sky-200/80 bg-[linear-gradient(180deg,#f3faff_0%,#e6f2ff_100%)] px-3 py-1 text-xs font-semibold text-sky-800">
                            {kindLabel(item, lang)}
                          </span>
                          <span className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                            {itemMeta(item, lang)}
                          </span>
                        </div>
                        <h2 className="truncate text-xl font-semibold text-slate-950">{item.name}</h2>
                        <p className="mt-2 text-sm text-slate-600">{itemHeadline(item, lang)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={cartItemBookingHref(item)}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-sky-200/80 bg-[linear-gradient(180deg,#f5fbff_0%,#e8f3ff_100%)] px-4 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
                        >
                          {L("Pakai flow single-item", "Use single-item flow")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200/80 bg-[linear-gradient(180deg,#fff7f7_0%,#ffeaea_100%)] px-4 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
                          aria-label={L(`Hapus ${item.name}`, `Remove ${item.name}`)}
                        >
                          {L("Hapus", "Remove")}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="rounded-[24px] border border-sky-100/90 bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700/80">
                          {L("Harga Dasar", "Base Price")}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-slate-950">
                          {formatRupiah(unitPrice)} / {unitLabel}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {L(
                            "Subtotal item dihitung dari konfigurasi jadwal yang kamu pilih dikali quantity saat ini.",
                            "The line subtotal is based on your selected schedule and multiplied by the current quantity."
                          )}
                        </p>
                      </div>

                      <div className="rounded-[24px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {L("Quantity", "Quantity")}
                        </p>
                        <div className="mt-3 inline-flex items-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                          <button
                            type="button"
                            onClick={() => decrement(item.id)}
                            disabled={item.quantity <= 1}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-white/80 text-lg font-bold text-slate-800 transition hover:border-slate-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={L(`Kurangi quantity ${item.name}`, `Decrease quantity for ${item.name}`)}
                          >
                            -
                          </button>
                          <span className="inline-flex min-w-12 justify-center px-3 text-base font-semibold text-slate-950">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increment(item.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#eef7ff_100%)] text-lg font-bold text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
                            aria-label={L(`Tambah quantity ${item.name}`, `Increase quantity for ${item.name}`)}
                          >
                            +
                          </button>
                        </div>

                        <div className="mt-4 border-t border-slate-200/90 pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-600">{L("Subtotal", "Subtotal")}</span>
                            <span className="text-lg font-bold text-slate-950">{formatRupiah(subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[32px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(241,247,255,0.97)_100%)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.10)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              {L("Summary", "Summary")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {L("Ringkasan Pembayaran", "Payment Summary")}
            </h2>

            <div className="mt-6 space-y-3 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              <SummaryRow label={L("Jumlah baris item", "Item lines")} value={`${summary.lineCount}`} />
              <SummaryRow label={L("Total quantity", "Total quantity")} value={`${summary.totalQuantity}`} />
              <SummaryRow label={L("Subtotal", "Subtotal")} value={formatRupiah(summary.subtotal)} />
              <SummaryRow label={L("Biaya tambahan", "Additional fees")} value={formatRupiah(summary.fees)} />
              <div className="border-t border-slate-200 pt-3">
                <SummaryRow label={L("Total akhir", "Grand total")} value={formatRupiah(summary.total)} strong />
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-sky-100/90 bg-[linear-gradient(180deg,#f5fbff_0%,#eaf4ff_100%)] p-4 text-sm leading-6 text-sky-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
              {L(
                "Checkout cart akan mengecek stok tiap item dulu, lalu membuat satu kode checkout bersama untuk semua booking yang kamu bayar dalam sekali jalan.",
                "Cart checkout will validate stock for each item first, then create one shared checkout code for all bookings you pay in a single flow."
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Link href="/checkout?source=cart" className="btn btn-brand w-full">
                {L("Checkout semua item", "Checkout all items")}
              </Link>

              <button type="button" onClick={clear} className="btn btn-ghost w-full">
                {L("Kosongkan Keranjang", "Clear Cart")}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
