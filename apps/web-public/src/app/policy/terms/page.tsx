import Link from "next/link";

export const dynamic = "force-dynamic";

const POLICY_POINTS = [
  {
    title: "Validasi jadwal",
    description:
      "Pastikan tanggal, jam, durasi, dan jumlah tamu sudah sesuai sebelum lanjut ke checkout. Sistem akan menggunakan data ini sebagai dasar booking dan invoice.",
  },
  {
    title: "Pembayaran",
    description:
      "Invoice dibuat melalui flow checkout dan status pembayaran mengikuti record canonical di backend. Simpan kode booking kamu untuk akses invoice dan dashboard buyer.",
  },
  {
    title: "Perubahan dan pembatalan",
    description:
      "Kebijakan perubahan jadwal atau refund bisa berbeda per produk. Gunakan catatan booking untuk kebutuhan khusus dan cek detail tambahan yang muncul di halaman produk.",
  },
  {
    title: "Data buyer",
    description:
      "Nama, email, nomor WhatsApp, dan identitas dipakai untuk kebutuhan booking, invoice, dan konfirmasi buyer. Pastikan data yang dimasukkan cocok dengan akun buyer yang login.",
  },
];

export default function BookingTermsPage() {
  return (
    <main className="container-page py-10 text-[var(--text)]">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.96)_100%)] p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Booking Policy
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">Kebijakan singkat booking dan checkout</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Halaman ini jadi acuan singkat buat user public sebelum masuk ke checkout. Detail operasional tetap mengikuti data produk, invoice, dan status booking yang tercatat di backend.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {POLICY_POINTS.map((point) => (
            <article
              key={point.title}
              className="rounded-[28px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,249,255,0.95)_100%)] p-6 shadow-[0_22px_52px_rgba(15,23,42,0.08)]"
            >
              <h2 className="text-lg font-semibold text-slate-950">{point.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{point.description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#f5fbff_0%,#eaf4ff_100%)] p-6 text-sm leading-7 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
          Kalau kamu sudah siap, balik ke katalog atau halaman booking untuk lanjut pilih produk dan isi jadwal.
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/booking" className="btn btn-brand">
              Lanjut ke booking
            </Link>
            <Link href="/catalog" className="btn btn-ghost">
              Buka katalog
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
