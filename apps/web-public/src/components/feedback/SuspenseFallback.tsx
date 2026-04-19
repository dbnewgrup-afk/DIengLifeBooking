"use client";

import { useLang } from "@/components/i18n/lang";

export default function SuspenseFallback() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-600">
      <svg
        className="h-5 w-5 animate-spin"
        viewBox="0 0 24 24"
        aria-hidden="true"
        role="img"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="text-sm">{L("Memuat…", "Loading…")}</span>
    </div>
  );
}
    