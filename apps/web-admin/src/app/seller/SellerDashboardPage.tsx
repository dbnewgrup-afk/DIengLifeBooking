"use client";

import Link from "next/link";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/constants";
import { clearToken, getToken } from "@/lib/auth/session";
import { resolveLoginPathForRole } from "@/lib/auth/role-routing";

type Summary = {
  bookingsToday: number;
  checkinsToday: number;
  checkoutsToday: number;
  pendingPayments: number;
  activeTransportSlots: number;
  activeDocsJobs: number;
  latestActivities: Array<{ id: string; text: string; ago: string }>;
};

type Balance = {
  balance: number;
  available: number;
  pending: number;
  nextCutoff: string;
};

type WithdrawRow = {
  id: string;
  createdAt: string;
  amount: number;
  status: string;
  note?: string;
};

type WithdrawRequest = {
  id: string;
  createdAt: string;
  amount: number;
  target: { bank: string; accNo: string; accName: string };
  status: string;
};

type WalletTransactionRow = {
  id: string;
  createdAt: string;
  type: string;
  status: string;
  amount: number;
  direction: "IN" | "OUT" | "HOLD";
  description?: string | null;
  referenceCode?: string | null;
};

type DashboardNotice = {
  id: string;
  title: string;
  body: string;
  audience: "SELLER" | "AFFILIATE" | "ALL_USERS";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type BookingRow = {
  id: string;
  code: string;
  ownerId: string;
  ownerName: string;
  dateISO: string;
  guest: string;
  quantity?: number;
  guestCount?: number;
  notes?: string | null;
  revenue: number;
  status: string;
  paymentStatus: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  soldCount: number;
};

type ProductResponse = {
  ok?: boolean;
  balance?: Balance;
  items?: ProductRow[];
};

type FeedbackState = {
  tone: "success" | "error";
  text: string;
};

type LoadState = "loading" | "ready" | "error";
type SectionKey = "summary" | "balance" | "bookings" | "products" | "requests" | "payouts" | "wallet" | "notices";
type SectionMeta = Record<SectionKey, { state: LoadState; error?: string }>;

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function createSectionMeta(state: LoadState): SectionMeta {
  return {
    summary: { state },
    balance: { state },
    bookings: { state },
    products: { state },
    requests: { state },
    payouts: { state },
    wallet: { state },
    notices: { state },
  };
}

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : dateFormatter.format(parsed);
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : dateTimeFormatter.format(parsed);
}

function toErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
  }
  return fallback;
}

async function readJsonResponse<T>(response: Response, fallback: string) {
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, fallback));
  }

  return payload as T;
}

