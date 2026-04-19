"use client";

import { useMemo, useState } from "react";

type DashboardNoticeItem = {
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
  createdByName?: string | null;
};

type MonitoringActivity = {
  id: string;
  actorType: "SELLER" | "AFFILIATE";
  actorName: string;
  activityType: string;
  title: string;
  detail: string;
  status: string;
  amount: number | null;
  createdAt: string;
};

type ControlSnapshot = {
  notices: { active: number };
  sellers: {
    total: number;
    active: number;
    pendingReview: number;
    suspended: number;
    rejected: number;
  };
  affiliates: {
    total: number;
    active: number;
    inactive: number;
  };
  sellerActivities: MonitoringActivity[];
  affiliateActivities: MonitoringActivity[];
};

type NoticePayload = {
  title: string;
  body: string;
  audience: "SELLER" | "AFFILIATE" | "ALL_USERS";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
};

type NoticeFormState = {
  id: string | null;
  title: string;
  body: string;
  audience: NoticePayload["audience"];
  ctaLabel: string;
  ctaHref: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  sortOrder: string;
};

function emptyForm(): NoticeFormState {
  return {
    id: null,
    title: "",
    body: "",
    audience: "SELLER",
    ctaLabel: "",
    ctaHref: "",
    isActive: true,
    startsAt: "",
    endsAt: "",
    sortOrder: "0",
  };
}

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateTimeFormatter.format(parsed);
}

function formatCurrency(value?: number | null) {
  if (typeof value !== "number") return "-";
  return currencyFormatter.format(value);
}

