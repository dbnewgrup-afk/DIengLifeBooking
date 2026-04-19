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

type AffiliateOverview = {
  profile: {
    id: string;
    code: string;
    name: string;
    legalName?: string | null;
    bio?: string | null;
    email: string;
    phone?: string | null;
    isActive: boolean;
    commissionRatePercent: number;
    joinedAt: string;
  };
  summary: {
    clicks: number;
    leads: number;
    conversions: number;
    commissionPending: number;
    commissionPayable: number;
    attributedRevenue: number;
    totalDiscount: number;
    reservedWithdrawAmount: number;
    paidOutAmount: number;
  };
  timeseries: Array<{
    date: string;
    clicks: number;
    leads: number;
    conversions: number;
    commission: number;
  }>;
};

type AffiliateLinkRow = {
  id: string;
  label: string;
  description: string;
  url: string;
  code: string;
};

type AffiliateActivityRow = {
  id: string;
  kind: "CLICK" | "LEAD" | "CONVERSION";
  createdAt: string;
  title: string;
  detail: string;
  amount: number;
  status: string;
};

type AffiliateBalance = {
  balance: number;
  available: number;
  pending: number;
  paidOut: number;
  nextCutoff: string;
};

type AffiliateWithdrawRequest = {
  id: string;
  createdAt: string;
  amount: number;
  target: { bank: string; accNo: string; accName: string };
  status: string;
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

type LoadState = "loading" | "ready" | "error";
type SectionKey = "overview" | "links" | "activity" | "balance" | "withdraws" | "notices";
type SectionMeta = Record<SectionKey, { state: LoadState; error?: string }>;
type FeedbackState = {
  tone: "success" | "error";
  text: string;
};

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
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100";

const primaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-200";

const secondaryButtonClassName =
  "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

const AFFILIATE_WITHDRAW_MINIMUM_AMOUNT = 1_000_000;

function createSectionMeta(state: LoadState): SectionMeta {
  return {
    overview: { state },
    links: { state },
    activity: { state },
    balance: { state },
    withdraws: { state },
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

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<AffiliateOverview | null>(null);
  const [links, setLinks] = useState<AffiliateLinkRow[]>([]);
  const [activity, setActivity] = useState<AffiliateActivityRow[]>([]);
  const [balance, setBalance] = useState<AffiliateBalance | null>(null);
  const [withdraws, setWithdraws] = useState<AffiliateWithdrawRequest[]>([]);
  const [notices, setNotices] = useState<DashboardNotice[]>([]);
  const [sectionMeta, setSectionMeta] = useState<SectionMeta>(() => createSectionMeta("loading"));
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [accNo, setAccNo] = useState("");
  const [accName, setAccName] = useState("");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const amountNumber = Number(amount);
  const withdrawMeetsMinimum =
    Number.isFinite(amountNumber) && amountNumber >= AFFILIATE_WITHDRAW_MINIMUM_AMOUNT;
  const withdrawFormComplete =
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    bank.trim().length >= 2 &&
    accNo.trim().length >= 4 &&
    accName.trim().length >= 2;

  const sectionErrorCount = useMemo(
    () => Object.values(sectionMeta).filter((entry) => entry.state === "error").length,
    [sectionMeta]
  );

  const loadAll = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    setSectionMeta(createSectionMeta("loading"));
    setFeedback(null);

    if (mode === "initial") {
      setIsBootstrapping(true);
    } else {
      setIsRefreshing(true);
    }

    const token = getToken();
    if (!token) {
      const message = "Sesi affiliate tidak ditemukan. Silakan login ulang.";
      setOverview(null);
      setLinks([]);
      setActivity([]);
      setBalance(null);
      setWithdraws([]);
      setNotices([]);
      setSectionMeta({
        overview: { state: "error", error: message },
        links: { state: "error", error: message },
        activity: { state: "error", error: message },
        balance: { state: "error", error: message },
        withdraws: { state: "error", error: message },
        notices: { state: "error", error: message },
      });
      setFeedback({ tone: "error", text: message });
      setIsBootstrapping(false);
      setIsRefreshing(false);
      return;
    }

    const results = await Promise.allSettled([
      requestJson<AffiliateOverview>("/affiliates/me/overview", token, "Gagal memuat overview affiliate."),
      requestJson<{ items?: AffiliateLinkRow[] }>(
        "/affiliates/me/links",
        token,
        "Gagal memuat link campaign affiliate."
      ),
      requestJson<{ items?: AffiliateActivityRow[] }>(
        "/affiliates/me/activity?limit=30",
        token,
        "Gagal memuat aktivitas affiliate."
      ),
      requestJson<AffiliateBalance>("/affiliates/me/balance", token, "Gagal memuat saldo affiliate."),
      requestJson<AffiliateWithdrawRequest[]>(
        "/affiliates/me/withdraws?limit=20",
        token,
        "Gagal memuat request withdraw affiliate."
      ),
      requestJson<{ items?: DashboardNotice[] }>(
        "/dashboard-control/notices/me",
        token,
        "Gagal memuat notice dashboard affiliate."
      ),
    ]);

    const [overviewResult, linksResult, activityResult, balanceResult, withdrawsResult, noticesResult] = results;
    const nextMeta = createSectionMeta("ready");

    if (overviewResult.status === "fulfilled") {
      setOverview(overviewResult.value);
    } else {
      setOverview(null);
      nextMeta.overview = {
        state: "error",
        error: toErrorMessage(overviewResult.reason, "Gagal memuat overview affiliate."),
      };
    }

    if (linksResult.status === "fulfilled") {
      setLinks(Array.isArray(linksResult.value.items) ? linksResult.value.items : []);
    } else {
      setLinks([]);
      nextMeta.links = {
        state: "error",
        error: toErrorMessage(linksResult.reason, "Gagal memuat link campaign affiliate."),
      };
    }

    if (activityResult.status === "fulfilled") {
      setActivity(Array.isArray(activityResult.value.items) ? activityResult.value.items : []);
    } else {
      setActivity([]);
      nextMeta.activity = {
        state: "error",
        error: toErrorMessage(activityResult.reason, "Gagal memuat aktivitas affiliate."),
      };
    }

    if (balanceResult.status === "fulfilled") {
      setBalance(balanceResult.value);
    } else {
      setBalance(null);
      nextMeta.balance = {
        state: "error",
        error: toErrorMessage(balanceResult.reason, "Gagal memuat saldo affiliate."),
      };
    }

    if (withdrawsResult.status === "fulfilled") {
      setWithdraws(Array.isArray(withdrawsResult.value) ? withdrawsResult.value : []);
    } else {
      setWithdraws([]);
      nextMeta.withdraws = {
        state: "error",
        error: toErrorMessage(withdrawsResult.reason, "Gagal memuat request withdraw affiliate."),
      };
    }

    if (noticesResult.status === "fulfilled") {
      setNotices(Array.isArray(noticesResult.value.items) ? noticesResult.value.items : []);
    } else {
      setNotices([]);
      nextMeta.notices = {
        state: "error",
        error: toErrorMessage(noticesResult.reason, "Gagal memuat notice dashboard affiliate."),
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
        text: "Sesi affiliate tidak ditemukan. Silakan login ulang.",
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

    if (!withdrawMeetsMinimum) {
      setFeedback({
        tone: "error",
        text: "Minimal withdraw affiliate adalah Rp1.000.000 dan request tetap menunggu approval admin.",
      });
      return;
    }

    try {
      setIsSubmittingWithdraw(true);
      const response = await fetch(`${API_BASE_URL}/affiliates/me/withdraws`, {
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

      const createdRequest = await readJsonResponse<AffiliateWithdrawRequest>(
        response,
        "Gagal mengirim withdraw affiliate."
      );

      setFeedback({
        tone: "success",
        text: `Withdraw affiliate ${formatCurrency(createdRequest.amount)} berhasil diajukan dan sedang menunggu approval.`,
      });
      setAmount("");
      setBank("");
      setAccNo("");
      setAccName("");
      await loadAll("refresh");
    } catch (error) {
      setFeedback({
        tone: "error",
        text: toErrorMessage(error, "Gagal mengirim withdraw affiliate."),
      });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  }

  async function handleCopyLink(link: AffiliateLinkRow) {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedLinkId(link.id);
      setFeedback({ tone: "success", text: `Link ${link.label} berhasil disalin.` });
      window.setTimeout(() => {
        setCopiedLinkId((current) => (current === link.id ? null : current));
      }, 2200);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: toErrorMessage(error, "Tidak bisa menyalin link affiliate."),
      });
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/clear-cookie", { method: "POST" });
    } finally {
      clearToken();
      router.replace(resolveLoginPathForRole("AFFILIATE"));
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  const profile = overview?.profile ?? null;
  const summary = overview?.summary ?? null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:px-6">
        <section className="overflow-hidden rounded-[32px] border border-sky-950 bg-sky-950 text-white shadow-[0_32px_80px_rgba(14,116,144,0.24)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:p-8">
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-200">
                Affiliate Dashboard
              </p>
              <div className="space-y-3">
                <h1 className="text-3xl font-black leading-tight lg:text-4xl">
                  Link campaign, tracking klik, conversion, komisi, dan withdraw affiliate
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-sky-100/80 lg:text-[15px]">
                  Semua data affiliate di halaman ini dibaca dari backend real: klik referral,
                  booking teratribusi, komisi 5%, saldo yang bisa ditarik, dan request withdraw.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100/70">
                    Profil affiliate
                  </p>
                  <div className="space-y-1 text-sm leading-6 text-sky-50">
                    <div>{profile?.name ?? "Memuat nama affiliate..."}</div>
                    <div>Kode {profile?.code ?? "-"}</div>
                    <div>Komisi {profile ? `${profile.commissionRatePercent}%` : "-"}</div>
                    <div>Status {profile?.isActive ? "Aktif" : "Belum aktif"}</div>
                  </div>
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
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-sky-50">
                  {sectionErrorCount === 0
                    ? "Semua section affiliate memakai backend real."
                    : `${sectionErrorCount} section affiliate masih gagal dimuat.`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {feedback ? <Banner tone={feedback.tone} text={feedback.text} /> : null}
        {isRefreshing ? (
          <Banner tone="info" text="Dashboard affiliate sedang menyegarkan data real dari backend." />
        ) : null}
        {sectionErrorCount > 0 ? (
          <Banner
            tone="error"
            text="Sebagian data affiliate gagal dimuat. Section terkait menampilkan error state sampai request backend berhasil lagi."
          />
        ) : null}

        {sectionMeta.notices.state === "error" || notices.length > 0 ? (
          <PanelCard
            title="Notice admin untuk affiliate"
            description="Panel ini dipakai admin dan super admin untuk mengirim info campaign, operasional, atau instruksi dashboard khusus affiliate."
          >
            {sectionMeta.notices.state === "error" ? (
              <StateNotice tone="error" title="Notice affiliate gagal dimuat">
                {sectionMeta.notices.error}
              </StateNotice>
            ) : (
              <div className="space-y-3">
                {notices.map((notice) => (
                  <article
                    key={notice.id}
                    className="rounded-[22px] border border-sky-100 bg-sky-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-sky-700">
                          {notice.audience}
                        </div>
                        <h3 className="mt-3 text-base font-bold text-slate-950">{notice.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notice.body}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>Update {formatDateTime(notice.updatedAt)}</div>
                        <div>
                          Window {formatDateTime(notice.startsAt ?? null)} - {formatDateTime(notice.endsAt ?? null)}
                        </div>
                      </div>
                    </div>
                    {notice.ctaLabel && notice.ctaHref ? (
                      <a
                        href={notice.ctaHref}
                        className="mt-4 inline-flex items-center rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700"
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Klik"
            value={String(summary?.clicks ?? 0)}
            status={sectionMeta.overview.state}
            helper="Klik referral yang berhasil ditrack."
            error={sectionMeta.overview.error}
          />
          <MetricCard
            label="Lead"
            value={String(summary?.leads ?? 0)}
            status={sectionMeta.overview.state}
            helper="Booking yang tercatat membawa kode affiliate."
            error={sectionMeta.overview.error}
          />
          <MetricCard
            label="Conversion"
            value={String(summary?.conversions ?? 0)}
            status={sectionMeta.overview.state}
            helper="Booking affiliate yang sudah paid."
            error={sectionMeta.overview.error}
          />
          <MetricCard
            label="Komisi pending"
            value={formatCurrency(summary?.commissionPending ?? 0)}
            status={sectionMeta.overview.state}
            helper="Komisi dari lead yang belum menjadi paid."
            error={sectionMeta.overview.error}
          />
          <MetricCard
            label="Komisi payable"
            value={formatCurrency(summary?.commissionPayable ?? 0)}
            status={sectionMeta.overview.state}
            helper="Komisi paid yang masih tersedia untuk ditarik."
            error={sectionMeta.overview.error}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <PanelCard
            title="Performa 14 hari terakhir"
            description="Time series affiliate berikut dipakai untuk melihat pola klik, lead, conversion, dan komisi per hari."
          >
            {sectionMeta.overview.state === "error" ? (
              <StateNotice tone="error" title="Performa affiliate gagal dimuat">
                {sectionMeta.overview.error}
              </StateNotice>
            ) : sectionMeta.overview.state === "loading" ? (
              <StateNotice tone="loading" title="Memuat performa affiliate">
                Backend sedang menyiapkan rangkuman affiliate.
              </StateNotice>
            ) : !overview || overview.timeseries.length === 0 ? (
              <StateNotice tone="empty" title="Belum ada time series affiliate">
                Data klik dan booking affiliate akan muncul di sini saat campaign mulai berjalan.
              </StateNotice>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {overview.timeseries.map((point) => (
                  <article
                    key={point.date}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      {formatDate(point.date)}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <span>Klik</span>
                        <span className="font-semibold text-slate-950">{point.clicks}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Lead</span>
                        <span className="font-semibold text-slate-950">{point.leads}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Conversion</span>
                        <span className="font-semibold text-slate-950">{point.conversions}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Komisi</span>
                        <span className="font-semibold text-slate-950">
                          {formatCurrency(point.commission)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Link campaign"
            description="Gunakan link berikut sebagai referral utama. Parameter `aff` akan ditrack dan dibawa sampai ke checkout canonical."
          >
            {sectionMeta.links.state === "error" ? (
              <StateNotice tone="error" title="Link campaign gagal dimuat">
                {sectionMeta.links.error}
              </StateNotice>
            ) : sectionMeta.links.state === "loading" ? (
              <StateNotice tone="loading" title="Menyiapkan link campaign">
                Backend sedang menyiapkan variasi link affiliate.
              </StateNotice>
            ) : links.length === 0 ? (
              <StateNotice tone="empty" title="Belum ada link campaign">
                Link campaign akan muncul setelah profil affiliate aktif.
              </StateNotice>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <article
                    key={link.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{link.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{link.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopyLink(link)}
                        className={secondaryButtonClassName}
                      >
                        {copiedLinkId === link.id ? "Tersalin" : "Copy link"}
                      </button>
                    </div>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600">
                      {link.url}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </PanelCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <PanelCard
            title="Saldo affiliate dan withdraw"
            description="Saldo affiliate dihitung dari komisi paid dikurangi withdraw paid dan request yang masih reserving saldo."
          >
            {sectionMeta.balance.state === "error" ? (
              <StateNotice tone="error" title="Saldo affiliate gagal dimuat">
                {sectionMeta.balance.error}
              </StateNotice>
            ) : sectionMeta.balance.state === "loading" ? (
              <StateNotice tone="loading" title="Memuat saldo affiliate">
                Backend sedang menghitung saldo dan reserve withdraw affiliate.
              </StateNotice>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailCard label="Saldo gross paid" value={formatCurrency(balance?.balance ?? 0)} />
                  <DetailCard label="Saldo tersedia" value={formatCurrency(balance?.available ?? 0)} />
                  <DetailCard label="Saldo pending" value={formatCurrency(balance?.pending ?? 0)} />
                  <DetailCard label="Sudah dibayar" value={formatCurrency(balance?.paidOut ?? 0)} />
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  Cutoff affiliate berikutnya {balance ? formatDateTime(balance.nextCutoff) : "-"}.
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">Ajukan withdraw affiliate</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Request withdraw affiliate minimal Rp1.000.000, akan mengurangi saldo tersedia, dan tetap menunggu approval admin.
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

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                      <div>
                        {sectionMeta.balance.state === "ready"
                          ? `Saldo affiliate yang bisa ditarik saat ini ${formatCurrency(balance?.available ?? 0)}. Minimal request ${formatCurrency(AFFILIATE_WITHDRAW_MINIMUM_AMOUNT)}.`
                          : "Saldo belum bisa diverifikasi karena endpoint balance belum berhasil dimuat."}
                      </div>
                      <button
                        type="submit"
                        disabled={
                          isSubmittingWithdraw ||
                          sectionMeta.balance.state !== "ready" ||
                          !withdrawFormComplete ||
                          !withdrawMeetsMinimum
                        }
                        className={primaryButtonClassName}
                      >
                        {isSubmittingWithdraw ? "Mengirim..." : "Ajukan withdraw"}
                      </button>
                    </div>
                    {amount && !withdrawMeetsMinimum ? (
                      <div className="rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Minimal withdraw affiliate adalah {formatCurrency(AFFILIATE_WITHDRAW_MINIMUM_AMOUNT)}.
                      </div>
                    ) : null}
                  </form>
                </div>
              </div>
            )}
          </PanelCard>

          <PanelCard
            title="Riwayat click, lead, conversion, dan komisi"
            description="Activity feed ini menggabungkan click tracking dan booking affiliate yang tercatat pada source of truth canonical."
          >
            {sectionMeta.activity.state === "error" ? (
              <StateNotice tone="error" title="Aktivitas affiliate gagal dimuat">
                {sectionMeta.activity.error}
              </StateNotice>
            ) : sectionMeta.activity.state === "loading" ? (
              <StateNotice tone="loading" title="Memuat aktivitas affiliate">
                Backend sedang mengambil activity feed affiliate.
              </StateNotice>
            ) : activity.length === 0 ? (
              <StateNotice tone="empty" title="Belum ada aktivitas affiliate">
                Klik, lead, conversion, dan komisi affiliate akan muncul di sini.
              </StateNotice>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <KindBadge kind={item.kind} />
                          <span className="text-sm font-semibold text-slate-950">{item.title}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={item.status} />
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {item.kind === "CLICK" ? "-" : formatCurrency(item.amount)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </PanelCard>
        </div>

        <PanelCard
          title="Request withdraw affiliate"
          description="Daftar request withdraw affiliate yang sudah pernah dikirim dari dashboard ini."
        >
          <DataTable
            columns={["Tanggal", "Status", "Rekening", "Nominal"]}
            state={sectionMeta.withdraws.state}
            error={sectionMeta.withdraws.error}
            emptyTitle="Belum ada request withdraw affiliate"
            emptyDescription="Affiliate ini belum pernah mengirim request withdraw."
          >
            {withdraws.map((withdraw) => (
              <tr key={withdraw.id} className="border-t border-slate-200">
                <DataCell>{formatDateTime(withdraw.createdAt)}</DataCell>
                <DataCell>
                  <StatusBadge status={withdraw.status} />
                </DataCell>
                <DataCell>
                  <div className="font-semibold text-slate-900">{withdraw.target.bank}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {withdraw.target.accNo} • {withdraw.target.accName}
                  </div>
                </DataCell>
                <DataCell align="right">{formatCurrency(withdraw.amount)}</DataCell>
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

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-950">{value}</p>
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

function KindBadge({ kind }: { kind: AffiliateActivityRow["kind"] }) {
  const palette =
    kind === "CLICK"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : kind === "LEAD"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${palette}`}
    >
      {kind}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const palette =
    normalized.includes("PAID") ||
    normalized.includes("APPROVED") ||
    normalized.includes("SUCCESS") ||
    normalized.includes("CONVERSION")
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized.includes("PENDING") || normalized.includes("TRACK")
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
