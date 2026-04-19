"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductType } from "@/types";
import { getSlotsFor, type Slot } from "@/lib/availability";
import { useLang } from "@/components/i18n/lang";

type Initial = {
  q?: string;
  start?: string;  // villa
  end?: string;    // villa
  date?: string;   // hour-based
  time?: string;   // hour-based
  hours?: number;  // jeep / dokumentasi
};

export function ProductDetailTopbar({
  type,
  baseCapacity = 2,
  initial,
}: {
  type: ProductType;
  baseCapacity?: number;
  initial?: Initial;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const [visible, setVisible] = useState(false);

  // —— state form (berbeda per tipe)
  const [q, setQ] = useState(initial?.q ?? "");
  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");

  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [hours, setHours] = useState<number>(initial?.hours ?? 2);

  // Slot list (untuk hour-based; transport tak punya "hours")
  const slots = useMemo<Slot[]>(() => {
    if (!date) return [];
    if (type === "villa") return [];
    // Di branch else ini, type otomatis ternarrow ke "jeep" | "transport" | "dokumentasi"
    return getSlotsFor(date, type);
  }, [date, type]);

  // tampil saat melewati hero/galeri
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 140);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const router = useRouter();

  function onSearch() {
    const params = new URLSearchParams({ type });
    if (q) params.set("q", q);

    if (type === "villa") {
      if (start) params.set("start", start);
      if (end) params.set("end", end);
    } else if (type === "transport") {
      if (date) params.set("date", date);
      if (time) params.set("time", time);
    } else {
      // jeep / dokumentasi
      if (date) params.set("date", date);
      if (time) params.set("time", time);
      if (hours) params.set("hours", String(hours));
    }

    router.push(`/catalog?${params.toString()}`);
  }

  function go(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="container-page py-3 space-y-3">
        {/* BAR PENCARIAN (dinamis per tipe) */}
        {type === "villa" ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2">
            <label className="input flex items-center gap-2">
              <span aria-hidden>📍</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder={L("Kota atau dekat saya", "City or near me")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={L("Lokasi", "Location")}
              />
            </label>
            <label className="input flex items-center gap-2">
              <span aria-hidden>⬅</span>
              <input
                type="date"
                className="w-full bg-transparent text-sm outline-none"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                aria-label={L("Check-in", "Check-in")}
              />
            </label>
            <label className="input flex items-center gap-2">
              <span aria-hidden>➡</span>
              <input
                type="date"
                className="w-full bg-transparent text-sm outline-none"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                aria-label={L("Check-out", "Check-out")}
              />
            </label>
            <button
              className="btn btn-search text-white text-base"
              onClick={onSearch}
              disabled={!start || !end}
              title={!start || !end ? L("Pilih tanggal check-in & check-out", "Choose check-in & check-out") : ""}
            >
              {L("Cari", "Search")} 🔎
            </button>
          </div>
        ) : type === "transport" ? (
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2">
            <label className="input flex items-center gap-2">
              <span aria-hidden>📍</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder={L("Kota atau dekat saya", "City or near me")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={L("Lokasi", "Location")}
              />
            </label>
            <label className="input flex items-center gap-2">
              <span aria-hidden>📅</span>
              <input
                type="date"
                className="w-full bg-transparent text-sm outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label={L("Tanggal", "Date")}
              />
            </label>
            <label className="input flex items-center gap-2">
              <span aria-hidden>🕘</span>
              <select
                className="w-full bg-transparent text-sm outline-none"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label={L("Jam", "Time")}
              >
                <option value="">{L("Pilih jam", "Select time")}</option>
                {slots.map((s) => (
                  <option key={s.time} value={s.time} disabled={!s.available}>
                    {s.time}
                    {!s.available ? ` — ${L("penuh", "full")}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn btn-search text-white text-base"
              onClick={onSearch}
              disabled={!date || !time}
              title={!date || !time ? L("Pilih tanggal & jam", "Choose date & time") : ""}
            >
              {L("Cari", "Search")} 🔎
            </button>
          </div>
        ) : (
          // jeep & dokumentasi
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2">
            <label className="input flex items-center gap-2">
              <span aria-hidden>📍</span>
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder={L("Kota atau dekat saya", "City or near me")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label={L("Lokasi", "Location")}
              />
            </label>

            <label className="input flex items-center gap-2">
              <span aria-hidden>📅</span>
              <input
                type="date"
                className="w-full bg-transparent text-sm outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label={L("Tanggal", "Date")}
              />
            </label>

            <label className="input flex items-center gap-2">
              <span aria-hidden>🕘</span>
              <select
                className="w-full bg-transparent text-sm outline-none"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                aria-label={L("Jam", "Time")}
              >
                <option value="">{L("Pilih jam", "Select time")}</option>
                {slots.map((s) => (
                  <option key={s.time} value={s.time} disabled={!s.available}>
                    {s.time}
                    {!s.available ? ` — ${L("penuh", "full")}` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="input flex items-center gap-2">
              <span aria-hidden>⏱</span>
              <select
                className="w-full bg-transparent text-sm outline-none"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                aria-label={L("Durasi (jam)", "Duration (hours)")}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                  <option key={h} value={h}>
                    {h} {L("jam", "hour")}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="btn btn-search text-white text-base"
              onClick={onSearch}
              disabled={!date || !time}
              title={!date || !time ? L("Pilih tanggal & jam", "Choose date & time") : ""}
            >
              {L("Cari", "Search")} 🔎
            </button>
          </div>
        )}

        {/* Chips navigasi section + info ringkas */}
        <div className="flex items-center gap-2">
          <button className="pill" onClick={() => go("overview")}>
            {L("Overview", "Overview")}
          </button>
          <button className="pill" onClick={() => go("location")}>
            {L("Lokasi", "Location")}
          </button>
          <button className="pill" onClick={() => go("facilities")}>
            {L("Fasilitas", "Facilities")}
          </button>
          <button className="pill" onClick={() => go("policy")}>
            {L("Kebijakan", "Policy")}
          </button>
          <button className="pill" onClick={() => go("reviews")}>
            {L("Ulasan", "Reviews")}
          </button>

          {type === "villa" && (
            <span className="ml-3 text-xs text-[var(--muted)]">
              {L("Kapasitas dasar", "Base capacity")}: {baseCapacity} {L("tamu", "guests")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
