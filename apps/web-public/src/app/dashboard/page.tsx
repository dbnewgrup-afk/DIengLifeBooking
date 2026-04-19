"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { API_BASE_URL, clearPublicSession, getPublicRole, getPublicToken, resolvePublicSession } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";

type BuyerDashboardResponse = {
  ok: boolean;
  profile: {
    name: string;
    email: string;
    phone?: string | null;
    joinedAt: string;
  };
  overview: {
    totalOrders: number;
    totalPaidOrders: number;
    totalSpent: number;
  };
  paidProducts: Array<{
    id: string;
    code: string;
    productId: string;
    slug: string;
    name: string;
    type: string;
    bookingStatus: string;
    paymentStatus: string;
    totalAmount: number;
    subtotal: number;
    qty: number;
    paidAt: string;
    promoCode?: string | null;
    startDate?: string;
    endDate?: string;
    guestCount?: number;
    notes?: string | null;
    identityNumber?: string | null;
    review?: {
      id: string;
      status: "VISIBLE" | "HIDDEN" | "FLAGGED";
      rating: number;
      comment: string;
      createdAt: string;
    } | null;
  }>;
  payments: Array<{
    id: string;
    code: string;
    productName: string;
    totalAmount: number;
    subtotal: number;
    qty: number;
    bookingStatus: string;
    paymentStatus: string;
    provider?: string | null;
    paymentMethod?: string | null;
    paidAt?: string | null;
    createdAt: string;
    startDate?: string;
    endDate?: string;
    guestCount?: number;
    notes?: string | null;
    identityNumber?: string | null;
  }>;
};

