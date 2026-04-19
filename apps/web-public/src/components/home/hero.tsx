"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/i18n/lang";
import type { HomepageHeroContent } from "@/lib/homepage-cms";

/* =========================
   i18n helpers
========================= */
const MONTH_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agt","Sep","Okt","Nov","Des"];
const MONTH_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WD_ID = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
const WD_EN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = (iso: string) => new Date(iso + "T00:00:00");
const isBefore = (a: string, b: string) => parseISO(a).getTime() < parseISO(b).getTime();
const isSame = (a?: string, b?: string) => !!a && !!b && parseISO(a).getTime() === parseISO(b).getTime();
const todayISO = fmtISO(new Date());

const addMonths = (iso: string, m: number) => {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + m);
  return fmtISO(d);
};
function monthStartISO(isoRef?: string) {
  const d = isoRef ? parseISO(isoRef) : new Date();
  d.setDate(1);
  return fmtISO(d);
}
function daysInMonth(iso: string) {
  const d = parseISO(iso);
  const y = d.getFullYear(), m = d.getMonth();
  return new Date(y, m + 1, 0).getDate();
}
function dayOfWeek1(iso: string) {
  const d = parseISO(iso);
  return (d.getDay() + 6) % 7; // Monday-first
}
function rangeContains(iso: string, start?: string, end?: string) {
  if (!start || !end) return false;
  const t = parseISO(iso).getTime();
  return parseISO(start).getTime() < t && t < parseISO(end).getTime();
}

/* =========================
   Types
========================= */
type Tab = "villa" | "jeep" | "transport" | "dokumentasi";

