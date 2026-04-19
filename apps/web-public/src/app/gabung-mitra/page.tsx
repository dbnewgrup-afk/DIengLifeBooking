"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

/** =========================
 *  Konfigurasi ringan
 *  =======================*/
const WA_NUMBER = "62812XXXXXXX"; // ganti ke nomor WA operasional
const BRAND = "Dieng Life Villas";

/** Util mini */
function clsx(...s: Array<string | false | null | undefined>) {
  return s.filter(Boolean).join(" ");
}
function toWaLink(params: Record<string, string>) {
  const lines = Object.entries(params)
    .filter(([, v]) => v && v.trim().length > 0)
    .map(([k, v]) => `• ${k}: ${v.trim()}`)
    .join("%0A");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Halo ${BRAND}, saya ingin gabung sebagai mitra.%0A%0A`
  )}${lines}`;
}

/** Badge kecil konsisten */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[--line] bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

/** Kartu konsisten */
function Card({
  title,
  desc,
  icon,
  children,
  className,
}: {
  title: string;
  desc?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-[--line] bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        {icon && (
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-[--line] bg-[--brand-50]">
            {icon}
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      </div>
      {desc && <p className="mb-4 text-sm text-slate-600">{desc}</p>}
      {children}
    </section>
  );
}

export default function JoinPartnerPage() {
  const router = useRouter();
  const legacyMode = process.env.NEXT_PUBLIC_LEGACY_PARTNER_FORM === "1";

  useEffect(() => {
    if (!legacyMode) {
      router.replace("/register/seller");
    }
  }, [legacyMode, router]);

  if (!legacyMode) {
    return null;
  }

  // Form state tegas, tanpa drama
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState<"villa" | "jeep" | "transport" | "lainnya">("villa");
  const [propertyName, setPropertyName] = useState("");
  const [note, setNote] = useState("");

  const disabled = useMemo(() => !name || !whatsapp, [name, whatsapp]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (disabled) return;
      const url = toWaLink({
        Nama: name,
        "No. WhatsApp": whatsapp,
        Email: email || "-",
        "Jenis Mitra": businessType,
        "Nama Properti/Usaha": propertyName || "-",
        Catatan: note || "-",
      });
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [disabled, name, whatsapp, email, businessType, propertyName, note]
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      {/* HERO */}
      <section className="mb-10 rounded-3xl border border-[--line] bg-[--brand-50] p-6 sm:p-10">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <Chip>Kemitraan Resmi</Chip>
              <Chip>Pembayaran Terintegrasi</Chip>
              <Chip>Laporan Transparan</Chip>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Gabung Mitra {BRAND}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-700">
              Tingkatkan okupansi dan alur operasional tanpa ribet. Kami sediakan
              sistem booking, pembayaran aman, dan laporan yang rapi. Kamu fokus ke layanan,
              sistem kami urus sisanya.
            </p>
          </div>
          <div className="shrink-0">
            <Link
              href="#daftar"
              className="inline-flex items-center justify-center rounded-xl bg-[--brand-600] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[--brand-700] focus:outline-none focus:ring-2 focus:ring-[--brand-400]"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* GRID UTAMA */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* BENEFIT */}
        <Card
          title="Nilai yang Kamu Dapat"
          desc="Bukan janji manis. Ini hal yang benar-benar memotong pekerjaan manual."
          icon={<span className="text-sm font-bold text-[--brand-600]">✓</span>}
          className="md:col-span-2"
        >
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              "Booking online 24/7 + kalender ketersediaan",
              "Pembayaran terintegrasi, notifikasi otomatis",
              "Laporan pendapatan harian/mingguan/bulanan",
              "Akses dashboard mitra yang simpel",
              "Dukungan onboarding tanpa biaya setup",
              "Skema komisi transparan dan bisa dibuktikan",
            ].map((x) => (
              <li
                key={x}
                className="flex items-start gap-3 rounded-xl border border-[--line] bg-white px-3 py-3"
              >
                <span className="mt-0.5 inline-block h-2 w-2 rounded-full bg-[--brand-600]" />
                <span className="text-sm text-slate-700">{x}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* SYARAT RINGKAS */}
        <Card
          title="Syarat Singkat"
          desc="Tidak bertele-tele. Yang penting inti."
          icon={<span className="text-sm font-bold text-[--brand-600]">!</span>}
        >
          <ul className="space-y-2 text-sm text-slate-700">
            <li>• Legal kepemilikan/usaha jelas.</li>
            <li>• Kontak penanggung jawab aktif.</li>
            <li>• Bersedia mematuhi SOP reservasi & refund.</li>
            <li>• Informasi harga dan kapasitas yang konsisten.</li>
          </ul>
        </Card>

        {/* LANGKAH */}
        <Card
          title="Langkah Onboarding"
          desc="Cepat, rapi, dan bisa mulai jualan."
          icon={<span className="text-sm font-bold text-[--brand-600]">→</span>}
          className="md:col-span-2"
        >
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Kirim Data", "Isi formulir di bawah. Kami tindak lanjuti via WA."],
              ["Setup Sistem", "Aktifkan katalog, harga, dan kalender ketersediaan."],
              ["Go Live", "Mulai terima booking dan pantau laporan pendapatan."],
            ].map(([t, d], i) => (
              <li
                key={t}
                className="rounded-xl border border-[--line] bg-white p-4"
              >
                <div className="mb-1 text-xs font-semibold text-[--brand-700]">
                  Langkah {i + 1}
                </div>
                <div className="text-sm font-semibold text-slate-900">{t}</div>
                <div className="mt-1 text-sm text-slate-600">{d}</div>
              </li>
            ))}
          </ol>
        </Card>

        {/* FORM CTA */}
        <Card
          title="Daftar Sebagai Mitra"
          desc="Butuh 1 menit. Kami balas secepatnya lewat WhatsApp."
          icon={<span className="text-sm font-bold text-[--brand-600]">✉</span>}
          className="md:row-span-2"
        >
          <form onSubmit={onSubmit} id="daftar" className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Nama Lengkap <span className="text-red-600">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kamu"
                className="w-full rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  No. WhatsApp <span className="text-red-600">*</span>
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="62812xxxxxxx"
                  className="w-full rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  type="email"
                  className="w-full rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Jenis Mitra
                </label>
                <select
                  value={businessType}
                  onChange={(e) =>
                    setBusinessType(e.target.value as typeof businessType)
                  }
                  className="w-full rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
                >
                  <option value="villa">Villa/Guesthouse</option>
                  <option value="jeep">Jeep Tour</option>
                  <option value="transport">Transport</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nama Properti/Usaha
                </label>
                <input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="Mis. Villa Matahari"
                  className="w-full rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Catatan
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan informasi singkat yang perlu kami tahu"
                rows={4}
                className="w-full resize-none rounded-xl border border-[--line] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[--brand-300]"
              />
            </div>

            <button
              type="submit"
              disabled={disabled}
              className={clsx(
                "w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[--brand-400]",
                disabled
                  ? "cursor-not-allowed bg-slate-400"
                  : "bg-[--brand-600] hover:bg-[--brand-700]"
              )}
              title={disabled ? "Isi Nama dan WhatsApp dulu" : "Kirim via WhatsApp"}
            >
              Kirim via WhatsApp
            </button>

            <p className="pt-1 text-center text-xs text-slate-500">
              Dengan mengirim, kamu setuju dihubungi untuk proses kemitraan. Kami tidak membagikan data ke pihak lain.
            </p>
          </form>
        </Card>

        {/* FAQ RINGKAS */}
        <Card
          title="FAQ Singkat"
          desc="Jawaban to the point."
          icon={<span className="text-sm font-bold text-[--brand-600]">?</span>}
          className="md:col-span-2"
        >
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              [
                "Biaya daftar berapa?",
                "Tidak ada biaya setup. Komisi diambil dari transaksi sukses, transparan di laporan.",
              ],
              [
                "Pembayaran pakai apa?",
                "QRIS/kartu/transfer melalui gateway resmi. Status otomatis update ke dashboard.",
              ],
              [
                "Kontrak panjang?",
                "Fleksibel. Ada perjanjian kerja sama standar untuk menjaga hak dan kewajiban kedua pihak.",
              ],
              [
                "Butuh tim IT?",
                "Tidak. Kami tangani setup dan support teknis dasar. Kamu fokus ke operasional.",
              ],
            ].map(([q, a]) => (
              <div key={q} className="rounded-xl border border-[--line] bg-white p-4">
                <dt className="text-sm font-semibold text-slate-900">{q}</dt>
                <dd className="mt-1 text-sm text-slate-600">{a}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </main>
  );
}

