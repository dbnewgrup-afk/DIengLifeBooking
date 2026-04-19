"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingStepper } from "@/components/booking/booking-stepper";
import { API_BASE_URL, getPublicToken } from "@/lib/auth";
import { getAffiliateAttribution } from "@/lib/affiliate-attribution";
import { getBookingDraft, saveBookingDraft, type BookingDraft } from "@/lib/booking-flow";
import {
  buildCartCheckoutPayload,
  buildCartCreateOrderRequest,
  makeCartOrderCode,
  type CartCheckoutCustomer,
} from "@/lib/cart-checkout";
import { formatRupiah } from "@/lib/format";
import {
  getCartItemSubtotal,
  getCartItemUnitLabel,
  getCartItemUnitPrice,
  type CartItem,
  useCart,
} from "@/store/cart";

type PaymentResponse = {
  ok: boolean;
  message?: string;
  code?: string;
  invoiceId?: string;
  invoiceUrl?: string;
  status?: string;
  paymentStatus?: string;
  xenditStatus?: string;
};

type ApiOrderItem = {
  name: string;
  qty: number;
  unitPrice: number;
  type?: string;
};

type ApiOrderSummary = {
  code: string;
  total: number;
  discountAmount: number;
  items: ApiOrderItem[];
  isMultiItem?: boolean;
};

function translateUnit(unit: "malam" | "jam" | "rute") {
  if (unit === "malam") return "malam";
  if (unit === "jam") return "jam";
  return "rute";
}

function kindLabel(item: CartItem) {
  if (item.categoryLabel) return item.categoryLabel;
  if (item.kind === "villa") return "Villa";
  if (item.kind === "jeep") return "Jeep";
  if (item.kind === "transport") return "Transport";
  return "Dokumentasi";
}

function cartScheduleLabel(item: CartItem) {
  if (item.kind === "villa") {
    return `${item.start} - ${item.end}`;
  }
  return `${item.date}${item.time ? `, ${item.time}` : ""}`;
}

