"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { DataState } from "@/components/ui";
import { getProductById, getPublicApiErrorMessage } from "@/data/api";
import { useProductAvailability } from "@/hooks/use-product-availability";
import {
  isDateAvailable,
  isRangeAvailable,
  toAvailabilityMonth,
} from "@/lib/availability";
import { makeOrderCode, saveBookingDraft, type BookingDraft } from "@/lib/booking-flow";
import { formatRupiah } from "@/lib/format";
import type { Product, ProductType } from "@/types";

const nightsBetween = (start?: string, end?: string) => {
  if (!start || !end) return 0;
  const d1 = new Date(start);
  const d2 = new Date(end);
  const ms = d2.getTime() - d1.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

export default function BookingDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") as ProductType | null) ?? "villa";
  const productId = searchParams.get("productId") ?? "";

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [addonJeep, setAddonJeep] = useState(false);
  const [addonBreakfast, setAddonBreakfast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [productError, setProductError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingProduct(true);
      setProductError(null);
      try {
        const product = productId ? await getProductById(productId) : undefined;
        if (!cancelled) {
          setSelectedProduct(product?.published ? product : null);
        }
      } catch (cause) {
        if (!cancelled) {
          setSelectedProduct(null);
          setProductError(getPublicApiErrorMessage(cause, "Produk booking gagal dimuat dari server."));
        }
      } finally {
        if (!cancelled) {
          setLoadingProduct(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, reloadKey]);

  const effectiveCategory = selectedProduct?.type ?? category;
  const shouldFallback = !loadingProduct && !productError && (!productId || !selectedProduct);

  useEffect(() => {
    if (!shouldFallback) return;

    setRedirectCountdown(5);
    const timer = window.setInterval(() => {
      setRedirectCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          router.replace(`/booking?category=${encodeURIComponent(effectiveCategory)}`);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [effectiveCategory, router, shouldFallback]);

  const nights = useMemo(() => nightsBetween(startDate, endDate), [endDate, startDate]);
  const isStayProduct = (selectedProduct?.unit ?? "malam") === "malam";
  const quantity = isStayProduct ? nights : 1;
  const productPrice = selectedProduct?.price ?? 0;
  const availabilityMonths = useMemo(() => {
    if (isStayProduct) {
      return [toAvailabilityMonth(startDate), toAvailabilityMonth(endDate)];
    }

    return [toAvailabilityMonth(startDate)];
  }, [endDate, isStayProduct, startDate]);
  const availability = useProductAvailability(
    selectedProduct?.id ?? productId,
    availabilityMonths
  );
  const selectedDateAvailable = useMemo(
    () => (availability.loading ? null : isDateAvailable(startDate, availability.byDate)),
    [availability.byDate, availability.loading, startDate]
  );
  const selectedRangeAvailable = useMemo(
    () =>
      availability.loading ? null : isRangeAvailable(startDate, endDate, availability.byDate),
    [availability.byDate, availability.loading, endDate, startDate]
  );
  const exceedsMaxGuest = useMemo(() => {
    const maxGuest = selectedProduct?.maxOccupancy;
    if (!maxGuest) return false;
    return guests > maxGuest;
  }, [guests, selectedProduct?.maxOccupancy]);

  useEffect(() => {
    if (!isStayProduct && endDate) {
      setEndDate("");
    }
  }, [endDate, isStayProduct]);
  const addonLines = [
    { key: "jeep" as const, label: "Jeep Sunrise Tour", price: 500_000, enabled: addonJeep },
    { key: "breakfast" as const, label: "Sarapan (30 tamu)", price: 600_000, enabled: addonBreakfast },
  ];
  const subtotal = productPrice * quantity;
  const addonTotal = addonLines.filter((addon) => addon.enabled).reduce((sum, addon) => sum + addon.price, 0);
  const total = subtotal + addonTotal;

  const canContinue =
    Boolean(selectedProduct) &&
    Boolean(fullName.trim()) &&
    Boolean(email.trim()) &&
    Boolean(phone.trim()) &&
    Boolean(identityNumber.trim()) &&
    (isStayProduct ? nights > 0 : Boolean(startDate)) &&
    (isStayProduct ? selectedRangeAvailable !== false : selectedDateAvailable !== false) &&
    guests > 0 &&
    !exceedsMaxGuest &&
    total > 0;

  function handleContinue() {
    if (!selectedProduct) {
      setError("Produk booking belum dipilih.");
      return;
    }

    if (!canContinue) {
      setError("Lengkapi dulu data tamu dan jadwal booking.");
      return;
    }

    if (exceedsMaxGuest) {
      setError(`Jumlah tamu melebihi kapasitas maksimum ${selectedProduct.maxOccupancy}.`);
      return;
    }

    if (isStayProduct && selectedRangeAvailable === false) {
      setError("Tanggal yang dipilih sudah penuh atau belum tersedia.");
      return;
    }

    if (!isStayProduct && selectedDateAvailable === false) {
      setError("Tanggal yang dipilih sudah penuh atau belum tersedia.");
      return;
    }

    const draft: BookingDraft = {
      orderCode: makeOrderCode(),
      createdAt: new Date().toISOString(),
      category: selectedProduct.type,
      promoCode: promoCode.trim() || undefined,
      product: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        image: selectedProduct.images?.[0] ?? "/images/products/villa-aster.jpg",
        location: selectedProduct.location ?? "Dieng",
        unit: selectedProduct.unit ?? "malam",
        price: selectedProduct.price,
      },
      customer: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        identityNumber: identityNumber.trim(),
      },
      booking: {
        startDate,
        endDate,
        guests,
        quantity,
        notes: notes.trim() || undefined,
      },
      addons: addonLines,
      pricing: {
        subtotal,
        addonTotal,
        total,
      },
    };

    saveBookingDraft(draft);
    router.push("/checkout");
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <BookingStepper current="details" className="mb-6" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Step 2</p>
            <h1 className="mt-2 text-3xl font-black">Isi data booking</h1>
            <p className="mt-2 text-sm text-slate-300">
              Setelah produk dipilih, sekarang isi data tamu dan detail jadwalnya.
            </p>
          </div>

          <Link
            href={`/booking?category=${encodeURIComponent(effectiveCategory)}${selectedProduct ? `&productId=${encodeURIComponent(selectedProduct.id)}` : ""}`}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Kembali pilih produk
          </Link>
        </div>

        {!productId && !loadingProduct ? (
          <div className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-200">
            Belum ada produk yang dipilih. Kamu akan diarahkan balik ke halaman booking dalam {redirectCountdown} detik.
          </div>
        ) : null}

        {productError ? (
          <div className="mt-8">
            <DataState
              tone="error"
              className="border-rose-400/20 bg-rose-500/10 text-white"
              title="Produk booking gagal dimuat"
              description={productError}
            >
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-400"
              >
                Coba lagi
              </button>
            </DataState>
          </div>
        ) : null}

        {productId && shouldFallback ? (
          <div className="mt-8 rounded-[28px] border border-amber-400/20 bg-amber-500/10 p-6">
            <h2 className="text-xl font-bold text-amber-100">Produk tidak ditemukan</h2>
            <p className="mt-3 text-sm leading-7 text-amber-100/90">
              Product ID yang dibuka di URL ini sudah tidak valid atau belum tersedia lagi. Kamu akan dibalikin ke halaman pilih produk dalam {redirectCountdown} detik.
            </p>
            <Link
              href={`/booking?category=${encodeURIComponent(effectiveCategory)}`}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-amber-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
            >
              Balik pilih produk sekarang
            </Link>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            {productError ? (
              <DataState
                tone="error"
                className="border-white/10 bg-white/5 text-white"
                title="Form booking ditahan"
                description="Data produk belum bisa dipakai karena koneksi ke API gagal. Muat ulang data dulu sebelum lanjut."
              />
            ) : shouldFallback ? (
              <DataState
                tone="empty"
                className="border-white/10 bg-white/5 text-white"
                title="Produk booking belum valid"
                description="Detail form booking ditahan dulu sampai produk valid dipilih dari langkah pertama."
              />
            ) : (
              <>
                {error ? (
                  <div className="mb-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nama lengkap">
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="Nama pemesan" />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="nama@email.com" />
                  </Field>
                  <Field label="Nomor WhatsApp">
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="08xxxxxxxxxx" />
                  </Field>
                  <Field label="Nomor identitas">
                    <input value={identityNumber} onChange={(event) => setIdentityNumber(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="KTP / Paspor" />
                  </Field>
                  <Field label={isStayProduct ? "Check-in" : "Tanggal kegiatan"}>
                    <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" />
                  </Field>
                  {isStayProduct ? (
                    <Field label="Check-out">
                      <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" />
                    </Field>
                  ) : null}
                  <Field label={isStayProduct ? "Jumlah tamu" : "Jumlah peserta"}>
                    <input type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value || 0))} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" />
                  </Field>
                  <Field label="Kode promo">
                    <input value={promoCode} onChange={(event) => setPromoCode(event.target.value.toUpperCase())} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="Opsional" />
                  </Field>
                  <Field label="Catatan tambahan">
                    <input value={notes} onChange={(event) => setNotes(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400" placeholder="Opsional" />
                  </Field>
                </div>

                {availability.error ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {availability.error}
                  </div>
                ) : null}

                {exceedsMaxGuest && selectedProduct?.maxOccupancy ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    Jumlah tamu melebihi kapasitas maksimum {selectedProduct.maxOccupancy}.
                  </div>
                ) : null}

                {isStayProduct && selectedRangeAvailable === false ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    Tanggal yang dipilih sudah penuh atau belum tersedia.
                  </div>
                ) : null}

                {!isStayProduct && selectedDateAvailable === false ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    Tanggal yang dipilih sudah penuh atau belum tersedia.
                  </div>
                ) : null}

                <div className="mt-6">
                  <div className="text-sm font-semibold text-slate-200">Add-on</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {addonLines.map((addon) => (
                      <button
                        key={addon.key}
                        type="button"
                        onClick={() => {
                          if (addon.key === "jeep") setAddonJeep((value) => !value);
                          if (addon.key === "breakfast") setAddonBreakfast((value) => !value);
                        }}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${addon.enabled ? "border-emerald-400 bg-emerald-500 text-slate-950" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}`}
                      >
                        {addon.label} - {formatRupiah(addon.price)}
                      </button>
                    ))}
                  </div>
                </div>

                <button type="button" onClick={handleContinue} disabled={!canContinue} className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300">
                  Lanjut ke pembayaran
                </button>
              </>
            )}
          </section>

          <aside className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            {selectedProduct ? (
              <>
                <div className="overflow-hidden rounded-3xl border border-white/10">
                  <Image src={selectedProduct.images?.[0] ?? "/images/products/villa-aster.jpg"} alt={selectedProduct.name} width={800} height={540} className="h-52 w-full object-cover" />
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  <p className="mt-1 text-sm text-slate-300">{selectedProduct.location ?? "Dieng"}</p>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <SummaryRow label="Harga dasar" value={formatRupiah(productPrice)} />
                  <SummaryRow label={isStayProduct ? "Durasi" : "Unit"} value={isStayProduct ? `${nights || 0} malam` : selectedProduct.unit ?? "-"} />
                  <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
                  <SummaryRow label="Add-on" value={formatRupiah(addonTotal)} />
                  <div className="border-t border-white/10 pt-3">
                    <SummaryRow label="Total" value={formatRupiah(total)} strong />
                  </div>
                </div>
              </>
            ) : (
              <DataState
                tone={productError ? "error" : loadingProduct ? "neutral" : "empty"}
                className="border-white/10 bg-white/5 text-white"
                title={
                  productError
                    ? "Detail produk gagal dimuat"
                    : loadingProduct
                      ? "Lagi memuat detail produk"
                      : "Produk belum ketemu"
                }
                description={
                  productError
                    ? productError
                    : loadingProduct
                      ? "Mohon tunggu sebentar, data produk sedang dimuat."
                      : "Produk belum tersedia atau ID yang dibuka sudah tidak valid."
                }
              />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-300">{label}</span>
      <span className={strong ? "font-bold text-white" : "font-medium text-white"}>{value}</span>
    </div>
  );
}
