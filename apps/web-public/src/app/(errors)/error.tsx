"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLang } from "@/components/i18n/lang";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {L("Terjadi kesalahan.", "Something went wrong.")}
          </h1>
          <p className="text-slate-600 mb-6">
            {L(
              "Halaman gagal dimuat. Coba muat ulang atau kembali ke beranda.",
              "The page failed to load. Try reloading or go back to the homepage."
            )}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
            >
              {L("Muat Ulang", "Reload")}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {L("Kembali ke Beranda", "Back to Home")}
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
