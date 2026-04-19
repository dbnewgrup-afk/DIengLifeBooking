"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import type { ProductReview, ProductReviewSummary } from "@/data/api";
import {
  daysBetween,
  isDateAvailable,
  isRangeAvailable,
  toAvailabilityMonth,
} from "@/lib/availability";
import { ProductGallery } from "./product-gallery";
import { ProductInfoSection } from "./product-info-sections";
import { ProductBookBlock } from "./product-book-block";
import { StickyBookingBar } from "./sticky-booking-bar";
import { ProductDetailTopbar } from "./product-detail-topbar";
import { useLang } from "@/components/i18n/lang";
import { useCart } from "@/store/cart";
import { useProductAvailability } from "@/hooks/use-product-availability";

/** ================== Fasilitas: fallback list ================== */
const DEFAULT_FACILITIES_ID = [
  { icon: "🍽️", label: "Restoran" },
  { icon: "🛎️", label: "Resepsionis 24 Jam" },
  { icon: "📶", label: "WiFi" },
  { icon: "🛗", label: "Lift" },
  { icon: "🅿️", label: "Parkir Gratis" },
  { icon: "🏊", label: "Kolam Renang" },
  { icon: "💆", label: "Spa & Pijat" },
  { icon: "🏋️", label: "Pusat Kebugaran" },
  { icon: "🍹", label: "Bar / Lounge" },
  { icon: "🚌", label: "Antar-jemput Bandara" },
  { icon: "👥", label: "Ruang Meeting / Banquet" },
  { icon: "❄️", label: "AC" },
  { icon: "📺", label: "TV Layar Datar" },
  { icon: "🧊", label: "Kulkas / Minibar" },
  { icon: "🧴", label: "Peralatan Mandi Lengkap" },
  { icon: "🚿", label: "Shower Air Panas/Dingin" },
  { icon: "🌅", label: "Balkon / Teras" },
  { icon: "🔐", label: "Brankas" },
] as const;

const DEFAULT_FACILITIES_EN = [
  { icon: "🍽️", label: "Restaurant" },
  { icon: "🛎️", label: "24-hour Reception" },
  { icon: "📶", label: "WiFi" },
  { icon: "🛗", label: "Elevator" },
  { icon: "🅿️", label: "Free Parking" },
  { icon: "🏊", label: "Swimming Pool" },
  { icon: "💆", label: "Spa & Massage" },
  { icon: "🏋️", label: "Gym" },
  { icon: "🍹", label: "Bar / Lounge" },
  { icon: "🚌", label: "Airport Shuttle" },
  { icon: "👥", label: "Meeting / Banquet Room" },
  { icon: "❄️", label: "Air Conditioning" },
  { icon: "📺", label: "Flat-screen TV" },
  { icon: "🧊", label: "Fridge / Minibar" },
  { icon: "🧴", label: "Toiletries" },
  { icon: "🚿", label: "Hot/Cold Shower" },
  { icon: "🌅", label: "Balcony / Terrace" },
  { icon: "🔐", label: "Safe" },
] as const;

