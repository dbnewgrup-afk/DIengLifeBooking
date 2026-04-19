"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { useCart } from "@/store/cart";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const mode = searchParams.get("mode") === "cart" ? "cart" : "single";
  const { clear } = useCart();
  const cartClearedRef = useRef(false);
  const [countdown, setCountdown] = useState(5);
  const [backendStatus, setBackendStatus] = useState("MENUNGGU KONFIRMASI");
  const [syncLabel, setSyncLabel] = useState(
    "Menunggu konfirmasi webhook Xendit dari backend..."
  );

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function pollCanonicalStatus() {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt += 1) {
        try {
          const response = await fetch(`/api/payments/status/${encodeURIComponent(code)}`, {
            cache: "no-store",
          });
          const payload = await response.json().catch(() => null);
          const paymentStatus =
            typeof payload?.payment?.paymentStatus === "string"
              ? payload.payment.paymentStatus
              : "MENUNGGU KONFIRMASI";

          if (!cancelled) {
            setBackendStatus(paymentStatus);
          }

          if (!response.ok) {
            if (!cancelled && response.status === 401) {
              setSyncLabel(
                "Sesi buyer belum terdeteksi. Kamu tetap akan diarahkan ke invoice, dan jika diminta cukup login ulang untuk melihat status canonical."
              );
            } else if (!cancelled) {
              setSyncLabel(
                "Backend belum bisa membaca status terbaru. Invoice akan menampilkan status canonical terakhir yang tersedia."
              );
            }
          } else if (paymentStatus === "PAID") {
            if (!cancelled) {
              setSyncLabel(
                "Pembayaran sudah dikonfirmasi backend lewat webhook Xendit."
              );
            }
            return;
          } else if (!cancelled) {
            setSyncLabel(
              `Backend masih mencatat status ${paymentStatus}. Invoice akan tetap membaca status canonical ini.`
            );
          }
        } catch {
          if (!cancelled) {
            setSyncLabel(
              "Konfirmasi webhook masih diproses. Invoice akan menampilkan status canonical terakhir dari backend."
            );
          }
        }

        if (attempt < 3) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
      }
    }

    void pollCanonicalStatus();

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (mode !== "cart" || backendStatus !== "PAID" || cartClearedRef.current) {
      return;
    }

    clear();
    cartClearedRef.current = true;
  }, [backendStatus, clear, mode]);

  useEffect(() => {
    if (!code) return;

    const tick = window.setInterval(() => {
      setCountdown((value) => {
        if (value <= 1) {
          window.clearInterval(tick);
          router.replace(`/invoice/${encodeURIComponent(code)}`);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [code, router]);

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-bold">Kode pembayaran tidak ditemukan</h1>
          <p className="mt-3 text-sm text-slate-300">
            Balik ke checkout dulu ya, lalu ulangi proses pembayarannya.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = backendStatus === "PAID";
  const isFinalNonPaid =
    backendStatus === "FAILED" ||
    backendStatus === "EXPIRED" ||
    backendStatus === "CANCELLED";
  const badgeText = isPaid
    ? "Pembayaran sukses"
    : isFinalNonPaid
      ? "Pembayaran belum selesai"
      : "Verifikasi pembayaran";
  const title = isPaid
    ? "Booking kamu sudah masuk"
    : isFinalNonPaid
      ? "Status pembayaran masih perlu dicek"
      : "Pembayaran sedang diverifikasi";
  const description = isPaid
    ? "Backend sudah mengonfirmasi payment canonical. Kamu akan diarahkan otomatis ke invoice."
    : isFinalNonPaid
      ? "Backend belum menandai order ini sebagai PAID. Kamu tetap akan diarahkan ke invoice canonical untuk melihat status terbaru."
      : "Redirect dari provider sudah kembali, tapi backend masih menyamakan status canonical dari Booking + Payment.";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <BookingStepper current="success" className="mb-6" />

        <div className="rounded-[32px] border border-emerald-400/20 bg-slate-900/95 p-8 text-white shadow-2xl">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
              isPaid
                ? "bg-emerald-500 text-slate-950"
                : isFinalNonPaid
                  ? "bg-amber-400 text-slate-950"
                  : "bg-white/10 text-white"
            }`}
          >
            {isPaid ? "OK" : isFinalNonPaid ? "!" : "..."}
          </div>

          <div className="mt-6 text-center">
            <p
              className={`text-sm font-semibold uppercase tracking-[0.3em] ${
                isPaid ? "text-emerald-300" : isFinalNonPaid ? "text-amber-300" : "text-sky-300"
              }`}
            >
              {badgeText}
            </p>
            <h1 className="mt-3 text-3xl font-black">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-4">
              <span>Kode booking</span>
              <span className="font-mono font-semibold">{code}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span>Redirect invoice</span>
              <span>{countdown}s</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span>Status backend</span>
              <span className="font-semibold">{backendStatus}</span>
            </div>
            <div className="mt-3 text-xs text-slate-300">{syncLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
