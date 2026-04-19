"use client";

import type { Product } from "@/types";
import { StayDatePicker } from "@/components/booking/stay-date-picker";
import { SlotPicker } from "@/components/booking/slot-picker";
import { daysBetween } from "@/lib/availability";
import { formatRupiah } from "@/lib/format";
import {
  EXTRA_PERSON_FEE,
  priceDokumentasi,
  priceJeep,
  priceTransport,
  priceVilla,
} from "@/lib/pricing";
import { useLang } from "@/components/i18n/lang";

type VillaProps = {
  kind: "villa";
  start?: string;
  end?: string;
  rangeAvailable?: boolean | null;
  onChangeStay: (v: { start?: string; end?: string }) => void;
  baseCapacity: number;
  extraPerson: number;
  setExtraPerson: (n: number) => void;
};

type HourBasedProps = {
  kind: "jeep" | "transport" | "dokumentasi";
  date: string;
  time: string;
  dateAvailable?: boolean | null;
  onChangeDate: (s: string) => void;
  onChangeTime: (s: string) => void;
  hours?: number;
  onChangeHours?: (n: number) => void;
};

type Common = {
  product: Product;
  onAddBooking: () => void;
  onBookNow: () => void;
};

export function ProductBookBlock(props: Common & (VillaProps | HourBasedProps)) {
  const { product, onAddBooking, onBookNow } = props;
  const { lang, t } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="card">
      {props.kind === "villa" ? (
        <div className="space-y-3">
          <div className="font-medium">
            {L("Pesan", "Book")} {t("tab_villa")}
          </div>

          {/* TANGGAL */}
          <StayDatePicker start={props.start} end={props.end} onChange={props.onChangeStay} />

          {/* GUEST TERKUNCI + EXTRA PERSON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="mb-1 text-[var(--muted)]">
                {L("Tamu (kapasitas dasar)", "Guests (base capacity)")}
              </div>
              <input
                className="input"
                value={lang === "en" ? `${props.baseCapacity} pax` : `${props.baseCapacity} orang`}
                disabled
                aria-disabled
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 text-[var(--muted)]">
                {L("Add-on: Tambahan orang", "Add-on: Extra person")} (
                {formatRupiah(EXTRA_PERSON_FEE)} {L("/ malam / orang", "/ night / person")})
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="border px-3 py-2 rounded-md"
                  onClick={() => props.setExtraPerson(Math.max(0, props.extraPerson - 1))}
                  aria-label={L("Kurangi tambahan orang", "Decrease extra person")}
                >
                  −
                </button>
                <span className="w-8 text-center">{props.extraPerson}</span>
                <button
                  type="button"
                  className="border px-3 py-2 rounded-md"
                  onClick={() => props.setExtraPerson(props.extraPerson + 1)}
                  aria-label={L("Tambah tambahan orang", "Increase extra person")}
                >
                  +
                </button>
              </div>
            </label>
          </div>

          {/* BREAKDOWN */}
          {props.start && props.end && (
            <VillaBreakdown
              pricePerNight={product.price}
              start={props.start}
              end={props.end}
              baseCapacity={props.baseCapacity}
              extraPerson={props.extraPerson}
            />
          )}

          {/* CTA */}
          {props.rangeAvailable === false && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {L("Tanggal yang dipilih sudah penuh atau belum tersedia.", "The selected dates are sold out or unavailable.")}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onAddBooking}
              disabled={props.rangeAvailable === false}
              className="btn border border-[var(--line)] bg-white"
            >
              {L("Tambah ke Booking", "Add to Booking")}
            </button>
            <button
              type="button"
              onClick={onBookNow}
              disabled={props.rangeAvailable === false}
              className="btn btn-brand"
            >
              {L("Booking Sekarang", "Book Now")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="font-medium">
            {L("Pesan", "Book")}{" "}
            {props.kind === "jeep"
              ? t("tab_jeep")
              : props.kind === "transport"
              ? "Transport"
              : t("tab_doc")}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="text-sm">
              <div className="mb-1 text-[var(--muted)]">{L("Tanggal", "Date")}</div>
              <input
                type="date"
                className="input"
                value={props.date}
                onChange={(e) => props.onChangeDate(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <div className="mb-1 text-[var(--muted)]">{L("Jam", "Time")}</div>
              <div className="input">
                <SlotPicker
                  date={props.date}
                  type={props.kind}
                  value={props.time}
                  dateAvailable={props.dateAvailable}
                  onChange={props.onChangeTime}
                />
              </div>
            </label>
          </div>

          {(props.kind === "jeep" || props.kind === "dokumentasi") && props.onChangeHours && (
            <label className="text-sm">
              <div className="mb-1 text-[var(--muted)]">{L("Durasi (jam)", "Duration (hours)")}</div>
              <select
                className="select"
                value={props.hours ?? 2}
                onChange={(e) => props.onChangeHours!(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>
                    {lang === "en" ? `${h} h` : `${h} jam`}
                  </option>
                ))}
              </select>
            </label>
          )}

          <HourBasedBreakdown kind={props.kind} unitPrice={product.price} hours={props.hours ?? 0} />

          {props.dateAvailable === false && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {L("Tanggal yang dipilih sudah penuh atau belum tersedia.", "The selected date is sold out or unavailable.")}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onAddBooking}
              disabled={props.dateAvailable === false}
              className="btn border border-[var(--line)] bg-white"
            >
              {L("Tambah ke Booking", "Add to Booking")}
            </button>
            <button
              type="button"
              onClick={onBookNow}
              disabled={props.dateAvailable === false}
              className="btn btn-brand"
            >
              {L("Booking Sekarang", "Book Now")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Breakdown components ===== */
function VillaBreakdown({
  pricePerNight,
  start,
  end,
  baseCapacity,
  extraPerson,
}: {
  pricePerNight: number;
  start: string;
  end: string;
  baseCapacity: number;
  extraPerson: number;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const nights = daysBetween(start, end);
  if (nights <= 0) return null;

  const calc = priceVilla({
    pricePerNight,
    start,
    end,
    pax: baseCapacity + extraPerson,
    baseCapacity,
  });

  return (
    <div className="text-sm border border-[var(--line)] rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span>
          {L("Harga kamar", "Room price")} ({nights} {L("malam", nights === 1 ? "night" : "nights")})
        </span>
        <span className="font-medium">{formatRupiah(pricePerNight * nights)}</span>
      </div>
      {extraPerson > 0 && (
        <div className="flex items-center justify-between mt-1">
          <span>
            {L("Tambahan orang", "Extra person")} ({extraPerson} × {nights} {L("malam", "night")}
            {" × "}
            {formatRupiah(EXTRA_PERSON_FEE)})
          </span>
          <span className="font-medium">{formatRupiah(extraPerson * nights * EXTRA_PERSON_FEE)}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--line)]">
        <span>Subtotal</span>
        <span className="font-semibold">{formatRupiah(calc.subtotal)}</span>
      </div>
      <div className="text-xs text-[var(--muted)] mt-1">
        {L("Harga sudah termasuk pajak/biaya.", "Price includes taxes/fees.")}
      </div>
    </div>
  );
}

function HourBasedBreakdown({
  kind,
  unitPrice,
  hours,
}: {
  kind: "jeep" | "transport" | "dokumentasi";
  unitPrice: number;
  hours: number;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const calc =
    kind === "jeep"
      ? priceJeep({ pricePerHour: unitPrice, hours: Math.max(1, hours) })
      : kind === "dokumentasi"
      ? priceDokumentasi({ pricePerHour: unitPrice, hours: Math.max(1, hours) })
      : priceTransport({ pricePerRoute: unitPrice });

  return (
    <div className="text-sm border border-[var(--line)] rounded-xl p-3">
      <div className="flex items-center justify-between">
        <span>
          {kind === "transport"
            ? L("Harga per rute", "Price per route")
            : L("Harga dasar", "Base price")}{" "}
          {kind === "transport" ? "" : `${Math.max(1, hours)} ${L("jam", "hours")}`}
        </span>
        <span className="font-medium">{formatRupiah(calc.subtotal)}</span>
      </div>
      <div className="text-xs text-[var(--muted)] mt-1">
        {L("Harga sudah termasuk pajak/biaya.", "Price includes taxes/fees.")}
      </div>
    </div>
  );
}