/** Render grid fasilitas (pakai emoji biar gak nambah dependency icon) */
function FacilitiesGrid({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
      {items.map((f) => (
        <div key={f.icon + f.label} className="flex items-center gap-2">
          <span className="inline-flex w-7 h-7 items-center justify-center rounded bg-blue-50">
            <span className="text-base" aria-hidden>
              {f.icon}
            </span>
          </span>
          <span className="text-sm text-slate-700">{f.label}</span>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailClient({
  product,
  reviews,
  reviewSummary,
  initialQuery,
}: {
  product: Product;
  reviews: ProductReview[];
  reviewSummary: ProductReviewSummary;
  initialQuery?: { start?: string; end?: string; date?: string; time?: string };
}) {
  const router = useRouter();
  const { add } = useCart();
  const { lang, t } = useLang();
  const L = useCallback((id: string, en: string) => (lang === "en" ? en : id), [lang]);
  const bookingNotes = useMemo(() => {
    if (product.type === "villa") {
      return [
        L(
          "Pilih check-in dan check-out yang valid sebelum melanjutkan.",
          "Select valid check-in and check-out dates before continuing."
        ),
        L(
          "Jumlah tamu mengikuti kapasitas dasar, lalu bisa ditambah lewat extra person.",
          "Guest count starts from the base capacity and can be increased with extra person."
        ),
        L(
          "Harga total akan menyesuaikan jumlah malam dan tambahan tamu.",
          "The total price adjusts to the number of nights and any extra guests."
        ),
      ];
    }

    if (product.type === "transport") {
      return [
        L(
          "Pilih tanggal layanan dan jam penjemputan yang paling sesuai.",
          "Choose the service date and pickup time that fit your plan."
        ),
        L(
          "Transport dihitung per rute sehingga quantity mewakili jumlah layanan yang dipesan.",
          "Transport is priced per route, so quantity reflects the number of services booked."
        ),
        L(
          "Catatan tambahan bisa dipakai untuk detail titik jemput atau kebutuhan khusus.",
          "Use the notes field for pickup details or special requests."
        ),
      ];
    }

    return [
      L(
        "Pilih tanggal, jam, dan durasi layanan sebelum menambahkan ke booking.",
        "Choose the date, time, and service duration before adding to booking."
      ),
      L(
        "Total biaya otomatis menyesuaikan jumlah jam yang dipilih.",
        "The total cost updates automatically based on the selected duration."
      ),
      L(
        "Gunakan catatan tambahan jika ada kebutuhan teknis atau rundown khusus.",
        "Use the notes field if you need technical notes or a custom rundown."
      ),
    ];
  }, [L, product.type]);
  const policyRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];

    if (product.policy?.checkin) {
      rows.push({
        label: L("Check-in", "Check-in"),
        value: product.policy.checkin,
      });
    }

    if (product.policy?.checkout) {
      rows.push({
        label: L("Check-out", "Check-out"),
        value: product.policy.checkout,
      });
    }

    rows.push({
      label: L("Harga", "Pricing"),
      value:
        product.policy?.taxInclusive === false
          ? L(
              "Belum termasuk biaya tambahan yang relevan.",
              "Additional applicable fees are not included."
            )
          : L(
              "Sudah termasuk komponen biaya utama.",
              "The main pricing components are already included."
            ),
    });

    if (typeof product.policy?.refundDeduction === "number") {
      rows.push({
        label: L("Pembatalan", "Cancellation"),
        value: L(
          `Potongan refund ${Math.round(product.policy.refundDeduction * 100)}%.`,
          `Refund deduction ${Math.round(product.policy.refundDeduction * 100)}%.`
        ),
      });
    }

    return rows;
  }, [L, product.policy]);
  const stickyPriceSuffix =
    product.type === "villa"
      ? L("/ malam", "/ night")
      : product.type === "transport"
        ? L("/ rute", "/ route")
        : L("/ jam", "/ hour");

  // Gallery pakai gambar dari product
  const gallery = product.images && product.images.length > 0 ? product.images : undefined;

  // VILLA state
  const [stay, setStay] = useState<{ start?: string; end?: string }>({
    start: initialQuery?.start,
    end: initialQuery?.end,
  });
  const baseCapacity = product.type === "villa" ? product.baseCapacity ?? 2 : 0;
  const [extraPerson, setExtraPerson] = useState(0);

  // Hour-based state
  const [date, setDate] = useState(initialQuery?.date ?? "");
  const [time, setTime] = useState(initialQuery?.time ?? "");
  const [hours, setHours] = useState(2);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );
  const availabilityMonths = useMemo(() => {
    if (product.type === "villa") {
      return [
        toAvailabilityMonth(stay.start),
        toAvailabilityMonth(stay.end),
      ];
    }

    return [toAvailabilityMonth(date)];
  }, [date, product.type, stay.end, stay.start]);
  const availability = useProductAvailability(product.id, availabilityMonths);
  const selectedDateAvailable = useMemo(
    () => (availability.loading ? null : isDateAvailable(date, availability.byDate)),
    [availability.byDate, availability.loading, date]
  );
  const selectedRangeAvailable = useMemo(
    () =>
      availability.loading ? null : isRangeAvailable(stay.start, stay.end, availability.byDate),
    [availability.byDate, availability.loading, stay.end, stay.start]
  );

  // Summary sticky bar
  const _summary = useMemo(() => {
    if (product.type === "villa") {
      if (!(stay.start && stay.end)) return L("Pilih tanggal menginap", "Select stay dates");
      const nights = daysBetween(stay.start, stay.end);
      return `${nights} ${L("malam", nights === 1 ? "night" : "nights")} · +${extraPerson} ${L(
        "extra",
        "extra"
      )}`;
    }
    if (!(date && time)) return L("Pilih tanggal & jam", "Select date & time");
    if (product.type === "transport") return `${date} · ${time}`;
    return `${date} · ${time} · ${hours} ${L("jam", "hours")}`;
  }, [L, product.type, stay, date, time, hours, extraPerson]);

  const _canAdd = useMemo(() => {
    if (product.type === "villa") {
      return Boolean(
        stay.start &&
          stay.end &&
          daysBetween(stay.start, stay.end) > 0 &&
          selectedRangeAvailable !== false
      );
    }
    return Boolean(date && time && selectedDateAvailable !== false);
  }, [date, product.type, selectedDateAvailable, selectedRangeAvailable, stay, time]);

  void _summary;
  void _canAdd;

  // CTA
  function addBooking() {
    const sharedMeta = {
      productId: product.id,
      name: product.name,
      image: product.images?.[0],
      categoryLabel: title,
    };

    if (product.type === "villa") {
      if (!stay.start || !stay.end) {
        setFeedback({
          tone: "error",
          message: L("Pilih tanggal menginap terlebih dahulu.", "Select stay dates first."),
        });
        return false;
      }
      const nights = daysBetween(stay.start, stay.end);
      if (nights <= 0) {
        setFeedback({
          tone: "error",
          message: L("Rentang tanggal minimal 1 malam.", "Minimum 1 night stay."),
        });
        return false;
      }
      if (selectedRangeAvailable === false) {
        setFeedback({
          tone: "error",
          message: L(
            "Tanggal yang dipilih sudah penuh atau belum tersedia.",
            "The selected dates are sold out or unavailable."
          ),
        });
        return false;
      }
      add({
        ...sharedMeta,
        kind: "villa",
        pricePerNight: product.price,
        start: stay.start,
        end: stay.end,
        pax: baseCapacity + extraPerson,
        baseCapacity,
      });
      setFeedback({
        tone: "success",
        message: L("Produk berhasil ditambahkan ke booking.", "Product added to booking."),
      });
      return true;
    }

    if (!date || !time) {
      setFeedback({
        tone: "error",
        message: L("Pilih tanggal dan jam terlebih dahulu.", "Select date and time first."),
      });
      return false;
    }

    if (selectedDateAvailable === false) {
      setFeedback({
        tone: "error",
        message: L(
          "Tanggal yang dipilih sudah penuh atau belum tersedia.",
          "The selected date is sold out or unavailable."
        ),
      });
      return false;
    }

    if (product.type === "transport") {
      add({
        ...sharedMeta,
        kind: "transport",
        pricePerRoute: product.price,
        date,
        time,
      });
    } else {
      add({
        ...sharedMeta,
        kind: product.type,
        pricePerHour: product.price,
        date,
        time,
        hours,
      });
    }
    setFeedback({
      tone: "success",
      message: L("Produk berhasil ditambahkan ke booking.", "Product added to booking."),
    });
    return true;
  }

  function bookNow() {
    const added = addBooking();
    if (added) router.push("/cart");
  }

  // scroll ke blok booking dari tombol “select product”
  const bookRef = useRef<HTMLDivElement | null>(null);
  const scrollToBook = () => bookRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // judul kategori
  const title = useMemo(() => {
    switch (product.type) {
      case "villa":
        return t("tab_villa");
      case "jeep":
        return t("tab_jeep");
      case "transport":
        return "Transport";
      case "dokumentasi":
        return t("tab_doc");
    }
  }, [product.type, t]);

  /** Ambil fasilitas dari product jika ada; kalau kosong pakai fallback */
  const facilities: { icon: string; label: string }[] = useMemo(() => {
    const raw = product.amenities;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((label) => ({ icon: "🔹", label }));
    }
    return [...(lang === "en" ? DEFAULT_FACILITIES_EN : DEFAULT_FACILITIES_ID)];
  }, [product.amenities, lang]);

  return (
    <>
      <ProductDetailTopbar
        type={product.type}
        baseCapacity={product.baseCapacity ?? 2}
        initial={{
          q: product.location,
          start: stay.start,
          end: stay.end,
          date,
          time,
          hours,
        }}
      />

      <div className="container-page py-6">
        <h1 className="text-xl font-semibold mb-3">{title}</h1>

        {feedback ? (
          <div
            className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="status"
            aria-live="polite"
          >
            {feedback.message}
          </div>
        ) : null}

        {/* OVERVIEW */}
        <section id="overview" className="grid grid-cols-1 md:grid-cols-[1.25fr_1fr] gap-6 scroll-mt-28">
          <ProductGallery images={gallery} />

          <div className="space-y-4">
            <ProductInfoSection product={product} />

            <div ref={bookRef}>
              {product.type === "villa" ? (
                <ProductBookBlock
                  product={product}
                  kind="villa"
                  start={stay.start}
                  end={stay.end}
                  rangeAvailable={selectedRangeAvailable}
                  onChangeStay={setStay}
                  baseCapacity={baseCapacity}
                  extraPerson={extraPerson}
                  setExtraPerson={setExtraPerson}
                  onAddBooking={addBooking}
                  onBookNow={bookNow}
                />
              ) : (
                <ProductBookBlock
                  product={product}
                  kind={product.type}
                  date={date}
                  time={time}
                  dateAvailable={selectedDateAvailable}
                  onChangeDate={setDate}
                  onChangeTime={setTime}
                  hours={product.type === "transport" ? undefined : hours}
                  onChangeHours={product.type === "transport" ? undefined : setHours}
                  onAddBooking={addBooking}
                  onBookNow={bookNow}
                />
              )}
            </div>
          </div>
        </section>

        {/* FASILITAS UTAMA */}
        <section id="facilities" className="mt-8 rounded-2xl border border-slate-200 bg-white/70 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">{L("Fasilitas Utama", "Main Facilities")}</h2>
            <Link href="/policy/terms" className="text-sm text-blue-600 hover:underline">
              {L("Selengkapnya", "Learn more")}
            </Link>
          </div>
          <FacilitiesGrid items={facilities} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              {L("Tentang Produk", "About This Product")}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {product.description?.trim() ||
                L(
                  "Detail produk ini sudah siap untuk masuk ke flow booking. Kamu bisa pilih jadwal, cek ringkasan harga, lalu lanjut ke checkout.",
                  "This product is already connected to the booking flow. You can select a schedule, review the pricing summary, and continue to checkout."
                )}
            </p>
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm text-slate-600">
              <div className="font-medium text-slate-900">{L("Lokasi", "Location")}</div>
              <div className="mt-1">{product.location || L("Belum dicantumkan", "Not specified yet")}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <h2 className="text-base font-semibold text-slate-900">
              {L("Yang Perlu Diketahui", "What To Know")}
            </h2>
            <div className="mt-3 space-y-3">
              {bookingNotes.map((note) => (
                <div key={note} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm leading-7 text-slate-600">
                  {note}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              {L("Kebijakan Ringkas", "Quick Policy")}
            </h2>
            <Link href="/policy/terms" className="text-sm font-medium text-blue-600 hover:underline">
              {L("Baca kebijakan booking", "Read booking policy")}
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {policyRows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {row.label}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-700">{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="reviews" className="mt-8 rounded-2xl border border-slate-200 bg-white/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {L("Review Booking Tervalidasi", "Verified Booking Reviews")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {reviewSummary.totalReviews > 0
                  ? L(
                      `${reviewSummary.totalReviews} review tampil setelah booking selesai dan lolos moderasi.`,
                      `${reviewSummary.totalReviews} reviews are shown after completed stays and moderation.`
                    )
                  : L(
                      "Belum ada review yang tampil untuk produk ini.",
                      "No moderated reviews are visible for this product yet."
                    )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {L("Rata-rata rating", "Average rating")}
              </div>
              <div className="mt-1 text-2xl font-black text-slate-950">
                {reviewSummary.totalReviews > 0 ? reviewSummary.averageRating.toFixed(1) : "-"}
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
              {L(
                "Review akan muncul di sini setelah buyer menyelesaikan booking dan admin memoderasinya.",
                "Reviews will appear here after buyers complete their booking and admins moderate them."
              )}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{review.authorName}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {review.stayStart} - {review.stayEnd}
                      </div>
                    </div>
                    <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {review.rating}/5
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <StickyBookingBar
        title={product.name}
        nightlyPrice={product.price}
        productId={product.id}
        ctaLabel={L("Pilih jadwal", "Select schedule")}
        onBookNow={scrollToBook}
        priceSuffix={stickyPriceSuffix}
      />
    </>
  );
}
