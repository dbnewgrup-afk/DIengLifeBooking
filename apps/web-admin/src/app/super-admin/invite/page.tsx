"use client";

import Link from "next/link";

export default function SuperAdminInvitePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
            Super Admin
          </p>
          <h1 className="text-3xl font-semibold text-white">Invite management is not wired yet</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-300">
            Route ini sudah dibuat sebagai halaman valid agar typecheck Next.js bersih. Endpoint backend
            invite masih placeholder, jadi alur undangan admin atau seller belum boleh dipakai untuk launch.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Launch note: keep invite flow disabled until API `/invite` sudah punya implementasi final, audit
          token, dan acceptance test.
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/super-admin"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Back to super admin
          </Link>
          <Link
            href="/login/admin"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Admin login
          </Link>
        </div>
      </div>
    </main>
  );
}
