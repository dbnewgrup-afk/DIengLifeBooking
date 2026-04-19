"use client";

import { useMemo, useCallback } from "react";
import { getSlotsFor, type Slot, type SlotType } from "@/lib/availability";
import { useLang } from "@/components/i18n/lang";

export function SlotPicker({
  date,
  type,
  value,
  dateAvailable,
  onChange,
}: {
  date: string;
  type: SlotType;
  value?: string;
  dateAvailable?: boolean | null;
  onChange: (t: string) => void;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const slots: Slot[] = useMemo(
    () =>
      date
        ? getSlotsFor(date, type, {
            dateAvailable: dateAvailable !== false,
          })
        : [],
    [date, dateAvailable, type]
  );

  const select = useCallback(
    (t: string) => {
      if (!t) return;
      onChange(t);
    },
    [onChange]
  );

  if (!date) return <div className="text-sm text-[var(--muted)]">{L("Pilih tanggal dulu", "Pick a date first")}</div>;
  if (dateAvailable === false) {
    return (
      <div className="text-sm text-[var(--muted)]">
        {L("Tanggal ini sudah penuh atau tidak tersedia", "This date is sold out or unavailable")}
      </div>
    );
  }
  if (!slots.length) return <div className="text-sm text-[var(--muted)]">{L("Tidak ada slot tersedia", "No slots available")}</div>;

  return (
    <div role="radiogroup" aria-label={L(`Pilih jam untuk ${type}`, `Select time for ${type}`)} className="grid grid-cols-4 gap-2">
      {slots.map((s) => {
        const selected = value === s.time;
        return (
          <button
            key={s.time}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={!s.available}
            disabled={!s.available}
            onClick={() => select(s.time)}
            className={[
              "border rounded-lg px-2 py-1 text-sm transition",
              s.available ? "hover:bg-[var(--brand-50)]" : "opacity-40 cursor-not-allowed",
              selected ? "border-[var(--brand-600)] ring-1 ring-[var(--brand-600)]" : "border-[var(--line)]",
            ].join(" ")}
          >
            {s.time}
          </button>
        );
      })}
    </div>
  );
}
