"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import { id as localeID, enUS as localeEN } from "date-fns/locale";
import { useLang } from "@/components/i18n/lang";

/** Parse aman YYYY-MM-DD → Date (tanpa risiko geser hari) */
function parseYMD(ymd?: string): Date | undefined {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return undefined;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
/** Date → "YYYY-MM-DD" */
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function StayDatePicker({
  start,
  end,
  onChange,
}: {
  start?: string;
  end?: string;
  onChange: (range: { start?: string; end?: string }) => void;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);
  const locale = lang === "en" ? localeEN : localeID;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = parseYMD(start);
    const to = parseYMD(end);
    return from || to ? { from, to } : undefined;
  });

  // propagate ke parent tiap berubah
  useEffect(() => {
    onChange({
      start: range?.from ? toYMD(range.from) : undefined,
      end: range?.to ? toYMD(range.to) : undefined,
    });
  }, [range, onChange]);

  // tutup popover setelah pilih lengkap
  useEffect(() => {
    if (range?.from && range?.to) {
      setOpen(false);
      // kembalikan fokus ke tombol
      triggerRef.current?.focus();
    }
  }, [range]);

  // klik di luar / ESC untuk menutup
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label =
    range?.from && range?.to
      ? `${format(range.from, "d MMM yyyy", { locale })} - ${format(range.to, "d MMM yyyy", { locale })}`
      : L("Pilih tanggal menginap", "Select stay dates");

  return (
    <div className="relative">
      {/* trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input flex items-center justify-between"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="stay-date-panel"
      >
        <span className={range?.from && range?.to ? "" : "text-[var(--muted)]"}>{label}</span>
        <span aria-hidden="true">📅</span>
      </button>

      {/* panel kalender */}
      {open && (
        <div
          id="stay-date-panel"
          ref={panelRef}
          className="absolute z-50 mt-2 w-[min(92vw,720px)] rounded-2xl border border-[var(--line)] bg-white shadow-lg"
          role="dialog"
        >
          <div className="px-4 pt-3 pb-1 border-b border-[var(--line)]">
            <div className="text-sm font-medium">{L("Tanggal Menginap", "Stay Date")}</div>
            <div className="text-xs text-[var(--muted)]">
              {range?.from
                ? `${L("Check-In", "Check-In")}: ${format(range.from, "EEE, d MMM yyyy", { locale })}`
                : `${L("Check-In", "Check-In")}: -`}{" "}
              ·{" "}
              {range?.to
                ? `${L("Check-Out", "Check-Out")}: ${format(range.to, "EEE, d MMM yyyy", { locale })}`
                : `${L("Check-Out", "Check-Out")}: -`}
            </div>
          </div>

          <div className="p-3 md:p-4">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              numberOfMonths={2}
              pagedNavigation
              captionLayout="label"
              locale={locale}
              fromMonth={today}
              disabled={{ before: today }}
              showOutsideDays
              className="rdp-root"
              classNames={{
                months: "flex gap-6",
                month: "space-y-2",
                caption: "flex items-center justify-between px-1",
                caption_label: "font-semibold",
                nav: "flex items-center gap-2",
                nav_button: "border rounded-md px-2 py-1 text-sm hover:bg-[var(--brand-50)]",
                nav_button_previous: "",
                nav_button_next: "",
                weekdays: "grid grid-cols-7 text-xs text-[var(--muted)]",
                week: "grid grid-cols-7",
                day: "h-9 w-9 rounded-md text-sm grid place-items-center hover:bg-[var(--brand-50)]",
                day_selected: "bg-[var(--brand-600)] text-white hover:bg-[var(--brand-600)]",
                day_range_start: "rounded-l-full",
                day_range_end: "rounded-r-full",
                day_range_middle: "bg-[var(--brand-50)]",
                day_today: "border border-[var(--brand-600)]",
                day_disabled: "opacity-40 cursor-not-allowed",
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--line)]">
            <button type="button" className="text-sm underline" onClick={() => setRange(undefined)}>
              {L("Reset", "Reset")}
            </button>
            <button
              type="button"
              className="btn btn-brand"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            >
              {L("Selesai", "Done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
