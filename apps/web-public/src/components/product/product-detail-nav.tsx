"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { StayDatePicker } from "@/components/booking/stay-date-picker";
import { SlotPicker } from "@/components/booking/slot-picker";

type Props = {
  product: Product;
  // initial params dari URL supaya prefill
  initialQuery?: { start?: string; end?: string; date?: string; time?: string };
};

export function ProductDetailNav({ product, initialQuery }: Props) {
  const router = useRouter();

  // visibility saat scroll
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // state search bar
  const [where, setWhere] = useState("");
  const [start, setStart] = useState<string | undefined>(initialQuery?.start);
  const [end, setEnd] = useState<string | undefined>(initialQuery?.end);
  const [date, setDate] = useState(initialQuery?.date ?? "");
  const [time, setTime] = useState(initialQuery?.time ?? "");
  // kapasitas dasar villa sebagai info (guest disabled)
  const baseCapacity = useMemo(() => (product.type === "villa" ? product.baseCapacity ?? 2 : 0), [product]);

  const canSearch =
    product.type === "villa" ? Boolean(start && end) : Boolean(date && time);

  function onSearch() {
    const q = new URLSearchParams({ type: product.type });
    if (where) q.set("q", where);
    if (product.type === "villa") {
      if (start) q.set("start", start);
      if (end) q.set("end", end);
      q.set("adults", String(baseCapacity)); // guest fixed di FE
    } else {
      q.set("date", date);
      q.set("time", time);
    }
    router.push(`/catalog?${q.toString()}`);
  }

  // tab anchors
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "location", label: "Location" },
    { id: "facilities", label: "Facilities" },
    { id: "policy", label: "Policy" },
    { id: "reviews", label: "Reviews" },
  ] as const;

  // highlight tab aktif
  const [active, setActive] = useState<string>("overview");
  useEffect(() => {
    const sections = tabs.map(t => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries
          .filter(x => x.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (e?.target?.id) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach(s => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed left-0 right-0 z-30 transition-all duration-200
      ${visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"}
      top-[var(--nav-sm)] md:top-[var(--nav-md)]`}
    >
      <div className="border-b border-[var(--line)] bg-white/95 backdrop-blur">
        <div className="container-page py-2">
          {/* search bar ringkas */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_1fr_auto] gap-2">
            <label className="input flex items-center gap-2">
              <span aria-hidden>📍</span>
              <input
                className="outline-none w-full text-sm bg-transparent"
                placeholder="Kota atau near me"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
              />
            </label>

            {product.type === "villa" ? (
              <>
                <StayDatePicker
                  start={start}
                  end={end}
                  onChange={(v) => { setStart(v.start); setEnd(v.end); }}
                />
                <label className="input flex items-center gap-2" title="Guest sesuai kapasitas dasar (ubah via add-on)">
                  <span aria-hidden>👤</span>
                  <input className="bg-transparent text-sm w-full" value={`${baseCapacity} tamu (dasar)`} disabled aria-disabled />
                </label>
              </>
            ) : (
              <>
                <label className="input flex items-center gap-2">
                  <span aria-hidden>📅</span>
                  <input
                    type="date"
                    className="outline-none w-full text-sm bg-transparent"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <div className="input">
                  <SlotPicker
                    date={date}
                    type={product.type === "jeep" ? "jeep" : product.type === "transport" ? "transport" : "dokumentasi"}
                    value={time}
                    onChange={setTime}
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={onSearch}
              disabled={!canSearch}
              className="btn btn-brand"
              title={!canSearch ? "Lengkapi tanggal/jam dulu" : "Cari"}
            >
              Search
            </button>
          </div>

          {/* tabs */}
          <nav className="mt-2 flex items-center gap-3 overflow-x-auto">
            {tabs.map(t => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={`text-sm px-3 py-1.5 rounded-full border
                  ${active === t.id ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]" : "bg-white border-[var(--line)]"}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