async function requestJson<T>(path: string, token: string, fallback: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  return readJsonResponse<T>(response, fallback);
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [payouts, setPayouts] = useState<WithdrawRow[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionRow[]>([]);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [sectionMeta, setSectionMeta] = useState<SectionMeta>(() => createSectionMeta("loading"));
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accNo, setAccNo] = useState("");
  const [accName, setAccName] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, booking) => sum + booking.revenue, 0),
    [bookings],
  );

  const totalOrders = bookings.length;

  const topProduct = useMemo(
    () => [...products].sort((left, right) => right.soldCount - left.soldCount)[0] ?? null,
    [products],
  );

  const categoryPerformance = useMemo(() => {
    const map = new Map<string, { category: string; revenue: number; sold: number }>();

    for (const product of products) {
      const current = map.get(product.category) ?? {
        category: product.category,
        revenue: 0,
        sold: 0,
      };

      current.sold += product.soldCount;
      current.revenue += product.price * product.soldCount;
      map.set(product.category, current);
    }

    return Array.from(map.values()).sort((left, right) => right.revenue - left.revenue);
  }, [products]);

  const amountNumber = Number(amount);
  const withdrawFormComplete =
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    bank.trim().length >= 2 &&
    accNo.trim().length >= 4 &&
    accName.trim().length >= 2;

  const sectionErrorCount = useMemo(
    () => Object.values(sectionMeta).filter((entry) => entry.state === "error").length,
    [sectionMeta],
  );

  const loadAll = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    setSectionMeta(createSectionMeta("loading"));

    if (mode === "initial") {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    const token = getToken();
    if (!token) {
      const missingSessionMessage = "Sesi seller tidak ditemukan. Silakan login ulang.";
      setSummary(null);
      setBalance(null);
      setBookings([]);
      setProducts([]);
      setRequests([]);
      setPayouts([]);
      setNotices([]);
      setSectionMeta({
        summary: { state: "error", error: missingSessionMessage },
        balance: { state: "error", error: missingSessionMessage },
        bookings: { state: "error", error: missingSessionMessage },
        products: { state: "error", error: missingSessionMessage },
        requests: { state: "error", error: missingSessionMessage },
        payouts: { state: "error", error: missingSessionMessage },
        wallet: { state: "error", error: missingSessionMessage },
        notices: { state: "error", error: missingSessionMessage },
      });
      setFeedback({ tone: "error", text: missingSessionMessage });
      setIsBootstrapping(false);
      setIsRefreshing(false);
      return;
    }

      const results = await Promise.allSettled([
        requestJson<Summary>("/reports/seller/me", token, "Gagal memuat ringkasan seller."),
      requestJson<Balance>("/seller/balance", token, "Gagal memuat saldo seller."),
      requestJson<WithdrawRow[]>("/seller/payouts?limit=20", token, "Gagal memuat riwayat payout."),
      requestJson<WalletTransactionRow[]>(
        "/seller/wallet-transactions?limit=20",
        token,
        "Gagal memuat ledger wallet seller."
      ),
      requestJson<WithdrawRequest[]>(
        "/seller/requests?limit=20",
        token,
        "Gagal memuat permintaan withdraw.",
      ),
      requestJson<BookingRow[]>("/seller/bookings?limit=500", token, "Gagal memuat booking seller."),
      requestJson<ProductResponse>("/seller/products", token, "Gagal memuat produk seller."),
      requestJson<{ items?: DashboardNotice[] }>(
        "/dashboard-control/notices/me",
        token,
        "Gagal memuat notice dashboard seller."
      ),
    ]);

    const [
      summaryResult,
      balanceResult,
      payoutsResult,
      walletResult,
      requestsResult,
      bookingsResult,
      productsResult,
      noticesResult,
    ] = results;

    const nextMeta = createSectionMeta("ready");

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value);
    } else {
      setSummary(null);
      nextMeta.summary = {
        state: "error",
        error: toErrorMessage(summaryResult.reason, "Gagal memuat ringkasan seller."),
      };
    }

    if (balanceResult.status === "fulfilled") {
      setBalance(balanceResult.value);
    } else {
      setBalance(null);
      nextMeta.balance = {
        state: "error",
        error: toErrorMessage(balanceResult.reason, "Gagal memuat saldo seller."),
      };
    }

    if (payoutsResult.status === "fulfilled") {
      setPayouts(Array.isArray(payoutsResult.value) ? payoutsResult.value : []);
    } else {
      setPayouts([]);
      nextMeta.payouts = {
        state: "error",
        error: toErrorMessage(payoutsResult.reason, "Gagal memuat riwayat payout."),
      };
    }

    if (walletResult.status === "fulfilled") {
      setWalletTransactions(Array.isArray(walletResult.value) ? walletResult.value : []);
    } else {
      setWalletTransactions([]);
      nextMeta.wallet = {
        state: "error",
        error: toErrorMessage(walletResult.reason, "Gagal memuat ledger wallet seller."),
      };
    }

    if (requestsResult.status === "fulfilled") {
      setRequests(Array.isArray(requestsResult.value) ? requestsResult.value : []);
    } else {
      setRequests([]);
      nextMeta.requests = {
        state: "error",
        error: toErrorMessage(requestsResult.reason, "Gagal memuat permintaan withdraw."),
      };
    }

    if (bookingsResult.status === "fulfilled") {
      setBookings(Array.isArray(bookingsResult.value) ? bookingsResult.value : []);
    } else {
      setBookings([]);
      nextMeta.bookings = {
        state: "error",
        error: toErrorMessage(bookingsResult.reason, "Gagal memuat booking seller."),
      };
    }

    if (productsResult.status === "fulfilled") {
      setProducts(Array.isArray(productsResult.value?.items) ? productsResult.value.items : []);
    } else {
      setProducts([]);
      nextMeta.products = {
        state: "error",
        error: toErrorMessage(productsResult.reason, "Gagal memuat produk seller."),
      };
    }

    if (noticesResult.status === "fulfilled") {
      setNotices(Array.isArray(noticesResult.value?.items) ? noticesResult.value.items : []);
    } else {
      setNotices([]);
      nextMeta.notices = {
        state: "error",
        error: toErrorMessage(noticesResult.reason, "Gagal memuat notice dashboard seller."),
      };
    }

    setSectionMeta(nextMeta);
    setIsBootstrapping(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void loadAll("initial");
  }, [loadAll]);

  async function submitWithdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const token = getToken();
    if (!token) {
      setFeedback({
        tone: "error",
        text: "Sesi seller tidak ditemukan. Silakan login ulang.",
      });
      return;
    }

    if (!withdrawFormComplete) {
      setFeedback({
        tone: "error",
        text: "Lengkapi nominal, bank, nomor rekening, dan nama rekening terlebih dahulu.",
      });
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      const response = await fetch(`${API_BASE_URL}/seller/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amountNumber,
          target: {
            bank: bank.trim(),
            accNo: accNo.trim(),
            accName: accName.trim(),
          },
        }),
      });

      const createdRequest = await readJsonResponse<WithdrawRequest>(
        response,
        "Gagal mengirim withdraw.",
      );

      setFeedback({
        tone: "success",
        text: `Withdraw ${formatCurrency(createdRequest.amount)} berhasil diajukan dan sedang menunggu approval admin.`,
      });
      setAmount("");
      setBank("");
      setAccNo("");
      setAccName("");
      await loadAll("refresh");
    } catch (error) {
      setFeedback({
        tone: "error",
        text: toErrorMessage(error, "Gagal mengirim withdraw."),
      });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  }

  async function exportReport(type: "bookings" | "performance", format: "csv" | "excel") {
    const token = getToken();
    if (!token) {
      setFeedback({
        tone: "error",
        text: "Sesi seller tidak ditemukan. Silakan login ulang.",
      });
      return;
    }

    const currentExportKey = `${type}-${format}`;
    setExportingKey(currentExportKey);
    setFeedback(null);

    try {
        const response = await fetch(
          `${API_BASE_URL}/reports/seller/export?type=${type}&format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(extractErrorMessage(payload, "Gagal export laporan seller."));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `seller-${type}.${format === "excel" ? "xls" : "csv"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: toErrorMessage(error, "Gagal export laporan seller."),
      });
    } finally {
      setExportingKey(null);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/clear-cookie", { method: "POST" });
    } finally {
      clearToken();
      router.replace(resolveLoginPathForRole("SELLER"));
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:px-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-900 bg-slate-950 text-white shadow-[0_32px_80px_rgba(15,23,42,0.24)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)] lg:p-8">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">
                Seller Dashboard
              </p>
              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight lg:text-4xl">
                  Ringkasan order, saldo, booking, dan withdraw seller dari backend real
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-300 lg:text-[15px]">
                  Semua angka di halaman ini diambil dari endpoint seller dan report yang aktif.
                  Saat backend mengembalikan kosong, dashboard menampilkan empty state yang benar
                  tanpa angka perkiraan atau fallback palsu.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">
                    Status sinkronisasi
                  </p>
                  <ul className="space-y-2 text-sm leading-6 text-slate-200">
                    <li>Summary, saldo, booking, produk, payout, dan withdraw dibaca langsung dari backend.</li>
                    <li>Ringkasan pendapatan dan total order dihitung dari booking seller real.</li>
                    <li>Withdraw submit langsung ke endpoint seller request dan refresh saldo setelah sukses.</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Keluar..." : "Logout"}
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/seller/reset-password"
                  className={secondaryButtonClassName}
                >
                  Reset password saya
                </Link>
                <button
                  type="button"
                  onClick={() => void loadAll("refresh")}
                  disabled={isBootstrapping || isRefreshing}
                  className={secondaryButtonClassName}
                >
                  {isBootstrapping ? "Memuat data..." : isRefreshing ? "Menyegarkan..." : "Refresh data"}
                </button>
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
                  {sectionErrorCount === 0
                    ? "Semua section seller memakai request real."
                    : `${sectionErrorCount} section masih gagal dimuat dari backend.`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {feedback ? <Banner tone={feedback.tone} text={feedback.text} /> : null}

        {isRefreshing ? (
          <Banner
            tone="info"
            text="Dashboard seller sedang menyegarkan data real dari backend."
          />
        ) : null}

        {sectionErrorCount > 0 ? (
          <Banner
            tone="error"
            text="Sebagian data seller gagal dimuat. Section terkait menampilkan error state sampai request backend berhasil lagi."
          />
        ) : null}

        {sectionMeta.notices.state === "error" || notices.length > 0 ? (
          <PanelCard
            title="Notice admin untuk seller"
            description="Panel ini dipakai admin dan super admin untuk mengirim instruksi operasional atau konten dashboard khusus seller."
          >
            {sectionMeta.notices.state === "error" ? (
              <StateNotice tone="error" title="Notice seller gagal dimuat">
                {sectionMeta.notices.error}
              </StateNotice>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <article
                    key={notice.id}
                    className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700">
                          {notice.audience}
                        </div>
                        <h3 className="mt-3 text-base font-bold text-slate-950">{notice.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notice.body}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>Update {formatDateTime(notice.updatedAt)}</div>
                        <div>
                          Window {formatDateTime(notice.startsAt)} - {formatDateTime(notice.endsAt)}
                        </div>
                      </div>
                    </div>
                    {notice.ctaLabel && notice.ctaHref ? (
                      <a
                        href={notice.ctaHref}
                        className="mt-4 inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700"
                      >
                        {notice.ctaLabel}
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </PanelCard>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <MetricCard
            label="Total order"
            value={String(totalOrders)}
            status={sectionMeta.bookings.state}
            helper="Dihitung dari booking seller real yang berhasil dimuat."
            error={sectionMeta.bookings.error}
          />
          <MetricCard
            label="Pendapatan"
            value={formatCurrency(totalRevenue)}
            status={sectionMeta.bookings.state}
            helper="Akumulasi revenue booking seller real yang berhasil dimuat."
            error={sectionMeta.bookings.error}
          />
          <MetricCard
            label="Booking hari ini"
            value={String(summary?.bookingsToday ?? 0)}
            status={sectionMeta.summary.state}
            helper="Data ringkasan harian seller."
            error={sectionMeta.summary.error}
          />
          <MetricCard
            label="Pending bayar"
            value={String(summary?.pendingPayments ?? 0)}
            status={sectionMeta.summary.state}
            helper="Booking seller dengan payment masih pending."
            error={sectionMeta.summary.error}
          />
          <MetricCard
            label="Saldo tersedia"
            value={formatCurrency(balance?.available ?? 0)}
            status={sectionMeta.balance.state}
            helper="Saldo real yang saat ini bisa ditarik."
            error={sectionMeta.balance.error}
          />
          <MetricCard
            label="Saldo pending"
            value={formatCurrency(balance?.pending ?? 0)}
            status={sectionMeta.balance.state}
            helper="Saldo seller yang masih tertahan atau reserved."
            error={sectionMeta.balance.error}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <PanelCard
            title="Operasional seller hari ini"
            description="Ringkasan operasional harian seller untuk check-in, check-out, dan unit transport aktif."
          >
            {sectionMeta.summary.state === "error" ? (
              <StateNotice tone="error" title="Ringkasan seller gagal dimuat">
                {sectionMeta.summary.error}
              </StateNotice>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <MiniMetric
                    label="Check-in hari ini"
                    value={String(summary?.checkinsToday ?? 0)}
                    status={sectionMeta.summary.state}
                  />
                  <MiniMetric
                    label="Check-out hari ini"
                    value={String(summary?.checkoutsToday ?? 0)}
                    status={sectionMeta.summary.state}
                  />
                  <MiniMetric
                    label="Transport aktif"
                    value={String(summary?.activeTransportSlots ?? 0)}
                    status={sectionMeta.summary.state}
                  />
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Aktivitas terbaru seller</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Aktivitas di bawah ini datang langsung dari ringkasan backend seller.
                      </p>
                    </div>
                    <SectionBadge text={summary?.latestActivities.length ? "Real activity feed" : "Empty state"} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {sectionMeta.summary.state === "loading" ? (
                      <StateNotice tone="loading" title="Memuat aktivitas seller">
                        Request ringkasan seller sedang berjalan.
                      </StateNotice>
                    ) : summary?.latestActivities.length ? (
                      summary.latestActivities.map((activity) => (
                        <article
                          key={activity.id}
                          className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <p className="text-sm font-medium text-slate-900">{activity.text}</p>
                          <p className="mt-1 text-xs text-slate-500">{activity.ago}</p>
                        </article>
                      ))
                    ) : (
                      <StateNotice tone="empty" title="Belum ada aktivitas seller">
                        Backend belum mengembalikan aktivitas terbaru untuk seller ini.
                      </StateNotice>
                    )}
                  </div>
                </div>
              </>
            )}
          </PanelCard>

          <PanelCard
            title="Saldo seller dan withdraw"
            description="Saldo seller, saldo bisa ditarik, cutoff berikutnya, dan form withdraw semuanya terhubung ke backend real."
          >
            {sectionMeta.balance.state === "error" ? (
              <StateNotice tone="error" title="Saldo seller gagal dimuat">
                {sectionMeta.balance.error}
              </StateNotice>
            ) : (
              <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <DetailRow label="Saldo seller" value={formatCurrency(balance?.balance ?? 0)} />
                <DetailRow label="Saldo bisa ditarik" value={formatCurrency(balance?.available ?? 0)} />
                <DetailRow label="Saldo pending" value={formatCurrency(balance?.pending ?? 0)} />
                <DetailRow
                  label="Cutoff berikutnya"
                  value={balance?.nextCutoff ? formatDateTime(balance.nextCutoff) : "-"}
                />
              </div>
            )}

            <div className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Ajukan withdraw</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Form ini mengirim nominal, bank, nomor rekening, dan nama rekening ke endpoint real seller withdraw request.
                  </p>
                </div>
                <SectionBadge
                  text={sectionMeta.balance.state === "ready" ? "Real submit enabled" : "Backend balance belum siap"}
                />
              </div>

              <form className="mt-5 grid gap-4" onSubmit={submitWithdraw}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="Nominal withdraw">
                    <input
                      type="number"
                      min={1}
                      max={balance?.available}
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Masukkan nominal"
                      className={inputClassName}
                    />
                  </FieldBlock>
                  <FieldBlock label="Bank tujuan">
                    <input
                      value={bank}
                      onChange={(event) => setBank(event.target.value)}
                      placeholder="Nama bank tujuan"
                      className={inputClassName}
                    />
                  </FieldBlock>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="Nomor rekening">
                    <input
                      value={accNo}
                      onChange={(event) => setAccNo(event.target.value)}
                      placeholder="Nomor rekening tujuan"
                      className={inputClassName}
                    />
                  </FieldBlock>
                  <FieldBlock label="Nama rekening">
                    <input
                      value={accName}
                      onChange={(event) => setAccName(event.target.value)}
                      placeholder="Nama pemilik rekening"
                      className={inputClassName}
                    />
                  </FieldBlock>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <div>
                    {sectionMeta.balance.state === "ready"
                      ? `Saldo real yang bisa ditarik saat ini ${formatCurrency(balance?.available ?? 0)}.`
                      : "Saldo belum bisa diverifikasi karena endpoint balance belum berhasil dimuat."}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      isSubmittingWithdraw ||
                      sectionMeta.balance.state !== "ready" ||
                      !withdrawFormComplete
                    }
                    className={primaryButtonClassName}
                  >
                    {isSubmittingWithdraw ? "Mengirim..." : "Ajukan withdraw"}
                  </button>
                </div>
              </form>
            </div>
          </PanelCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <PanelCard
            title="Permintaan withdraw seller"
            description="Daftar request withdraw terbaru yang berasal dari endpoint seller requests."
          >
            {sectionMeta.requests.state === "error" ? (
              <StateNotice tone="error" title="Permintaan withdraw gagal dimuat">
                {sectionMeta.requests.error}
              </StateNotice>
            ) : sectionMeta.requests.state === "loading" ? (
              <StateNotice tone="loading" title="Memuat permintaan withdraw">
                Request data real sedang berjalan.
              </StateNotice>
            ) : requests.length === 0 ? (
              <StateNotice tone="empty" title="Belum ada permintaan withdraw">
                Seller ini belum memiliki request withdraw di backend.
              </StateNotice>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(request.amount)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {request.target.bank} � {request.target.accNo} � {request.target.accName}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">{formatDateTime(request.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Ledger wallet seller"
            description="Semua perpindahan saldo seller ditrace di sini: escrow booking masuk, release ke available, reserve withdraw, sampai withdraw paid."
          >
            <DataTable
              columns={["Tanggal", "Arah", "Tipe", "Status", "Referensi", "Nominal"]}
              state={sectionMeta.wallet.state}
              error={sectionMeta.wallet.error}
              emptyTitle="Belum ada ledger wallet"
              emptyDescription="Backend belum mengembalikan jejak pergerakan saldo seller."
            >
              {walletTransactions.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-200">
                  <DataCell>{formatDateTime(entry.createdAt)}</DataCell>
                  <DataCell>
                    <StatusBadge status={entry.direction} />
                  </DataCell>
                  <DataCell>
                    <div className="font-semibold text-slate-900">{entry.type}</div>
                    {entry.description ? (
                      <div className="mt-1 text-xs text-slate-500">{entry.description}</div>
                    ) : null}
                  </DataCell>
                  <DataCell>
                    <StatusBadge status={entry.status} />
                  </DataCell>
                  <DataCell>{entry.referenceCode || "-"}</DataCell>
                  <DataCell align="right">{formatCurrency(entry.amount)}</DataCell>
                </tr>
              ))}
            </DataTable>
          </PanelCard>

          <PanelCard
            title="Ringkasan performa seller"
            description="Performa di bawah ini memakai booking dan produk seller real, lalu diekspor lewat endpoint report seller."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <MiniMetric
                label="Total order"
                value={String(totalOrders)}
                status={sectionMeta.bookings.state}
              />
              <MiniMetric
                label="Pendapatan"
                value={formatCurrency(totalRevenue)}
                status={sectionMeta.bookings.state}
              />
              <MiniMetric
                label="Produk terlaris"
                value={topProduct ? topProduct.name : "Belum ada"}
                status={
                  sectionMeta.products.state === "error"
                    ? "error"
                    : sectionMeta.products.state === "loading"
                      ? "loading"
                      : "ready"
                }
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void exportReport("bookings", "csv")}
                disabled={exportingKey !== null}
                className={secondaryButtonClassName}
              >
                {exportingKey === "bookings-csv" ? "Exporting..." : "Export booking CSV"}
              </button>
              <button
                type="button"
                onClick={() => void exportReport("performance", "excel")}
                disabled={exportingKey !== null}
                className={secondaryButtonClassName}
              >
                {exportingKey === "performance-excel" ? "Exporting..." : "Export performa Excel"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {sectionMeta.products.state === "error" ? (
                <StateNotice tone="error" title="Performa kategori belum tersedia">
                  {sectionMeta.products.error}
                </StateNotice>
              ) : sectionMeta.products.state === "loading" ? (
                <StateNotice tone="loading" title="Menghitung performa kategori">
                  Data produk seller real sedang dimuat.
                </StateNotice>
              ) : categoryPerformance.length === 0 ? (
                <StateNotice tone="empty" title="Belum ada performa kategori">
                  Backend belum mengembalikan produk aktif atau penjualan seller.
                </StateNotice>
              ) : (
                categoryPerformance.map((item) => (
                  <article
                    key={item.category}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                      <p className="mt-1 text-xs text-slate-500">Terjual {item.sold}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(item.revenue)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </PanelCard>
        </div>

        <PanelCard
          title="Produk seller"
          description="Daftar produk seller yang tampil di sini berasal langsung dari endpoint seller products."
        >
          <DataTable
            columns={["Produk", "Kategori", "Status", "Harga", "Terjual"]}
            state={sectionMeta.products.state}
            error={sectionMeta.products.error}
            emptyTitle="Belum ada produk seller"
            emptyDescription="Backend belum mengembalikan item produk untuk seller ini."
          >
            {products.map((product) => (
              <tr key={product.id} className="border-t border-slate-200">
                <DataCell>
                  <div className="font-semibold text-slate-900">{product.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{product.id}</div>
                </DataCell>
                <DataCell>{product.category}</DataCell>
                <DataCell>
                  <StatusBadge status={product.status} />
                </DataCell>
                <DataCell align="right">{formatCurrency(product.price)}</DataCell>
                <DataCell align="right">{String(product.soldCount)}</DataCell>
              </tr>
            ))}
          </DataTable>
        </PanelCard>

        <PanelCard
          title="Booking seller"
          description="Semua booking di tabel ini dibaca dari endpoint seller bookings. Total order dan pendapatan dashboard diturunkan dari data yang sama."
        >
          <DataTable
            columns={["Kode", "Produk", "Guest", "Tanggal", "Status", "Total"]}
            state={sectionMeta.bookings.state}
            error={sectionMeta.bookings.error}
            emptyTitle="Belum ada booking seller"
            emptyDescription="Backend belum mengembalikan booking untuk seller ini."
          >
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-slate-200">
                <DataCell>
                  <div className="font-semibold text-slate-900">{booking.code}</div>
                  <div className="mt-1 text-xs text-slate-500">{booking.id}</div>
                </DataCell>
                <DataCell>{booking.ownerName}</DataCell>
                <DataCell>
                  <div>{booking.guest}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {booking.quantity ? `Qty ${booking.quantity}` : "Qty belum ada"}
                    {booking.guestCount ? ` • ${booking.guestCount} tamu` : ""}
                  </div>
                  {booking.notes ? (
                    <div className="mt-1 text-xs text-slate-500">Catatan: {booking.notes}</div>
                  ) : null}
                </DataCell>
                <DataCell>{formatDate(booking.dateISO)}</DataCell>
                <DataCell>
                  <div className="flex flex-col gap-2">
                    <StatusBadge status={booking.paymentStatus} />
                    <span className="text-xs text-slate-500">{booking.status}</span>
                  </div>
                </DataCell>
                <DataCell align="right">{formatCurrency(booking.revenue)}</DataCell>
              </tr>
            ))}
          </DataTable>
        </PanelCard>

        <PanelCard
          title="Riwayat payout"
          description="Riwayat payout di bawah ini memakai endpoint seller payouts real. Jika kosong, seller memang belum punya payout yang tercatat."
        >
          <DataTable
            columns={["Tanggal", "Status", "Catatan", "Nominal"]}
            state={sectionMeta.payouts.state}
            error={sectionMeta.payouts.error}
            emptyTitle="Belum ada riwayat payout"
            emptyDescription="Backend belum mengembalikan payout untuk seller ini."
          >
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-t border-slate-200">
                <DataCell>{formatDate(payout.createdAt)}</DataCell>
                <DataCell>
                  <StatusBadge status={payout.status} />
                </DataCell>
                <DataCell>{payout.note || "Tidak ada catatan"}</DataCell>
                <DataCell align="right">{formatCurrency(payout.amount)}</DataCell>
              </tr>
            ))}
          </DataTable>
        </PanelCard>
      </div>
    </div>
  );
}

function PanelCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  status,
  helper,
  error,
}: {
  label: string;
  value: string;
  status: LoadState;
  helper: string;
  error?: string;
}) {
  const displayValue =
    status === "loading" ? "Memuat..." : status === "error" ? "Tidak tersedia" : value;

  const displayHelper =
    status === "loading"
      ? "Request data real sedang berjalan."
      : status === "error"
        ? error || "Request gagal."
        : helper;

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p
        className={`mt-3 text-2xl font-black ${
          status === "error" ? "text-rose-700" : "text-slate-950"
        }`}
      >
        {displayValue}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{displayHelper}</p>
    </article>
  );
}

function MiniMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: LoadState;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-slate-950">
        {status === "loading" ? "Memuat..." : status === "error" ? "Tidak tersedia" : value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] bg-white px-4 py-3 shadow-sm">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionBadge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
      {text}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const palette =
    normalized.includes("PAID") ||
    normalized.includes("APPROVED") ||
    normalized.includes("SUCCESS") ||
    normalized.includes("COMPLETED")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("PENDING") || normalized.includes("REVIEW")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : normalized.includes("FAILED") || normalized.includes("REJECT")
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${palette}`}
    >
      {status}
    </span>
  );
}

