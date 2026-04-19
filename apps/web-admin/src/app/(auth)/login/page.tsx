import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[url('/images/slider.webp')] bg-cover bg-center px-4 py-6 sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,34,72,.18),rgba(10,34,72,.24))]" />

      <div className="relative z-10 flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <section className="w-full max-w-[470px] overflow-hidden rounded-[28px] bg-white/95 shadow-[0_28px_70px_rgba(16,24,40,.28)] backdrop-blur-sm">
          <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0f6aa8,#1688cc)] px-7 py-8 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_18%,transparent_0_46px,rgba(255,255,255,.1)_46px_47px,transparent_47px)]" />
            <div className="relative z-10">
              <div className="mx-auto mb-4 inline-flex rounded-[18px] bg-white/95 px-4 py-3 shadow-[0_12px_28px_rgba(8,25,45,.16)]">
                <Image
                  src="/images/logo.png"
                  alt="Dieng Life Villas"
                  width={270}
                  height={74}
                  className="h-auto w-full max-w-[220px]"
                  priority
                />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/80">
                Portal Login
              </p>
              <h1 className="mt-2 text-[2rem] font-extrabold tracking-[-0.03em]">
                Pilih jalur masuk
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Masuk lewat jalur yang sesuai dengan jenis akun kamu.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-7 py-6">
            <Link
              href="/login/admin"
              className="block rounded-[18px] border border-sky-100 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_24px_rgba(15,106,168,.12)]"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Admin
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                Dashboard internal
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Untuk super admin, admin, dan kasir.
              </p>
            </Link>

            <Link
              href="/login/seller"
              className="block rounded-[18px] border border-sky-100 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_24px_rgba(15,106,168,.12)]"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Seller
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                Dashboard seller
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Untuk akun seller yang sudah terdaftar.
              </p>
            </Link>

            <Link
              href="/login/affiliate"
              className="block rounded-[18px] border border-sky-100 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_14px_24px_rgba(15,106,168,.12)]"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Affiliate
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                Dashboard affiliate
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Untuk akun affiliate yang sudah aktif.
              </p>
            </Link>

            <Link
              href="/register/seller"
              className="block rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_24px_rgba(15,23,42,.08)]"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Register seller
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                Daftarkan akun baru
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Untuk seller baru sebelum login ke dashboard.
              </p>
            </Link>

            <Link
              href="/register/affiliate"
              className="block rounded-[18px] border border-slate-200 bg-slate-50 px-5 py-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_24px_rgba(15,23,42,.08)]"
            >
              <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Register affiliate
              </div>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.02em] text-slate-900">
                Onboarding affiliate
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Untuk jalur affiliate yang mengikuti review internal.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