function isCustomerFilled(customer: CartCheckoutCustomer) {
  return Boolean(
    customer.fullName.trim() &&
      customer.email.trim() &&
      customer.phone.trim() &&
      customer.identityNumber.trim()
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items: cartItems } = useCart();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const failedPaymentCode = searchParams.get("code")?.trim() ?? "";
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartOrderCode] = useState(() =>
    failedPaymentCode.startsWith("CRT-") ? failedPaymentCode : makeCartOrderCode()
  );
  const [cartCustomer, setCartCustomer] = useState<CartCheckoutCustomer>({
    fullName: "",
    email: "",
    phone: "",
    identityNumber: "",
  });

  const cartPayload = useMemo(
    () => buildCartCheckoutPayload(cartItems, cartOrderCode),
    [cartItems, cartOrderCode]
  );
  const affiliateAttribution = useMemo(() => getAffiliateAttribution(), []);

  useEffect(() => {
    setDraft(getBookingDraft());
    setLoadingDraft(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("status") === "failed") {
      setError("Pembayaran dibatalkan atau gagal. Kamu bisa coba lagi dari halaman ini.");
    }
  }, [searchParams]);

  const isCartMode = source === "cart";
  const singleBackHref = draft
    ? `/booking/details?category=${encodeURIComponent(draft.category)}&productId=${encodeURIComponent(draft.product.id)}`
    : "/booking";

  async function createSingleOrderBeforePayment(currentDraft: BookingDraft) {
    const token = getPublicToken();
    if (!token) {
      router.replace(`/login/user?returnTo=${encodeURIComponent("/checkout")}`);
      throw new Error("Silakan login sebagai buyer dulu sebelum checkout.");
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        listingId: currentDraft.product.id,
        start: currentDraft.booking.startDate,
        end: currentDraft.booking.endDate || undefined,
        qty: currentDraft.product.unit === "malam" ? 1 : currentDraft.booking.quantity,
        guestCount: currentDraft.booking.guests,
        notes: currentDraft.booking.notes,
        addons: currentDraft.addons,
        promoCode: currentDraft.promoCode,
        affiliateReference: affiliateAttribution?.code,
        affiliateAttribution,
        payMethod: "xendit",
        customer: {
          name: currentDraft.customer.fullName,
          email: currentDraft.customer.email,
          phone: currentDraft.customer.phone,
          identityNumber: currentDraft.customer.identityNumber,
        },
      }),
    });

    const json = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error(String(json?.error || json?.message || "Gagal membuat order."));
    }

    return (json.order ?? json) as ApiOrderSummary;
  }

  async function createCartOrderBeforePayment(currentCustomer: CartCheckoutCustomer) {
    const token = getPublicToken();
    if (!token) {
      router.replace(`/login/user?returnTo=${encodeURIComponent("/checkout?source=cart")}`);
      throw new Error("Silakan login sebagai buyer dulu sebelum checkout.");
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        buildCartCreateOrderRequest(
          cartItems,
          cartOrderCode,
          currentCustomer,
          affiliateAttribution ?? undefined
        )
      ),
    });

    const json = await response.json().catch(() => ({} as Record<string, unknown>));
    if (!response.ok) {
      throw new Error(String(json?.error || json?.message || "Gagal membuat order cart."));
    }

    return (json.order ?? json) as ApiOrderSummary;
  }

  async function startOrderPayment(orderCode: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderCode)}/pay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = (await response.json().catch(() => ({}))) as PaymentResponse;

    if (!response.ok || !json.ok || !json.invoiceUrl) {
      throw new Error(json.message || "Gagal membuat invoice Xendit.");
    }

    return json;
  }

  function isCanonicalOrderCode(value?: string | null) {
    return Boolean(value && (value.startsWith("ORD-") || value.startsWith("CRT-")));
  }

  async function handlePay() {
    if (!draft) {
      setError("Draft booking tidak ditemukan. Ulangi dari langkah pilih produk ya.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = getPublicToken();
      if (!token) {
        router.replace(`/login/user?returnTo=${encodeURIComponent("/checkout")}`);
        throw new Error("Silakan login sebagai buyer dulu sebelum checkout.");
      }

      const reusableOrderCode = isCanonicalOrderCode(failedPaymentCode)
        ? failedPaymentCode
        : isCanonicalOrderCode(draft.orderCode)
          ? draft.orderCode
          : null;

      const order = reusableOrderCode ? null : await createSingleOrderBeforePayment(draft);
      const activeOrderCode = reusableOrderCode ?? order?.code;
      if (!activeOrderCode) {
        throw new Error("Kode order tidak ditemukan untuk memulai pembayaran.");
      }

      const invoice = await startOrderPayment(activeOrderCode, token);

      const updatedDraft: BookingDraft = {
        ...draft,
        orderCode: activeOrderCode,
        discountAmount: order?.discountAmount ?? draft.discountAmount,
        pricing: {
          ...draft.pricing,
          total: order?.total ?? draft.pricing.total,
        },
        payment: {
          provider: "xendit",
          invoiceId: invoice.invoiceId,
          invoiceUrl: invoice.invoiceUrl,
          status: invoice.status ?? invoice.paymentStatus ?? "PENDING",
        },
      };

      saveBookingDraft(updatedDraft);
      window.location.href = invoice.invoiceUrl!;
    } catch (err) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : "Pembayaran gagal diproses.");
    }
  }

  async function handleCartPay() {
    if (cartItems.length === 0) {
      setError("Keranjang masih kosong.");
      return;
    }

    if (!isCustomerFilled(cartCustomer)) {
      setError("Lengkapi data buyer dulu sebelum checkout cart.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const token = getPublicToken();
      if (!token) {
        router.replace(`/login/user?returnTo=${encodeURIComponent("/checkout?source=cart")}`);
        throw new Error("Silakan login sebagai buyer dulu sebelum checkout.");
      }

      const reusableOrderCode = isCanonicalOrderCode(failedPaymentCode)
        ? failedPaymentCode
        : null;
      const order = reusableOrderCode ? null : await createCartOrderBeforePayment(cartCustomer);
      const activeOrderCode = reusableOrderCode ?? order?.code;
      if (!activeOrderCode) {
        throw new Error("Kode order cart tidak ditemukan untuk memulai pembayaran.");
      }

      const invoice = await startOrderPayment(activeOrderCode, token);
      window.location.href = invoice.invoiceUrl!;
    } catch (err) {
      setProcessing(false);
      setError(err instanceof Error ? err.message : "Checkout cart gagal diproses.");
    }
  }

  if (loadingDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-300">
          Lagi memuat draft checkout...
        </div>
      </div>
    );
  }

  if (isCartMode) {
    if (cartItems.length === 0) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
          <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Checkout Cart</p>
            <h1 className="mt-3 text-3xl font-black">Keranjang masih kosong</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Kembali dulu ke halaman cart atau katalog, lalu pilih item yang ingin kamu checkout.
            </p>
            <Link href="/cart" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-400">
              Kembali ke cart
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Checkout Cart</p>
              <h1 className="mt-2 text-3xl font-black">Checkout multi-item aktif</h1>
              <p className="mt-2 text-sm text-slate-300">
                Semua item di cart akan dibuat sebagai booking terpisah, tapi tetap dibayar dalam satu invoice checkout.
              </p>
            </div>
            <Link href="/cart" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
              Kembali ke cart
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-6">
              <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Kode checkout</div>
                    <div className="mt-1 font-mono font-semibold text-white">
                      {isCanonicalOrderCode(failedPaymentCode) ? failedPaymentCode : cartOrderCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Total item</div>
                    <div className="mt-1 font-medium text-white">{cartPayload.summary.totalQuantity}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const subtotal = getCartItemSubtotal(item);
                    const unitPrice = getCartItemUnitPrice(item);
                    const unitLabel = translateUnit(getCartItemUnitLabel(item));

                    return (
                      <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-col gap-4 md:flex-row">
                          <div className="relative h-36 overflow-hidden rounded-2xl border border-white/10 bg-slate-800 md:w-40 md:flex-none">
                            <Image
                              src={item.image ?? "/images/products/villa-aster.jpg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 160px"
                            />
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-3">
                            <div>
                              <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                                {kindLabel(item)}
                              </div>
                              <h2 className="mt-3 text-xl font-bold text-white">{item.name}</h2>
                              <p className="mt-1 text-sm text-slate-300">{cartScheduleLabel(item)}</p>
                              <p className="mt-1 text-sm text-slate-400">
                                {item.kind === "villa"
                                  ? `${item.pax} tamu`
                                  : item.kind === "transport"
                                    ? item.route ?? "1 rute"
                                    : `${item.hours} jam`}
                              </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <CartStat label="Harga/unit" value={`${formatRupiah(unitPrice)} / ${unitLabel}`} />
                              <CartStat label="Quantity" value={`${item.quantity}`} />
                              <CartStat label="Subtotal" value={formatRupiah(subtotal)} strong />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
                <h2 className="text-xl font-bold">Data buyer</h2>
                <p className="mt-2 text-sm text-slate-300">
                  Data ini dipakai untuk validasi akun buyer, invoice, dan snapshot booking di semua item checkout.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Nama lengkap">
                    <input
                      value={cartCustomer.fullName}
                      onChange={(event) =>
                        setCartCustomer((current) => ({ ...current, fullName: event.target.value }))
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                      placeholder="Nama pemesan"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      type="email"
                      value={cartCustomer.email}
                      onChange={(event) =>
                        setCartCustomer((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                      placeholder="nama@email.com"
                    />
                  </Field>
                  <Field label="Nomor WhatsApp">
                    <input
                      value={cartCustomer.phone}
                      onChange={(event) =>
                        setCartCustomer((current) => ({ ...current, phone: event.target.value }))
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                      placeholder="08xxxxxxxxxx"
                    />
                  </Field>
                  <Field label="Nomor identitas">
                    <input
                      value={cartCustomer.identityNumber}
                      onChange={(event) =>
                        setCartCustomer((current) => ({
                          ...current,
                          identityNumber: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 outline-none transition focus:border-emerald-400"
                      placeholder="KTP / Paspor"
                    />
                  </Field>
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
                <h2 className="text-xl font-bold">Ringkasan cart</h2>
                <div className="mt-5 space-y-3 text-sm">
                  <Row label="Jumlah baris item" value={String(cartPayload.summary.lineCount)} />
                  <Row label="Total quantity" value={String(cartPayload.summary.totalQuantity)} />
                  <Row label="Subtotal" value={formatRupiah(cartPayload.summary.subtotal)} />
                  <Row label="Biaya tambahan" value={formatRupiah(cartPayload.summary.fees)} />
                  <div className="border-t border-white/10 pt-3">
                    <Row label="Total akhir" value={formatRupiah(cartPayload.summary.total)} strong />
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-emerald-400/20 bg-emerald-500/10 p-6 text-sm leading-7 text-emerald-100 shadow-2xl">
                Checkout ini akan membuat satu kode checkout, banyak booking item, dan satu invoice Xendit. Stok tiap item dicek dulu sebelum invoice dibuat.
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleCartPay}
                disabled={processing}
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {processing ? "Membuat checkout cart..." : "Bayar cart sekarang"}
              </button>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">Checkout</p>
          <h1 className="mt-3 text-3xl font-black">Belum ada draft booking</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Kamu perlu pilih produk dan isi data booking dulu sebelum masuk ke halaman pembayaran.
          </p>
          <Link href="/booking" className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-400">
            Kembali ke booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <BookingStepper current="payment" className="mb-6" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Step 3</p>
            <h1 className="mt-2 text-3xl font-black">Pembayaran booking</h1>
            <p className="mt-2 text-sm text-slate-300">
              Setelah klik bayar, kamu akan diarahkan ke hosted payment page Xendit.
            </p>
          </div>
          <Link href={singleBackHref} className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10">
            Balik ke data booking
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Ringkasan pesanan</h2>

            <div className="mt-5 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
              <Row label="Kode booking" value={draft.orderCode} mono />
              <Row label="Produk" value={draft.product.name} />
              <Row label="Kategori" value={draft.category} />
              <Row label="Lokasi" value={draft.product.location} />
              <Row label="Jadwal" value={`${draft.booking.startDate || "-"}${draft.booking.endDate ? ` - ${draft.booking.endDate}` : ""}`} />
              <Row label="Jumlah tamu" value={String(draft.booking.guests)} />
              <Row label="Pemesan" value={draft.customer.fullName} />
              <Row label="Email" value={draft.customer.email} />
              <Row label="WhatsApp" value={draft.customer.phone} />
              {draft.booking.notes ? <Row label="Catatan buyer" value={draft.booking.notes} /> : null}
              {draft.promoCode ? <Row label="Promo" value={draft.promoCode} /> : null}
              <div className="border-t border-white/10 pt-4">
                <Row label={`Biaya ${draft.product.name}`} value={`${formatRupiah(draft.product.price)} x ${draft.booking.quantity} ${draft.product.unit}`} />
                {draft.addons.filter((addon) => addon.enabled).map((addon) => (
                  <Row key={addon.key} label={addon.label} value={formatRupiah(addon.price)} />
                ))}
                <Row label="Subtotal" value={formatRupiah(draft.pricing.subtotal)} />
                <Row label="Add-on" value={formatRupiah(draft.pricing.addonTotal)} />
                {draft.discountAmount ? <Row label="Diskon" value={`- ${formatRupiah(draft.discountAmount)}`} /> : null}
                <div className="mt-4 flex items-center justify-between text-base font-bold">
                  <span>Total bayar</span>
                  <span>{formatRupiah(draft.pricing.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm leading-7 text-emerald-100">
              Payment gateway sekarang disiapkan pakai Xendit. Saat credential sandbox sudah kamu isi, tombol bayar di bawah akan bikin invoice lalu redirect ke halaman pembayarannya.
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
            <h2 className="text-xl font-bold">Bayar dengan Xendit</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Flow checkout ini sekarang membuat order ke API lebih dulu, jadi transaksi langsung tercatat ke admin, seller, dan buyer sebelum pembayaran diproses.
            </p>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm">
              <Row label="Gateway" value="Xendit" />
              <Row label="Mode" value="Sandbox-ready" />
              <Row label="Status draft" value={draft.payment?.status ?? "Belum dibayar"} />
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <button type="button" onClick={handlePay} disabled={processing} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300">
              {processing ? "Membuat invoice Xendit..." : "Bayar sekarang"}
            </button>

            {draft.payment?.invoiceUrl ? (
              <a href={draft.payment.invoiceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10">
                Buka invoice yang terakhir dibuat
              </a>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-300">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CartStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${strong ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-2 text-sm ${strong ? "font-bold text-emerald-100" : "font-semibold text-white"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-300">{label}</span>
      <span className={`${mono ? "font-mono" : ""} ${strong ? "font-bold" : "font-medium"} text-right text-white`}>
        {value}
      </span>
    </div>
  );
}
