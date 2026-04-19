"use client";

import * as React from "react";

export type DateRange = {
  from: string; // "YYYY-MM-DD"
  to: string;   // "YYYY-MM-DD"
};

export type DateRangePickerProps = {
  label?: string;

  /** Controlled utama dalam satu objek */
  value?: Partial<DateRange>;

  /** Back-compat: juga boleh prop terpisah */
  from?: string;
  to?: string;

  /** Handler terpisah (opsional) */
  onFromChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Handler gabungan (opsional). Dipanggil setiap sisi berubah. */
  onChange?: (range: Partial<DateRange>) => void;

  /** Batas opsional */
  minFrom?: string;
  maxFrom?: string;
  minTo?: string;
  maxTo?: string;

  required?: boolean;
  className?: string;
  idFrom?: string;
  idTo?: string;
};

export default function DateRangePicker({
  label = "Periode",
  value,
  from,
  to,
  onFromChange,
  onToChange,
  onChange,
  minFrom,
  maxFrom,
  minTo,
  maxTo,
  required,
  className,
  idFrom = "date-from",
  idTo = "date-to",
}: DateRangePickerProps) {
  // Sumber nilai: value.{from,to} -> props from/to -> ""
  const currFrom = (value?.from ?? from ?? "") as string;
  const currTo = (value?.to ?? to ?? "") as string;

  // "to" minimal default-nya mengikuti "from" jika minTo tidak diset
  const effectiveMinTo = minTo ?? (currFrom || undefined);

  const handleFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFromChange?.(e);
    onChange?.({ from: e.target.value, to: currTo });
  };

  const handleTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToChange?.(e);
    onChange?.({ from: currFrom, to: e.target.value });
  };

  return (
    <div className={["w-full", className || ""].join(" ")}>
      {label ? (
        <div className="mb-1 text-sm font-medium text-slate-700">
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          id={idFrom}
          type="date"
          value={currFrom}
          onChange={handleFrom}
          min={minFrom}
          max={maxFrom}
          required={required}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
          aria-label="Tanggal mulai"
        />
        <input
          id={idTo}
          type="date"
          value={currTo}
          onChange={handleTo}
          min={effectiveMinTo}
          max={maxTo}
          required={required}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
          aria-label="Tanggal selesai"
        />
      </div>
    </div>
  );
}
