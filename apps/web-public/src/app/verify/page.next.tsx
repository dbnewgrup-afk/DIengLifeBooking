"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/i18n/lang";
import {
  fetchCanonicalOrderDetail,
  type CanonicalOrderDetail,
} from "@/lib/canonical-order";
import { formatRupiah } from "@/lib/format";

type VerifyState =
  | { loading: true; error: null; data: null; requiresAuth: false }
  | {
      loading: false;
      error: string | null;
      data: CanonicalOrderDetail | null;
      requiresAuth: boolean;
    };

function getVerifyStatus(paymentStatus?: string) {
  if (paymentStatus === "PAID") return "paid";
  if (paymentStatus === "PENDING" || paymentStatus === "AWAITING_PAYMENT") return "pending";
  return "failed";
}

function nightsBetween(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diff = end.getTime() - start.getTime();
  return diff > 0 ? Math.round(diff / (1000 * 60 * 60 * 24)) : 0;
}

export default function VerifyPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const search = useSearchParams();
  const code = search.get("code") ?? "";
  const [state, setState] = useState<VerifyState>({
    loading: true,
    error: null,
    data: null,
    requiresAuth: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setState({ loading: true, error: null, data: null, requiresAuth: false });
      const result = await fetchCanonicalOrderDetail(code);
      if (!cancelled) {
        setState({
          loading: false,
          error: result.error,
          data: result.data,
          requiresAuth: result.requiresAuth,
        });
      }
    }

    if (code) {
      void run();
    } else {
      setState({
        loading: false,
        error: L("Kode booking tidak ditemukan.", "Booking code was not found."),
        data: null,
        requiresAuth: false,
      });
    }

    return () => {
      cancelled = true;
    };
  }, [L, code]);

  const status = getVerifyStatus(state.data?.paymentStatus);
  const paid = status === "paid";
  const pending = status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => history.back()} className="text-sm text-slate-500">
          &lt; {L("Kembali", "Back")}
        </button>

        <h1 className="mt-2 text-2xl font-bold">Verify</h1>
        <p className="text-sm text-slate-500">
          {L(
            "Halaman verify lama ini dipertahankan untuk kompatibilitas. Status aktif sekarang dibaca dari Booking + Payment backend.",
            "This legacy verify page is kept for compatibility. The active status now comes from the backend Booking + Payment records."
          )}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          {state.loading ? (
            <div>{L("Memeriksa status canonical dari backend...", "Checking canonical backend status...")}</div>
          ) : null}

          {!state.loading && state.data ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className={
                    paid
                      ? "grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white"
                      : pending
                        ? "grid h-10 w-10 place-items-center rounded-full bg-amber-500 text-white"
                        : "grid h-10 w-10 place-items-center rounded-full bg-rose-600 text-white"
                  }
                >
                  OK
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {paid
                      ? L("Pembayaran Berhasil", "Payment Successful")
                      : pending
                        ? L("Pembayaran Tertunda", "Payment Pending")
                        : L("Pembayaran Gagal", "Payment Failed")}
                  </div>
                  <div className="text-slate-500">{code}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold">{L("Detail Pesanan", "Order Details")}</h3>
                  <ul className="space-y-2 text-sm">
                    {state.data.items.map((item) => (
                      <li key={item.productId} className="flex items-center gap-2">
                        <span className="text-emerald-600">-</span>
                        <span className="flex-1">{item.name}</span>
                        <span className="font-medium">{formatRupiah(item.unitPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">{L("Ringkasan", "Summary")}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span>{L("Tamu", "Guests")}</span>
                    <span className="font-medium">{state.data.guestCount ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>{L("Malam", "Nights")}</span>
                    <span className="font-medium">
                      {nightsBetween(state.data.startDate, state.data.endDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-3 font-bold">
                    <span>Total</span>
                    <span>{formatRupiah(state.data.total)}</span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <Link
                      className="grid h-12 place-items-center rounded-xl bg-emerald-600 font-semibold text-white"
                      href={`/invoice/${encodeURIComponent(code)}`}
                    >
                      {L("Buka halaman invoice aktif", "Open active invoice page")}
                    </Link>
                    <a className="grid h-12 place-items-center rounded-xl border" href="/">
                      {L("Kembali ke Beranda", "Back to Home")}
                    </a>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {L(
                      "*Halaman invoice adalah flow aktif untuk membaca status booking dan payment canonical.",
                      "*The invoice page is the active flow for canonical booking and payment status."
                    )}
                  </p>
                </div>
              </div>
            </>
          ) : null}

          {!state.loading && state.error && !state.data ? (
            <div className="rounded-xl bg-rose-50 p-4 text-rose-600">
              <p>
                {L(
                  "Gagal membaca status booking dari backend.",
                  "Failed to read booking status from the backend."
                )}{" "}
                {state.error}
              </p>
              {state.requiresAuth ? (
                <Link
                  href={`/login/user?returnTo=${encodeURIComponent(`/invoice/${code}`)}`}
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 font-semibold text-white"
                >
                  {L("Login buyer", "Buyer login")}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
