"use client";

import { useEffect } from "react";
import { useLang } from "@/components/i18n/lang";

type ToastProps = {
  /** isi pesan utama (sudah diterjemahkan di pemanggil kalau perlu) */
  message: string;
  /** optional judul */
  title?: string;
  /** intent visual */
  intent?: "info" | "success" | "warning" | "error";
  /** auto close dalam ms (default 3000). set 0 untuk non-auto */
  duration?: number;
  onClose?: () => void;
};

export function Toast({
  message,
  title,
  intent = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  useEffect(() => {
    if (!duration) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const clsByIntent: Record<typeof intent, string> = {
    info: "bg-blue-50 text-blue-800 ring-blue-200",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    warning: "bg-amber-50 text-amber-900 ring-amber-200",
    error: "bg-rose-50 text-rose-800 ring-rose-200",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-full max-w-md rounded-xl ring-1 px-4 py-3 shadow-sm ${clsByIntent[intent]}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0">
          {title ? (
            <p className="text-sm font-semibold leading-5">{title}</p>
          ) : null}
          <p className="text-sm leading-5">{message}</p>
        </div>
        <button
          type="button"
          className="ml-auto shrink-0 rounded-md px-2 py-1 text-xs hover:bg-black/5"
          aria-label={L("Tutup", "Close")}
          onClick={onClose}
        >
          {L("Tutup", "Close")}
        </button>
      </div>
    </div>
  );
}

/**
 * Contoh penggunaan:
 *
 * <Toast
 *   intent="success"
 *   title={t("deals")}
 *   message={lang === "en" ? "Item added to cart" : "Ditambahkan ke keranjang"}
 *   onClose={() => setOpen(false)}
 * />
 *
 * Untuk menaruh di layar, bungkus dengan container fixed kanan-bawah sesuai kebutuhan UI.
 */
