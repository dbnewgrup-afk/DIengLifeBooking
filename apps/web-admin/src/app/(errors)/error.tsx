"use client";

import * as React from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-sky-50">
        <div className="mx-auto mt-24 w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 text-center shadow">
          <h1 className="text-2xl font-extrabold text-sky-900">Terjadi Kesalahan</h1>
          <p className="mt-2 text-sm text-sky-800/80">
            {error?.message || "Maaf, ada sesuatu yang tidak beres."}
          </p>
          <div className="mt-4">
            <button
              onClick={reset}
              className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Coba Lagi
            </button>
          </div>
          {error?.digest ? (
            <p className="mt-3 text-xs font-mono text-sky-700/70">#{error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
