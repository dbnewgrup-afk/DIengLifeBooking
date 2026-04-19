"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/i18n/lang";
import { listPromos } from "@/data/api";

/**
 * Halaman Promo
 * - Background gradient biru (ocean/pacific) ke putih
 * - Tab kategori + pencarian + sort
 * - Kartu promo interaktif: copy kode, countdown, syarat & ketentuan collapsible
 * - Tetap memberi ruang di bawah navbar fixed
 */

type Promo = {
  id: string;
  title: string;
  code: string;
  discount: string;
  until: string; // ISO date
  category: "villa" | "jeep" | "rent" | "dokumentasi" | "semua";
  description: string;
  badge?: string;
};

const TABS = [
  { key: "semua", labelID: "Semua", labelEN: "All" },
  { key: "villa", labelID: "Villa", labelEN: "Villa" },
  { key: "jeep", labelID: "Jeep", labelEN: "Jeep" },
  { key: "rent", labelID: "Rent", labelEN: "Car Rental" },
  { key: "dokumentasi", labelID: "Dokumentasi", labelEN: "Photography" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function PromoPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const [tab, setTab] = useState<TabKey>("semua");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"soon" | "latest">("soon");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await listPromos();
        if (!cancelled) setPromos(rows as Promo[]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    let rows = promos.filter(
      (p) =>
        (tab === "semua" || p.category === tab) &&
        (p.title.toLowerCase().includes(q.toLowerCase()) ||
          p.code.toLowerCase().includes(q.toLowerCase()))
    );
    rows = rows.sort((a, b) =>
      sort === "soon"
        ? +new Date(a.until) - +new Date(b.until)
        : +new Date(b.until) - +new Date(a.until)
    );
    return rows;
  }, [promos, tab, q, sort]);

  return (
    <main
      className="
        min-h-screen
        pt-[calc(var(--nav-sm)+var(--nav-sub)+24px)] md:pt-[calc(var(--nav-md)+var(--nav-sub)+24px)]
        pb-20
        bg-gradient-to-b from-[#0a1f35] via-[#0a1f35]/50 to-white
      "
    >
      <section className="container-page">
        {/* HERO RINGKES */}
        <header className="text-center text-white">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {L("Promo Terbaru", "Latest Deals")}
          </h1>
          <p className="mt-2 text-white/85">
            {L("Kode diskon resmi. Hematnya nyata, bukan ilusi optik.", "Official discount codes. Real savings, no optical illusions.")}
          </p>
        </header>

        {/* BAR KONTROL */}
        <div className="mt-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-3 text-white">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-full text-sm md:text-base font-semibold transition
                      ${
                        active
                          ? "bg-white/95 text-[var(--text)]"
                          : "bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/20"
                      }`}
                    aria-pressed={active}
                  >
                    {L(t.labelID, t.labelEN)}
                  </button>
                );
              })}
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 rounded-xl bg-white/20 px-3 py-2 backdrop-blur hover:bg-white/30 transition">
                <span aria-hidden>🔎</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={L("Cari kode atau judul", "Search code or title")}
                  className="bg-transparent outline-none placeholder:text-white/70 text-sm md:text-base"
                  aria-label={L("Cari", "Search")}
                />
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="rounded-xl bg-white/90 text-[var(--text)] px-3 py-2 text-sm md:text-base"
                aria-label={L("Urutkan", "Sort")}
              >
                <option value="soon">{L("Berakhir lebih cepat", "Ending soonest")}</option>
                <option value="latest">{L("Berakhir lebih lama", "Ending latest")}</option>
              </select>
            </div>
          </div>
        </div>

        {/* GRID PROMO */}
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full rounded-xl border bg-white/60 p-6 text-center">
              {L("Memuat promo dari database...", "Loading promos from the database...")}
            </div>
          )}
          {list.map((p) => (
            <PromoCard key={p.id} data={p} />
          ))}
          {!loading && list.length === 0 && (
            <div className="col-span-full rounded-xl border bg-white/60 p-6 text-center">
              {L("Tidak ada promo yang cocok. Kamu terlalu spesifik atau semesta sedang malas.", "No matching deals. You’re too specific or the universe is lazy today.")}
            </div>
          )}
        </div>

        {/* FAQ MINI */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <FaqItem
            q={L("Bagaimana cara pakai kode promo?", "How do I use a promo code?")}
            a={L("Masukkan kode di halaman pembayaran. Jika memenuhi syarat, potongan diterapkan otomatis sebelum bayar.", "Enter the code at checkout. If eligible, the discount applies automatically before payment.")}
          />
          <FaqItem
            q={L("Bisa digabung dengan promo lain?", "Can I combine multiple promos?")}
            a={L("Tidak. Pilih yang paling menguntungkan. Hidup adalah pilihan, juga dompet.", "No. Pick the best one. Life is choices, so is your wallet.")}
          />
          <FaqItem
            q={L("Kenapa kodenya tidak berlaku?", "Why is the code not working?")}
            a={L("Cek masa berlaku, kategori yang didukung, dan minimum transaksi. Beberapa kode tidak berlaku saat high season.", "Check validity period, supported categories, and minimum spend. Some codes don’t apply during high season.")}
          />
          <FaqItem
            q={L("Apakah kuota promo terbatas?", "Is there a quota limit?")}
            a={L("Sering kali ya. Kalau dapat, ya syukuri. Kalau kehabisan, jangan menyalahkan takdir.", "Often yes. If you get it, be grateful. If not, don’t blame destiny.")}
          />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/catalog?type=villa"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-600)] px-5 py-3 text-white font-semibold hover:bg-[var(--brand-700)]"
          >
            {L("Lihat Produk & Pakai Kode →", "Browse Products & Apply Code →")}
          </Link>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------ */
/* Components                            */
/* ------------------------------------ */

function PromoCard({ data }: { data: Promo }) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const rest = countdownLabel(data.until, lang);

  const colorStripe =
    data.category === "villa"
      ? "from-teal-400 to-sky-500"
      : data.category === "jeep"
      ? "from-orange-400 to-pink-500"
      : data.category === "rent"
      ? "from-indigo-400 to-blue-600"
      : data.category === "dokumentasi"
      ? "from-violet-400 to-fuchsia-500"
      : "from-cyan-400 to-blue-500";

  return (
    <article className="rounded-xl border bg-white/80 overflow-hidden shadow-sm">
      {/* stripe gradient */}
      <div className={`h-1.5 bg-gradient-to-r ${colorStripe}`} />

      <div className="p-4 space-y-3">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[var(--text)]">{data.title}</h3>
            <p className="text-sm text-[var(--muted)]">
              {L("Berakhir", "Ends")} {rest} • {L("Kategori", "Category")}:{" "}
              <span className="capitalize">{data.category}</span>
            </p>
          </div>
          {data.badge && (
            <span className="shrink-0 rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs text-[var(--brand-700)] font-semibold border border-[var(--brand-100)]">
              {data.badge}
            </span>
          )}
        </header>

        <p className="text-sm text-[var(--text)]/90">{data.description}</p>

        {/* KODE + COPY */}
        <div className="flex items-center gap-2">
          <span className="rounded-lg border px-3 py-2 bg-white font-mono tracking-wide">
            {data.code}
          </span>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(data.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="rounded-lg border px-3 py-2 bg-[var(--bg)] hover:bg-[var(--brand-50)] text-sm"
            aria-live="polite"
          >
            {copied ? L("Tersalin ✓", "Copied ✓") : L("Salin", "Copy")}
          </button>

          <span className="ml-auto rounded-md bg-[var(--brand-600)] px-2.5 py-1.5 text-white text-sm font-semibold">
            {data.discount}
          </span>
        </div>

        {/* S&K */}
        <div className="pt-1 border-t">
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-sm underline underline-offset-4 hover:opacity-90"
            aria-expanded={open}
          >
            {open ? L("Tutup S&K", "Hide T&C") : L("Lihat S&K singkat", "See short T&C")}
          </button>
          {open && (
            <ul className="mt-2 list-disc pl-5 text-sm text-[var(--muted)] space-y-1">
              <li>{L("Kode tidak dapat diuangkan.", "Codes are not redeemable for cash.")}</li>
              <li>{L("Satu akun, satu kali pemakaian.", "One use per account.")}</li>
              <li>{L("Tidak berlaku digabung promo lain.", "Cannot be combined with other promos.")}</li>
              <li>{L("Tim kami berhak membatalkan transaksi yang tidak sesuai ketentuan.", "We may cancel transactions that violate terms.")}</li>
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border bg-white/80">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-2"
        aria-expanded={open}
      >
        <span className="font-semibold text-[var(--text)]">{q}</span>
        <span className="text-lg">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="px-4 pb-4 text-[var(--muted)] text-sm">{a}</p>}
    </div>
  );
}

/* ------------------------------------ */
/* Utils                                 */
/* ------------------------------------ */

function countdownLabel(untilISO: string, lang: "id" | "en") {
  const diff = +new Date(untilISO) - Date.now();
  if (diff <= 0) return lang === "en" ? "soon" : "segera";
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  if (d > 0) return lang === "en" ? `in ${d} days` : `dalam ${d} hari`;
  if (h > 0) return lang === "en" ? `in ${h} hours` : `dalam ${h} jam`;
  return lang === "en" ? `in ${m} minutes` : `dalam ${m} menit`;
}