/* =========================
   Component
========================= */
export default function Hero({
  content,
}: {
  content: HomepageHeroContent;
}) {
  const router = useRouter();
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  // bikin navbar kontras saat hero terlihat
  useEffect(() => {
    document.body.classList.add("is-hero");
    return () => document.body.classList.remove("is-hero");
  }, []);

  const [tab, setTab] = useState<Tab>("villa");
  const [where, setWhere] = useState("");
  const [stay, setStay] = useState<{ start?: string; end?: string }>({});
  const [dewasa, setDewasa] = useState(2);
  const [anak, setAnak] = useState(0);
  const [kamar, setKamar] = useState(1);

  // Guest dropdown
  const [guestOpen, setGuestOpen] = useState(false);
  const guestRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!guestOpen) return;
    const click = (e: MouseEvent) => {
      if (!guestRef.current) return;
      if (!guestRef.current.contains(e.target as Node)) setGuestOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setGuestOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [guestOpen]);

  // Hour selection (selain villa)
  const [hourDate, setHourDate] = useState("");
  const [slot, setSlot] = useState("");
  const [slotOpen, setSlotOpen] = useState(false);
  const slotRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hourDate) { setSlot(""); setSlotOpen(false); }
  }, [hourDate]);

  // Range Picker
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeRef = useRef<HTMLDivElement | null>(null);
  const [calBase, setCalBase] = useState(monthStartISO()); // bulan kiri
  useEffect(() => {
    if (!rangeOpen) return;
    const click = (e: MouseEvent) => {
      if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) setRangeOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setRangeOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", click);
      document.removeEventListener("keydown", key);
    };
  }, [rangeOpen]);

  const readyVilla = Boolean(stay.start && stay.end);
  const readyHour = Boolean(hourDate && slot);

  const tabs = useMemo(
    () => [
      { key: "villa",       label: "Villa",       icon: "🏡" },
      { key: "jeep",        label: "Jeep",        icon: "🚙" },
      { key: "transport",   label: L("Rent","Rent"), icon: "🚗" },
      { key: "dokumentasi", label: L("Dokumentasi","Photography"), icon: "📸" },
    ] as const,
    [lang]
  );

  const timeSlots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h <= 20; h++) {
      for (const m of [0, 30]) out.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    }
    return out;
  }, []);

  const search = useCallback(() => {
    if (tab === "villa") {
      const q = new URLSearchParams({ type: "villa" });
      if (stay.start) q.set("start", stay.start);
      if (stay.end) q.set("end", stay.end);
      if (where) q.set("q", where);
      q.set("dewasa", String(dewasa));
      q.set("anak", String(anak));
      q.set("kamar", String(kamar));
      router.push(`/catalog?${q.toString()}`);
      return;
    }
    const q = new URLSearchParams({ type: tab, date: hourDate, time: slot });
    if (where) q.set("q", where);
    router.push(`/catalog?${q.toString()}`);
  }, [tab, stay.start, stay.end, where, dewasa, anak, kamar, hourDate, slot, router]);

  const onKeySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if ((tab === "villa" && readyVilla) || (tab !== "villa" && readyHour)) search();
    }
  };

  const guestSummary =
    lang === "en"
      ? `${dewasa} Adults, ${anak} Children, ${kamar} Room${kamar > 1 ? "s" : ""}`
      : `${dewasa} Dewasa, ${anak} Anak, ${kamar} Kamar`;

  const fmtHuman = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const mm = lang === "en" ? MONTH_EN[d.getMonth()] : MONTH_ID[d.getMonth()];
    return `${pad2(d.getDate())} ${mm} ${d.getFullYear()}`;
  };
  const dateSummary =
    stay.start && stay.end
      ? `${fmtHuman(stay.start)} - ${fmtHuman(stay.end)}`
      : lang === "en" ? "mm/dd/yyyy" : "mm/dd/yyyy";

  return (
    <section
      className="-mt-[calc(var(--nav-sm)+var(--nav-sub))] md:-mt-[calc(var(--nav-md)+var(--nav-sub))]"
      style={{
        // overlay gradient + image background
        backgroundImage:
          "linear-gradient(180deg, rgba(3,25,36,0.55) 0%, rgba(2,47,64,0.65) 35%, rgba(2,47,64,0.85) 100%), url('/images/slider.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="container-page pt-32 md:pt-40 pb-12 text-center">
        <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/85">
          {content.eyebrow}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow">
          {content.title}
        </h1>
        <p className="mt-4 text-white/85">
          {content.description}
        </p>

        {/* Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label={L("Kategori","Categories")}>
            {tabs.map((x) => {
              const isActive = tab === (x.key as Tab);
              return (
                <button
                  key={x.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(x.key as Tab)}
                  className={`px-6 md:px-7 py-3 md:py-3.5 rounded-xl text-lg md:text-xl font-bold transition
                    ${isActive ? "bg-white/20 text-white backdrop-blur border border-white/40 shadow-md"
                               : "text-white/80 hover:bg-white/10"}`}
                >
                  <span aria-hidden className="mr-2">{x.icon}</span>
                  {x.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search dock */}
        <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-3 shadow-lg" role="search">
          {tab === "villa" ? (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                {/* Tujuan */}
                <label className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition" aria-label={L("Tujuan","Destination")}>
                  <span aria-hidden>📍</span>
                  <input
                    className="w-full bg-transparent outline-none placeholder:text-white/70"
                    placeholder={L("Kota, tujuan, atau nama tempat", "City, destination, or place name")}
                    value={where}
                    onChange={(e) => setWhere(e.target.value)}
                    onKeyDown={onKeySubmit}
                  />
                </label>

                {/* Date Range */}
                <DateRangeButton
                  lang={lang}
                  open={rangeOpen}
                  setOpen={setRangeOpen}
                  calBase={calBase}
                  setCalBase={setCalBase}
                  stay={stay}
                  setStay={setStay}
                />

                {/* Guest & Rooms */}
                <div className="relative" ref={guestRef}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition"
                    onClick={() => setGuestOpen((o) => !o)}
                  >
                    <span>{guestSummary}</span>
                    <span aria-hidden>👥</span>
                  </button>
                  {guestOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-xl border bg-white shadow-2xl p-5 z-20 text-left">
                      <Row label={L("Dewasa","Adults")} value={dewasa} setValue={setDewasa} min={1} />
                      <Row label={L("Anak","Children")} value={anak} setValue={setAnak} min={0} />
                      <Row label={L("Kamar","Rooms")} value={kamar} setValue={setKamar} min={1} />
                      <div className="mt-4 text-right">
                        <button
                          onClick={() => setGuestOpen(false)}
                          className="px-5 py-2 rounded-lg bg-[var(--brand-500)] text-white text-sm font-semibold hover:bg-[var(--brand-600)]"
                        >
                          {L("Selesai","Done")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol search */}
                <button
                  type="button"
                  onClick={search}
                  className="flex items-center justify-center w-14 h-14 md:w-14 md:h-14 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-md disabled:opacity-60"
                  disabled={!readyVilla}
                  title={!readyVilla ? L("Pilih check-in & check-out","Pick check-in & check-out") : L("Cari","Search")}
                  aria-label={L("Cari","Search")}
                >
                  🔍
                </button>
              </div>

              <div className="mt-2 grid grid-cols-1 px-1 text-xs text-white/80 md:grid-cols-3">
                <div>&nbsp;</div>
                <div className="text-center">{L("Check-in & Check-out","Check-in & Check-out")}</div>
                <div className="text-right">{L("Tamu & Kamar","Guests & Rooms")}</div>
              </div>
            </>
          ) : (
            <div className="relative grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <label className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition" aria-label={L("Tujuan","Destination")}>
                <span aria-hidden>📍</span>
                <input
                  className="w-full bg-transparent outline-none placeholder:text-white/70"
                  placeholder={L("Kota, tujuan, atau nama tempat","City, destination, or place name")}
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  onKeyDown={onKeySubmit}
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition" aria-label={L("Tanggal","Date")}>
                <span aria-hidden>📅</span>
                <input
                  type="date"
                  className="w-full bg-transparent outline-none [color-scheme:light]"
                  value={hourDate}
                  onChange={(e) => setHourDate(e.target.value)}
                  onKeyDown={onKeySubmit}
                />
              </label>

              <TimeSlotButton
                disabled={!hourDate}
                slot={slot}
                setSlot={setSlot}
                open={slotOpen}
                setOpen={setSlotOpen}
                timeSlots={timeSlots}
                titleWhenDisabled={L("Pilih tanggal dulu","Pick a date first")}
              />

              <button
                type="button"
                onClick={search}
                className="flex items-center justify-center w-14 h-14 md:w-14 md:h-14 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-md disabled:opacity-60"
                disabled={!readyHour}
                title={!readyHour ? L("Pilih tanggal & jam","Pick date & time") : L("Cari","Search")}
                aria-label={L("Cari","Search")}
              >
                🔍
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================
   Subcomponents
========================= */
function Row({
  label, value, setValue, min,
}: { label: string; value: number; setValue: (n: number) => void; min: number }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[var(--text)]">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => setValue(Math.max(min, value - 1))} className="w-8 h-8 rounded-full border flex items-center justify-center text-lg">−</button>
        <span className="w-6 text-center">{value}</span>
        <button onClick={() => setValue(value + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center text-lg">+</button>
      </div>
    </div>
  );
}

function DateRangeButton(props: {
  lang: "id" | "en";
  open: boolean; setOpen: (v: boolean) => void;
  calBase: string; setCalBase: (v: string) => void;
  stay: { start?: string; end?: string };
  setStay: (v: { start?: string; end?: string }) => void;
}) {
  const { lang, open, setOpen, calBase, setCalBase, stay, setStay } = props;
  const L = (id: string, en: string) => (lang === "en" ? en : id);
  const rangeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (rangeRef.current && !rangeRef.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", key); };
  }, [open, setOpen]);

  const fmtHuman = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const mm = lang === "en" ? MONTH_EN[d.getMonth()] : MONTH_ID[d.getMonth()];
    return `${pad2(d.getDate())} ${mm} ${d.getFullYear()}`;
  };
  const label = stay.start && stay.end ? `${fmtHuman(stay.start)} - ${fmtHuman(stay.end)}` : lang === "en" ? "mm/dd/yyyy" : "mm/dd/yyyy";

  return (
    <div className="relative" ref={rangeRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={stay.start && stay.end ? "" : "text-white/70"}>{label}</span>
        <span aria-hidden>📅</span>
      </button>

      {open && (
        <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-[680px] max-w-[92vw] rounded-xl border bg-white shadow-xl p-4 z-30 text-left">
          <header className="mb-3">
            <h3 className="font-semibold text-[var(--text)]">{L("Tanggal Menginap","Stay Dates")}</h3>
            <p className="text-sm text-[var(--muted)]">
              {stay.start ? L(`Check-In: ${fmtHuman(stay.start)}`, `Check-In: ${fmtHuman(stay.start)}`) : L("Pilih Check-In","Pick Check-In")}
              {"  •  "}
              {stay.end ? L(`Check-Out: ${fmtHuman(stay.end)}`, `Check-Out: ${fmtHuman(stay.end)}`) : L("Pilih Check-Out","Pick Check-Out")}
            </p>
          </header>

          <div className="flex items-center justify-between mb-2">
            <button className="px-2 py-1 rounded border bg-white" onClick={() => setCalBase(addMonths(calBase, -1))}>‹</button>
            <div className="text-[var(--muted)] text-sm">
              {L("Min","Min")} {fmtHuman(todayISO)}
            </div>
            <button className="px-2 py-1 rounded border bg-white" onClick={() => setCalBase(addMonths(calBase, +1))}>›</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MonthGrid lang={lang} monthISO={calBase} start={stay.start} end={stay.end} onPick={(iso) => pickDate(iso, stay, setStay)} />
            <MonthGrid lang={lang} monthISO={addMonths(calBase, 1)} start={stay.start} end={stay.end} onPick={(iso) => pickDate(iso, stay, setStay)} />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button className="px-3 py-2 rounded-md border bg-white text-sm" onClick={() => setStay({})}>
              {L("Reset","Reset")}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-[var(--brand-500)] text-white text-sm hover:bg-[var(--brand-600)]"
              onClick={() => setOpen(false)}
              disabled={!(stay.start && stay.end)}
            >
              {L("Selesai","Done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeSlotButton(props: {
  disabled: boolean;
  slot: string; setSlot: (v: string) => void;
  open: boolean; setOpen: (v: boolean) => void;
  timeSlots: string[];
  titleWhenDisabled: string;
}) {
  const { disabled, slot, setSlot, open, setOpen, timeSlots, titleWhenDisabled } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [open, setOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-xl bg-white/20 px-4 py-3 text-base text-white backdrop-blur hover:bg-white/25 transition"
        onClick={() => setOpen(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        title={disabled ? titleWhenDisabled : ""}
      >
        <span className={slot ? "" : "text-white/70"}>{slot ? `Jam: ${slot}` : "Pilih jam"}</span>
        <span aria-hidden>🕘</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg p-2 z-20">
          <div className="max-h-60 overflow-auto text-sm">
            {timeSlots.map((t) => (
              <button
                key={t}
                onClick={() => { setSlot(t); setOpen(false); }}
                className={`w-full text-left px-2 py-1 rounded hover:bg-[var(--bg)] ${t === slot ? "bg-[var(--brand-50)]" : ""}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  lang,
  monthISO, start, end, onPick,
}: { lang: "id" | "en"; monthISO: string; start?: string; end?: string; onPick: (iso: string) => void; }) {
  const d = parseISO(monthISO);
  const y = d.getFullYear();
  const m = d.getMonth();
  const label = `${(lang === "en" ? MONTH_EN : MONTH_ID)[m]} ${y}`;
  const first = monthStartISO(monthISO);
  const firstPad = dayOfWeek1(first);
  const n = daysInMonth(first);

  const cells: Array<{ iso: string; disabled: boolean; day: number }> = [];
  for (let i = 0; i < firstPad; i++) cells.push({ iso: "", disabled: true, day: 0 });
  for (let day = 1; day <= n; day++) {
    const iso = fmtISO(new Date(y, m, day));
    cells.push({ iso, disabled: isBefore(iso, todayISO), day });
  }

  const wds = lang === "en" ? WD_EN : WD_ID;

  return (
    <div className="rounded-lg border">
      <div className="px-3 py-2 font-medium text-[var(--text)] border-b">{label}</div>
      <div className="grid grid-cols-7 text-xs text-[var(--muted)] px-2 pt-2 pb-1">
        {wds.map((d2) => <div key={d2} className="text-center">{d2}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {cells.map((c, i) => {
          if (!c.iso) return <div key={i} />;
          const selected = isSame(c.iso, start) || isSame(c.iso, end);
          const inRange = rangeContains(c.iso, start, end);
          return (
            <button
              key={c.iso}
              disabled={c.disabled}
              onClick={() => onPick(c.iso)}
              className={[
                "h-9 rounded text-sm transition",
                c.disabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-[var(--bg)]",
                selected ? "bg-[var(--brand-500)] text-white hover:bg-[var(--brand-600)]" : "",
                !selected && inRange ? "bg-[var(--brand-100)]" : "",
              ].join(" ")}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   Range pick logic
========================= */
function pickDate(iso: string, stay: { start?: string; end?: string }, setStay: (s: { start?: string; end?: string }) => void) {
  const { start, end } = stay;
  if (!start || (start && end)) {
    if (isBefore(iso, todayISO)) return;
    setStay({ start: iso, end: undefined });
    return;
  }
  if (isBefore(iso, start) || isSame(iso, start)) {
    setStay({ start: iso, end: undefined });
  } else {
    setStay({ start, end: iso });
  }
}
