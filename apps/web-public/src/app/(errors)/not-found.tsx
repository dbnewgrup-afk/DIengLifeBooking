"use client";

import Link from "next/link";
import { useLang } from "@/components/i18n/lang";

export default function NotFound() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="mx-auto max-w-xl px-6 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
        <p className="mt-2 text-lg font-semibold text-slate-900">
          {L("Halaman tidak ditemukan", "Page not found")}
        </p>
        <p className="mt-2 text-slate-600">
          {L(
            "Maaf, kami tidak bisa menemukan halaman yang Anda cari.",
            "Sorry, we couldn’t find the page you’re looking for."
          )}
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {L("Kembali ke Beranda", "Back to Home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