function toLocalInputValue(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const shifted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function toIsoString(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (
    normalized.includes("PAID") ||
    normalized.includes("APPROVED") ||
    normalized.includes("ACTIVE") ||
    normalized.includes("TRACKED")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (
    normalized.includes("PENDING") ||
    normalized.includes("REVIEW") ||
    normalized.includes("PROCESSING")
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (
    normalized.includes("REJECT") ||
    normalized.includes("FAILED") ||
    normalized.includes("SUSPENDED")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function DashboardControlPanel({
  notices,
  snapshot,
  loading = false,
  error = null,
  saving = false,
  deletingId = null,
  onSaveNotice,
  onDeleteNotice,
}: {
  notices: DashboardNoticeItem[];
  snapshot: ControlSnapshot | null;
  loading?: boolean;
  error?: string | null;
  saving?: boolean;
  deletingId?: string | null;
  onSaveNotice: (id: string | null, payload: NoticePayload) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState<NoticeFormState>(() => emptyForm());

  const isEditing = Boolean(form.id);
  const canSubmit = form.title.trim().length >= 3 && form.body.trim().length >= 10;

  const summaryCards = useMemo(
    () => [
      {
        label: "Notice aktif",
        value: String(snapshot?.notices.active ?? 0),
        helper: "Konten dashboard yang sedang tampil.",
      },
      {
        label: "Seller aktif",
        value: `${snapshot?.sellers.active ?? 0}/${snapshot?.sellers.total ?? 0}`,
        helper: "Status seller yang bisa dipantau admin.",
      },
      {
        label: "Seller pending",
        value: String(snapshot?.sellers.pendingReview ?? 0),
        helper: "Akun seller yang masih menunggu review.",
      },
      {
        label: "Affiliate aktif",
        value: `${snapshot?.affiliates.active ?? 0}/${snapshot?.affiliates.total ?? 0}`,
        helper: "Affiliate yang masih bisa melakukan referral.",
      },
    ],
    [snapshot]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    await onSaveNotice(form.id, {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
      ctaLabel: form.ctaLabel.trim() || null,
      ctaHref: form.ctaHref.trim() || null,
      isActive: form.isActive,
      startsAt: toIsoString(form.startsAt),
      endsAt: toIsoString(form.endsAt),
      sortOrder: Number(form.sortOrder || "0"),
    });

    setForm(emptyForm());
  }

  function startEdit(notice: DashboardNoticeItem) {
    setForm({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      audience: notice.audience,
      ctaLabel: notice.ctaLabel ?? "",
      ctaHref: notice.ctaHref ?? "",
      isActive: notice.isActive,
      startsAt: toLocalInputValue(notice.startsAt),
      endsAt: toLocalInputValue(notice.endsAt),
      sortOrder: String(notice.sortOrder),
    });
  }

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <article
            key={item.label}
            className="rounded-[24px] border border-slate-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {loading ? "..." : item.value}
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.helper}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {isEditing ? "Edit control notice" : "Buat control notice"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Notice ini bisa ditarget ke seller, affiliate, atau semua user. Fungsinya buat
                kontrol konten dashboard, bukan saldo dan komisi.
              </p>
            </div>
            {isEditing ? (
              <button
                type="button"
                onClick={() => setForm(emptyForm())}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal edit
              </button>
            ) : null}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Judul
                </span>
                <input
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Contoh: Promo affiliate minggu ini"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Audience
                </span>
                <select
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.audience}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      audience: event.target.value as NoticePayload["audience"],
                    }))
                  }
                >
                  <option value="SELLER">SELLER</option>
                  <option value="AFFILIATE">AFFILIATE</option>
                  <option value="ALL_USERS">ALL_USERS</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                Isi notice
              </span>
              <textarea
                className="min-h-[140px] rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={form.body}
                onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                placeholder="Tulis pesan dashboard yang mau ditampilkan."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  CTA label
                </span>
                <input
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.ctaLabel}
                  onChange={(event) => setForm((current) => ({ ...current, ctaLabel: event.target.value }))}
                  placeholder="Lihat detail"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  CTA href
                </span>
                <input
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.ctaHref}
                  onChange={(event) => setForm((current) => ({ ...current, ctaHref: event.target.value }))}
                  placeholder="/seller?tab=products"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Mulai tampil
                </span>
                <input
                  type="datetime-local"
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Berakhir
                </span>
                <input
                  type="datetime-local"
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Sort order
                </span>
                <input
                  type="number"
                  min={0}
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  value={form.sortOrder}
                  onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Notice aktif dan boleh tampil di dashboard.</span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-sm text-sky-900">
                Admin hanya mengontrol konten dan monitoring. Saldo seller-affiliate tetap tidak
                bisa diubah dari panel ini.
              </p>
              <button
                type="submit"
                disabled={saving || !canSubmit}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-sky-200"
              >
                {saving ? "Menyimpan..." : isEditing ? "Update notice" : "Simpan notice"}
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-slate-950">Notice aktif & draft</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Semua notice ini bisa dipakai untuk seller dashboard, affiliate dashboard, atau
            audience umum.
          </p>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Memuat control notice...
              </div>
            ) : notices.length === 0 ? (
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Belum ada control notice.
              </div>
            ) : (
              notices.map((notice) => (
                <article
                  key={notice.id}
                  className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                          {notice.audience}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusTone(
                            notice.isActive ? "ACTIVE" : "INACTIVE"
                          )}`}
                        >
                          {notice.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <h4 className="mt-3 text-base font-bold text-slate-950">{notice.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{notice.body}</p>
                      <div className="mt-3 grid gap-1 text-xs text-slate-500">
                        <div>Urutan {notice.sortOrder}</div>
                        <div>Window {formatDateTime(notice.startsAt)} - {formatDateTime(notice.endsAt)}</div>
                        <div>
                          Dibuat {notice.createdByName || "System"} • update {formatDateTime(notice.updatedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(notice)}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeleteNotice(notice.id)}
                        disabled={deletingId === notice.id}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === notice.id ? "Menghapus..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ActivityCard
          title="Aktivitas seller"
          description="Feed ini fokus ke booking, request withdraw, dan perubahan listing seller."
          items={snapshot?.sellerActivities ?? []}
          loading={loading}
        />
        <ActivityCard
          title="Aktivitas affiliate"
          description="Feed ini fokus ke click tracking, lead/conversion, dan request withdraw affiliate."
          items={snapshot?.affiliateActivities ?? []}
          loading={loading}
        />
      </div>
    </section>
  );
}

function ActivityCard({
  title,
  description,
  items,
  loading,
}: {
  title: string;
  description: string;
  items: MonitoringActivity[];
  loading: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>

      <div className="mt-5 space-y-3">
        {loading ? (
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Memuat activity feed...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Belum ada aktivitas terbaru.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                      {item.actorType}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${statusTone(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-950">{item.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.actorName} • {item.activityType} • {formatDateTime(item.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Amount
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </article>
  );
}