const PAID_PRODUCTS_EMPTY_COPY = "Belum ada produk yang tercatat sebagai sudah dibayar.";
const PAYMENTS_EMPTY_COPY = "Belum ada riwayat pembayaran untuk akun buyer ini.";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<BuyerDashboardResponse | null>(null);
  const [hasBuyerSession, setHasBuyerSession] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: string; comment: string }>>({});
  const [reviewBusyCode, setReviewBusyCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const hadStoredBuyerSession = Boolean(getPublicToken()) && getPublicRole() === "USER";

      setLoading(true);
      setError(null);

      try {
        const session = await resolvePublicSession("USER");

        if (cancelled) {
          return;
        }

        if (!session) {
          setHasBuyerSession(false);

          if (hadStoredBuyerSession) {
            router.replace("/login/user?returnTo=/dashboard");
          }

          return;
        }

        setHasBuyerSession(true);

        const response = await fetch(`${API_BASE_URL}/buyer/dashboard`, {
          headers: {
            Authorization: `Bearer ${session.token}`,
          },
          cache: "no-store",
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            await clearPublicSession();

            if (!cancelled) {
              setHasBuyerSession(false);
              router.replace("/login/user?returnTo=/dashboard");
            }

            return;
          }

          throw new Error(json?.error || json?.message || "Gagal memuat dashboard buyer.");
        }

        if (!cancelled) {
          setData(json as BuyerDashboardResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Gagal memuat dashboard buyer.");
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Buyer Dashboard</p>
          <h1 className="mt-3 text-3xl font-black">Memeriksa sesi buyer</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Kami sedang memastikan sesi login kamu masih aktif sebelum memuat data dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!hasBuyerSession) {
    if (error) {
      return (
        <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Buyer Dashboard</p>
            <h1 className="mt-3 text-3xl font-black">Sesi buyer belum bisa diverifikasi</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">{error}</p>
            <Link
              href="/login/user?returnTo=/dashboard"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Masuk ke akun buyer
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Buyer Dashboard</p>
          <h1 className="mt-3 text-3xl font-black">Login dulu untuk lihat dashboard</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Dashboard buyer menampilkan produk yang sudah dibayar, riwayat pembayaran, dan overview aktivitas pembelian.
          </p>
          <Link
            href="/login/user?returnTo=/dashboard"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Masuk ke akun buyer
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Buyer Dashboard</p>
              <h1 className="mt-3 text-3xl font-black">Ringkasan akun buyer</h1>
              <p className="mt-2 text-sm leading-7 text-slate-300">
                Semua order yang kamu buat dari checkout sekarang tercatat ke dashboard buyer, seller, dan admin dari source data yang sama.
              </p>
            </div>

            <Link
              href="/dashboard/reset-password"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Reset password saya
            </Link>
          </div>
        </div>

        {loading ? (
          <DashboardCard title="Loading">Sedang memuat dashboard buyer...</DashboardCard>
        ) : error ? (
          <DashboardCard title="Terjadi kendala">{error}</DashboardCard>
        ) : data ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard label="Total order" value={String(data.overview.totalOrders)} />
              <StatCard label="Order dibayar" value={String(data.overview.totalPaidOrders)} />
              <StatCard label="Total belanja" value={formatRupiah(data.overview.totalSpent)} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <BuyerProfileCard profile={data.profile} />

              <DashboardCard title="Produk yang sudah dibayar">
                {data.paidProducts.length === 0 ? (
                  <SectionEmptyState message={PAID_PRODUCTS_EMPTY_COPY} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="py-2">Produk</th>
                          <th className="py-2">Kategori</th>
                          <th className="py-2">Tanggal bayar</th>
                          <th className="py-2">Promo</th>
                          <th className="py-2 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.paidProducts.map((item) => (
                          <tr key={item.id} className="border-t border-white/10 text-slate-100">
                            <td className="py-3">
                              <div className="font-medium">{item.name}</div>
                              <div className="mt-1 text-xs text-slate-400">
                                {formatBuyerSchedule(item.startDate, item.endDate, item.guestCount)}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Qty: {item.qty}</div>
                              {item.identityNumber ? (
                                <div className="mt-1 text-xs text-slate-500">
                                  No identitas: {item.identityNumber}
                                </div>
                              ) : null}
                              {item.notes ? (
                                <div className="mt-1 text-xs text-slate-500">
                                  Catatan: {item.notes}
                                </div>
                              ) : null}
                              <Link
                                href={`/invoice/${encodeURIComponent(item.code)}`}
                                className="mt-2 inline-flex text-xs font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                              >
                                Buka invoice canonical
                              </Link>
                              <div className="mt-3">
                                {item.review ? (
                                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-xs text-emerald-100">
                                    <div className="font-semibold">
                                      Review tersimpan • {item.review.rating}/5 • {formatReviewStatus(item.review.status)}
                                    </div>
                                    <div className="mt-1 leading-6 text-emerald-50/90">{item.review.comment}</div>
                                  </div>
                                ) : item.bookingStatus === "COMPLETED" ? (
                                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                                      Tulis review booking ini
                                    </div>
                                    <div className="mt-3 grid gap-3">
                                      <select
                                        value={reviewDrafts[item.code]?.rating ?? ""}
                                        onChange={(event) =>
                                          setReviewDrafts((current) => ({
                                            ...current,
                                            [item.code]: {
                                              rating: event.target.value,
                                              comment: current[item.code]?.comment ?? "",
                                            },
                                          }))
                                        }
                                        className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                                      >
                                        <option value="">Pilih rating</option>
                                        {[5, 4, 3, 2, 1].map((rating) => (
                                          <option key={rating} value={String(rating)}>
                                            {rating}/5
                                          </option>
                                        ))}
                                      </select>
                                      <textarea
                                        value={reviewDrafts[item.code]?.comment ?? ""}
                                        onChange={(event) =>
                                          setReviewDrafts((current) => ({
                                            ...current,
                                            [item.code]: {
                                              rating: current[item.code]?.rating ?? "",
                                              comment: event.target.value,
                                            },
                                          }))
                                        }
                                        rows={3}
                                        placeholder="Ceritakan pengalaman booking kamu."
                                        className="rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                                      />
                                      <button
                                        type="button"
                                        disabled={
                                          reviewBusyCode === item.code ||
                                          !(reviewDrafts[item.code]?.rating && (reviewDrafts[item.code]?.comment ?? "").trim().length >= 12)
                                        }
                                        onClick={async () => {
                                          const token = getPublicToken();
                                          if (!token) {
                                            setError("Sesi buyer tidak ditemukan. Silakan login ulang.");
                                            return;
                                          }

                                          const rating = Number(reviewDrafts[item.code]?.rating ?? 0);
                                          const comment = (reviewDrafts[item.code]?.comment ?? "").trim();
                                          if (!rating || comment.length < 12) {
                                            setError("Rating dan review minimal 12 karakter wajib diisi.");
                                            return;
                                          }

                                          try {
                                            setReviewBusyCode(item.code);
                                            setError(null);
                                            const response = await fetch(`${API_BASE_URL}/reviews/bookings/${encodeURIComponent(item.code)}`, {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`,
                                              },
                                              body: JSON.stringify({ rating, comment }),
                                            });
                                            const json = await response.json().catch(() => ({}));
                                            if (!response.ok) {
                                              throw new Error(json?.error || json?.message || "Gagal mengirim review.");
                                            }

                                            setData((current) =>
                                              current
                                                ? {
                                                    ...current,
                                                    paidProducts: current.paidProducts.map((product) =>
                                                      product.code === item.code
                                                        ? {
                                                            ...product,
                                                            review: {
                                                              id: json?.item?.id ?? `${item.code}-review`,
                                                              status: json?.item?.status ?? "FLAGGED",
                                                              rating,
                                                              comment,
                                                              createdAt: json?.item?.createdAt ?? new Date().toISOString(),
                                                            },
                                                          }
                                                        : product
                                                    ),
                                                  }
                                                : current
                                            );
                                            setReviewDrafts((current) => {
                                              const next = { ...current };
                                              delete next[item.code];
                                              return next;
                                            });
                                          } catch (submitError) {
                                            setError(
                                              submitError instanceof Error
                                                ? submitError.message
                                                : "Gagal mengirim review."
                                            );
                                          } finally {
                                            setReviewBusyCode(null);
                                          }
                                        }}
                                        className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
                                      >
                                        {reviewBusyCode === item.code ? "Mengirim..." : "Kirim review"}
                                      </button>
                                      <div className="text-[11px] leading-5 text-slate-400">
                                        Review akan masuk moderasi admin sebelum tampil di detail produk.
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-xs text-slate-400">
                                    Review baru bisa dikirim setelah booking berstatus selesai.
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3">{formatListingType(item.type)}</td>
                            <td className="py-3">{formatBuyerDate(item.paidAt)}</td>
                            <td className="py-3">{item.promoCode || "-"}</td>
                            <td className="py-3 text-right">{formatRupiah(item.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DashboardCard>
            </div>

            <DashboardCard title="Riwayat pembayaran">
              {data.payments.length === 0 ? (
                <SectionEmptyState message={PAYMENTS_EMPTY_COPY} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="py-2">Produk</th>
                        <th className="py-2">Pembayaran</th>
                        <th className="py-2">Metode</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payments.map((payment) => (
                        <tr key={payment.id} className="border-t border-white/10 text-slate-100">
                          <td className="py-3">
                            <div className="font-medium">{payment.productName}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {formatBuyerSchedule(payment.startDate, payment.endDate, payment.guestCount)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Qty: {payment.qty} • Subtotal: {formatRupiah(payment.subtotal)}
                            </div>
                            {payment.identityNumber ? (
                              <div className="mt-1 text-xs text-slate-500">
                                No identitas: {payment.identityNumber}
                              </div>
                            ) : null}
                            {payment.notes ? (
                              <div className="mt-1 text-xs text-slate-500">
                                Catatan: {payment.notes}
                              </div>
                            ) : null}
                            <Link
                              href={`/invoice/${encodeURIComponent(payment.code)}`}
                              className="mt-2 inline-flex text-xs font-semibold text-emerald-300 underline underline-offset-4 hover:text-emerald-200"
                            >
                              Buka invoice canonical
                            </Link>
                          </td>
                          <td className="py-3">
                            <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                              {formatPaymentStatus(payment.paymentStatus)}
                            </div>
                            <div className="mt-2 text-xs text-slate-400">
                              {payment.paidAt ? `Tercatat ${formatBuyerDate(payment.paidAt)}` : `Dibuat ${formatBuyerDate(payment.createdAt)}`}
                            </div>
                          </td>
                          <td className="py-3">{formatPaymentMethod(payment.paymentMethod, payment.provider)}</td>
                          <td className="py-3 text-right">{formatRupiah(payment.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DashboardCard>
          </>
        ) : null}
      </div>
    </div>
  );
}

function DashboardCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-5 shadow-2xl">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function BuyerProfileCard({ profile }: { profile: BuyerDashboardResponse["profile"] }) {
  const displayName = formatBuyerName(profile.name, profile.email);
  const initials = getBuyerInitials(displayName);
  const normalizedPhone = profile.phone?.trim() || null;
  const joinedAt = formatBuyerJoinDate(profile.joinedAt);

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/12 text-lg font-black text-emerald-200 ring-1 ring-emerald-300/20">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Akun buyer</p>
          <h2 className="mt-2 text-xl font-black text-white">{displayName}</h2>
          <p className="mt-1 break-all text-sm text-slate-300">{profile.email}</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Informasi ini dipakai untuk booking dan konfirmasi pembayaran. Data internal sistem tidak ditampilkan di halaman ini.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {normalizedPhone ? (
          <ProfileItem label="Nomor WhatsApp" value={normalizedPhone} />
        ) : (
          <ProfileItem label="Nomor WhatsApp" value="Belum ditambahkan" muted />
        )}
        {joinedAt ? <ProfileItem label="Gabung sejak" value={joinedAt} /> : null}
      </div>
    </section>
  );
}

function ProfileItem({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-medium ${muted ? "text-slate-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function SectionEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-slate-400">
      {message}
    </div>
  );
}

function formatBuyerName(name: string, email: string) {
  const normalizedName = name.trim().replace(/\s+/g, " ");
  if (normalizedName) {
    return normalizedName;
  }

  const emailName = email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Buyer";
  return emailName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getBuyerInitials(name: string) {
  const parts = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "BY";
  }

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function formatBuyerJoinDate(value: string) {
  const joinedAt = new Date(value);
  if (Number.isNaN(joinedAt.getTime())) {
    return null;
  }

  return joinedAt.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatBuyerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBuyerSchedule(startDate?: string, endDate?: string, guestCount?: number) {
  const dateLabel = startDate
    ? `${formatBuyerDate(startDate)}${endDate ? ` - ${formatBuyerDate(endDate)}` : ""}`
    : "Jadwal belum ada";

  if (!guestCount) {
    return dateLabel;
  }

  return `${dateLabel} • ${guestCount} tamu`;
}

function formatListingType(value: string) {
  switch (value.toUpperCase()) {
    case "VILLA":
      return "Villa";
    case "JEEP":
      return "Jeep";
    case "TRANSPORT":
      return "Transport";
    case "DOKUMENTASI":
      return "Dokumentasi";
    default:
      return value;
  }
}

function formatPaymentStatus(value: string) {
  switch (value.toUpperCase()) {
    case "PAID":
      return "Sudah dibayar";
    case "PENDING":
      return "Menunggu pembayaran";
    case "EXPIRED":
      return "Kadaluarsa";
    case "FAILED":
      return "Pembayaran gagal";
    case "CANCELLED":
      return "Dibatalkan";
    case "REFUNDED":
      return "Dana dikembalikan";
    default:
      return "Status diproses";
  }
}

function formatPaymentMethod(paymentMethod?: string | null, provider?: string | null) {
  const source = paymentMethod || provider;
  if (!source) {
    return "-";
  }

  return source
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 4) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

function formatReviewStatus(value: "VISIBLE" | "HIDDEN" | "FLAGGED") {
  switch (value) {
    case "VISIBLE":
      return "Tampil";
    case "HIDDEN":
      return "Disembunyikan";
    case "FLAGGED":
      return "Menunggu moderasi";
    default:
      return value;
  }
}