function DataTable({
  columns,
  state,
  error,
  emptyTitle,
  emptyDescription,
  children,
}: {
  columns: string[];
  state: LoadState;
  error?: string;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  if (state === "error") {
    return (
      <StateNotice tone="error" title="Section gagal dimuat">
        {error}
      </StateNotice>
    );
  }

  if (state === "loading") {
    return (
      <StateNotice tone="loading" title="Memuat data real">
        Request ke backend sedang berjalan.
      </StateNotice>
    );
  }

  const rows = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  if (rows.length === 0) {
    return (
      <StateNotice tone="empty" title={emptyTitle}>
        {emptyDescription}
      </StateNotice>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-slate-200">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">{children}</tbody>
      </table>
    </div>
  );
}

function DataCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={`px-4 py-3 align-top text-sm text-slate-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

function StateNotice({
  tone,
  title,
  children,
}: {
  tone: "loading" | "empty" | "error";
  title: string;
  children: ReactNode;
}) {
  const palette =
    tone === "error"
      ? "border-rose-200 bg-rose-50 text-rose-800"
      : tone === "loading"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-[24px] border px-5 py-4 ${palette}`}>
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
  );
}

function Banner({
  tone,
  text,
}: {
  tone: "success" | "error" | "info";
  text: string;
}) {
  const palette =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "info"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  return (
    <div
      role="alert"
      className={`rounded-[24px] border px-4 py-3 text-sm font-semibold shadow-sm ${palette}`}
    >
      {text}
    </div>
  );
}


