"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import {
  fetchCanonicalOrderDetail,
  getCanonicalPayment,
  type CanonicalOrderDetail,
} from "@/lib/canonical-order";

type RemoteOrderState =
  | { loading: true; error: null; data: null; requiresAuth: false }
  | {
      loading: false;
      error: string | null;
      data: CanonicalOrderDetail | null;
      requiresAuth: boolean;
    };

function formatDateLabel(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toStatusTone(status?: string): "default" | "success" | "warning" {
  if (status === "PAID") return "success";
  if (status === "PENDING" || status === "AWAITING_PAYMENT") return "warning";
  return "default";
}

export default function InvoicePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "";
  const [orderState, setOrderState] = useState<RemoteOrderState>({
    loading: true,
    error: null,
    data: null,
    requiresAuth: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadOrder() {
      setOrderState({ loading: true, error: null, data: null, requiresAuth: false });
      const result = await fetchCanonicalOrderDetail(code);

      if (!cancelled) {
        setOrderState({
          loading: false,
          error: result.error,
          data: result.data,
          requiresAuth: result.requiresAuth,
        });
      }
    }

    if (code) {
      void loadOrder();
    } else {
      setOrderState({
        loading: false,
        error: "Kode booking tidak ditemukan.",
        data: null,
        requiresAuth: false,
      });
    }

    return () => {
      cancelled = true;
    };
  }, [code]);

  const latestPayment = getCanonicalPayment(orderState.data);
  const orderItems = orderState.data?.items ?? [];
  const hostedInvoiceUrl = latestPayment?.invoiceUrl;
  const canContinuePayment =
    orderState.data?.paymentStatus === "PENDING" ||
    orderState.data?.paymentStatus === "AWAITING_PAYMENT";
  const listingItems = orderItems.filter((item) => item.type !== "addon");
  const addonItems = orderItems.filter((item) => item.type === "addon");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Invoice</p>
            <h1 className="mt-2 text-3xl font-black">Detail pembayaran booking</h1>
            <p className="mt-2 text-sm text-slate-300">
              Halaman ini membaca status canonical langsung dari record booking dan payment di backend.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Kode booking</div>
            <div className="mt-1 font-mono text-sm font-semibold">{code || "-"}</div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            {orderState.loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                Lagi memuat invoice canonical dari backend...
              </div>
            ) : null}

            {!orderState.loading && orderState.error && !orderState.data ? (
              <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-sm text-amber-100">
                <p>{orderState.error}</p>
                {orderState.requiresAuth ? (
                  <Link
                    href={`/login/user?returnTo=${encodeURIComponent(`/invoice/${code}`)}`}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Login buyer untuk buka invoice
                  </Link>
                ) : null}
              </div>
            ) : null}

            {orderState.data ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <InfoBlock
                    title="Status pembayaran"
                    value={orderState.data.paymentStatus}
                    tone={toStatusTone(orderState.data.paymentStatus)}
                  />
                  <InfoBlock title="Tanggal terbit" value={formatDateLabel(orderState.data.createdAt)} />
                  <InfoBlock title="Tanggal bayar" value={formatDateLabel(latestPayment?.paidAt ?? undefined)} />
                  <InfoBlock title="Pemesan" value={orderState.data.customer?.name ?? "-"} />
                  <InfoBlock title="Email" value={orderState.data.buyerEmail ?? "-"} />
                  <InfoBlock title="WhatsApp" value={orderState.data.buyerPhone ?? "-"} />
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-bold">Ringkasan pesanan</h2>
                  <div className="mt-4 space-y-4 text-sm">
                    {listingItems.map((item) => (
                      <div key={item.productId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-semibold text-white">{item.name}</div>
                            {item.scheduleLabel ? (
                              <div className="mt-1 text-xs text-slate-400">{item.scheduleLabel}</div>
                            ) : null}
                            {item.detailLabel ? (
                              <div className="mt-1 text-xs text-slate-400">{item.detailLabel}</div>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">
                              {formatRupiah(item.unitPrice)} x {item.qty}
                            </div>
                            {item.lineTotal ? (
                              <div className="mt-1 text-xs text-slate-400">{formatRupiah(item.lineTotal)}</div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                    {addonItems.map((item) => (
                      <Row
                        key={item.productId}
                        label={item.name}
                        value={item.lineTotal ? formatRupiah(item.lineTotal) : formatRupiah(item.unitPrice)}
                      />
                    ))}
                    <Row
                      label="Jadwal checkout"
                      value={`${orderState.data.startDate || "-"}${orderState.data.endDate ? ` - ${orderState.data.endDate}` : ""}`}
                    />
                    <Row label="Total quantity" value={String(orderState.data.qty)} />
                    <Row label="Peserta" value={String(orderState.data.guestCount ?? "-")} />
                    {orderState.data.isMultiItem ? (
                      <Row label="Jumlah booking" value={String(orderState.data.bookingCodes?.length ?? listingItems.length)} />
                    ) : null}
                    {orderState.data.promo ? (
                      <Row
                        label="Promo"
                        value={`${orderState.data.promo.code} - ${orderState.data.promo.title}`}
                      />
                    ) : null}
                    {orderState.data.notes ? (
                      <Row label="Catatan buyer" value={orderState.data.notes} />
                    ) : null}
                    <div className="border-t border-white/10 pt-3">
                      <Row label="Subtotal" value={formatRupiah(orderState.data.subtotal)} />
                      <Row label="Diskon" value={formatRupiah(orderState.data.discountAmount)} />
                      <div className="mt-3 flex items-center justify-between text-base font-bold">
                        <span>Total</span>
                        <span>{formatRupiah(orderState.data.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-lg font-bold">Record payment backend</h2>
                  {latestPayment ? (
                    <div className="mt-4 space-y-2 text-sm text-slate-200">
                      <Row label="Provider" value={latestPayment.provider} />
                      <Row label="Status payment" value={latestPayment.status} />
                      <Row label="External ID" value={latestPayment.externalId ?? "-"} />
                      <Row label="Paid at" value={formatDateLabel(latestPayment.paidAt ?? undefined)} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-300">
                      Belum ada record payment yang tercatat di backend untuk booking ini.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
              <h2 className="text-lg font-bold">Aksi cepat</h2>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/booking"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10"
                >
                  Booking lagi
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10"
                >
                  Buka dashboard buyer
                </Link>
                {hostedInvoiceUrl ? (
                  <a
                    href={hostedInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    {canContinuePayment ? "Lanjutkan pembayaran" : "Buka invoice provider"}
                  </a>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
              <h2 className="text-lg font-bold">Catatan</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Fallback dari local draft dan cek status provider langsung sudah dilepas dari halaman ini supaya
                status yang tampil selalu mengikuti record canonical di backend.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
        : "border-white/10 bg-white/5 text-white";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-2 text-sm font-semibold">{value || "-"}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-300">{label}</span>
      <span className="text-right font-medium text-white">{value || "-"}</span>
    </div>
  );
}
