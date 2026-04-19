"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ApiError, Role } from "@/lib/api/schemas";
import { useSession } from "@/store/session";
import { useAccountManagementAccess } from "./useAccountManagementAccess";

type ManagedAccount = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  status: "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";
  archivedAt?: string | null;
  adminPermissions: {
    canManageAccounts: boolean;
    canReviewPasswordResets: boolean;
  };
  passwordResetEnabled: boolean;
  passwordResetEnabledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sellerProfile?: {
    displayName: string;
    status: string;
  } | null;
  affiliateProfile?: {
    displayName: string;
    code: string;
    isActive: boolean;
  } | null;
  latestPasswordResetRequest?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    note?: string | null;
    requestedAt: string;
    reviewedAt?: string | null;
  } | null;
};

type PasswordResetRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  note?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: string;
    passwordResetEnabled: boolean;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
};

type AccountManagementConsoleProps = {
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
};

type RoleFilter = "ALL" | Role;
type StatusFilter = "ALL" | "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";
type CreatableRole = "USER" | "ADMIN" | "KASIR" | "SUPER_ADMIN";

type DeleteAccountResponse = {
  ok: true;
  item: {
    id: string;
    email: string;
    role: Role;
    mode: "DELETED" | "ARCHIVED";
  };
};

const roleOptions: RoleFilter[] = [
  "ALL",
  "SUPER_ADMIN",
  "ADMIN",
  "KASIR",
  "SELLER",
  "AFFILIATE",
  "USER",
];

const statusOptions: StatusFilter[] = ["ALL", "ACTIVE", "BANNED", "PENDING_VERIFICATION"];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "message" in error && typeof (error as ApiError).message === "string") {
    return (error as ApiError).message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function StatusBadge({ tone, children }: { tone: "emerald" | "amber" | "rose" | "slate" | "sky"; children: string }) {
  const palette =
    tone === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : tone === "sky"
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-slate-200 bg-slate-100 text-slate-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${palette}`}>
      {children}
    </span>
  );
}

function roleTone(role: Role) {
  switch (role) {
    case "SUPER_ADMIN":
      return "rose";
    case "ADMIN":
      return "sky";
    case "KASIR":
      return "amber";
    case "SELLER":
    case "AFFILIATE":
      return "emerald";
    default:
      return "slate";
  }
}

function requestTone(status: PasswordResetRequest["status"]) {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return "emerald";
    case "REJECTED":
      return "rose";
    default:
      return "amber";
  }
}

export default function AccountManagementConsole({
  title,
  description,
  homeHref,
  homeLabel,
}: AccountManagementConsoleProps) {
  const { role } = useSession();
  const {
    access,
    loading: accessLoading,
    error: accessError,
    canOpenAccountManagement,
    canManageAccounts,
    canReviewPasswordResets,
  } = useAccountManagementAccess();
  const actorRole = role ?? null;
  const canDirectlySetPassword = actorRole === "SUPER_ADMIN";

  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "USER" as CreatableRole,
    password: "",
    status: "ACTIVE" as "ACTIVE" | "BANNED" | "PENDING_VERIFICATION",
    adminCanManageAccounts: false,
    adminCanReviewPasswordResets: false,
  });

  const creatableRoles: CreatableRole[] =
    actorRole === "SUPER_ADMIN"
      ? ["USER", "ADMIN", "KASIR", "SUPER_ADMIN"]
      : ["USER", "ADMIN", "KASIR"];
  const visibleRoleOptions =
    actorRole === "SUPER_ADMIN"
      ? roleOptions
      : roleOptions.filter((item) => item !== "SUPER_ADMIN");
  const pendingRequests = requests.filter((item) => item.status === "PENDING");
  const reviewedRequests = requests.filter((item) => item.status !== "PENDING");

  useEffect(() => {
    if (actorRole !== "ADMIN" && actorRole !== "SUPER_ADMIN") {
      return;
    }

    if (accessLoading || !access) {
      return;
    }

    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorRole, accessLoading, access, roleFilter, statusFilter]);

  async function loadData() {
    if (!access) return;
    setLoading(true);
    try {
      const query: Record<string, string> = {};
      if (roleFilter !== "ALL") query.role = roleFilter;
      if (statusFilter !== "ALL") query.status = statusFilter;
      if (search.trim()) query.search = search.trim();

      const tasks: Array<Promise<void>> = [];

      if (canOpenAccountManagement) {
        tasks.push(
          api
            .get<{ ok: true; items: ManagedAccount[] }>("/account-management/accounts", { query })
            .then((accountsResponse) => {
              setAccounts(accountsResponse.items);
            })
        );
      } else {
        setAccounts([]);
      }

      if (canReviewPasswordResets) {
        tasks.push(
          api
            .get<{ ok: true; items: PasswordResetRequest[] }>("/account-management/password-reset-requests")
            .then((requestsResponse) => {
              setRequests(requestsResponse.items);
            })
        );
      } else {
        setRequests([]);
      }

      await Promise.all(tasks);
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal memuat account management."),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadData();
  }

  async function handleCreateAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await api.post<{ ok: true; item: ManagedAccount }>("/account-management/accounts", {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        password: form.password,
        status: form.status,
        adminPermissions:
          actorRole === "SUPER_ADMIN" && form.role === "ADMIN"
            ? {
                canManageAccounts: form.adminCanManageAccounts,
                canReviewPasswordResets: form.adminCanReviewPasswordResets,
              }
            : undefined,
      });

      setFeedback({
        tone: "success",
        text: `Akun ${response.item.email} berhasil dibuat.`,
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "USER",
        password: "",
        status: "ACTIVE",
        adminCanManageAccounts: false,
        adminCanReviewPasswordResets: false,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal membuat akun baru."),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminPermissionToggle(
    account: ManagedAccount,
    permission: "canManageAccounts" | "canReviewPasswordResets",
    enabled: boolean
  ) {
    setBusyKey(`permission-${account.id}-${permission}`);
    setFeedback(null);

    try {
      await api.patch(`/account-management/accounts/${encodeURIComponent(account.id)}/admin-permissions`, {
        canManageAccounts:
          permission === "canManageAccounts" ? enabled : account.adminPermissions.canManageAccounts,
        canReviewPasswordResets:
          permission === "canReviewPasswordResets"
            ? enabled
            : account.adminPermissions.canReviewPasswordResets,
      });
      setFeedback({
        tone: "success",
        text: `Permission admin untuk ${account.email} berhasil diperbarui.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal mengubah permission admin."),
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleResetAccess(account: ManagedAccount, enabled: boolean) {
    const actionLabel = enabled ? "membuka" : "menutup";
    const note = enabled
      ? window.prompt(`Catatan opsional untuk ${actionLabel} akses reset password ${account.email}:`, "") ?? ""
      : "";

    setBusyKey(`reset-${account.id}`);
    setFeedback(null);

    try {
      await api.patch(`/account-management/accounts/${encodeURIComponent(account.id)}/reset-access`, {
        enabled,
        note: note.trim() || null,
      });
      setFeedback({
        tone: "success",
        text: `Akses reset password untuk ${account.email} berhasil ${enabled ? "dibuka" : "ditutup"}.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal mengubah akses reset password."),
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRequestReview(requestId: string, status: "APPROVED" | "REJECTED", email: string) {
    const note = window.prompt(
      `Catatan opsional untuk ${status === "APPROVED" ? "approve" : "reject"} request ${email}:`,
      "",
    ) ?? "";

    setBusyKey(`request-${requestId}`);
    setFeedback(null);

    try {
      await api.patch(`/account-management/password-reset-requests/${encodeURIComponent(requestId)}`, {
        status,
        note: note.trim() || null,
      });
      setFeedback({
        tone: "success",
        text: `Request reset password ${email} berhasil ${status === "APPROVED" ? "di-approve" : "di-reject"}.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal memproses request reset password."),
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteAccount(account: ManagedAccount) {
    const confirmed = window.confirm(`Hapus akun ${account.email}? Aksi ini tidak bisa dibatalkan.`);
    if (!confirmed) return;

    setBusyKey(`delete-${account.id}`);
    setFeedback(null);

    try {
      const response = await api.del<DeleteAccountResponse>(`/account-management/accounts/${encodeURIComponent(account.id)}`);
      setFeedback({
        tone: "success",
        text:
          response.item.mode === "ARCHIVED"
            ? `Akun ${account.email} tidak dihapus total karena masih punya histori transaksi. Sistem mengarsipkan akun dan mematikan akses login-nya.`
            : `Akun ${account.email} berhasil dihapus total.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal menghapus akun."),
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDirectPasswordSet(account: ManagedAccount) {
    const nextPassword = window.prompt(`Masukkan password baru untuk ${account.email}:`, "");
    if (!nextPassword) return;

    setBusyKey(`password-${account.id}`);
    setFeedback(null);

    try {
      await api.patch(`/account-management/accounts/${encodeURIComponent(account.id)}/password`, {
        password: nextPassword,
      });
      setFeedback({
        tone: "success",
        text: `Password ${account.email} berhasil diubah langsung oleh super admin.`,
      });
      await loadData();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal mengganti password akun."),
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/80 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-300">Account Management</p>
            <h1 className="mt-3 text-3xl font-black">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              {homeLabel}
            </Link>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={`rounded-[24px] border px-4 py-3 text-sm font-semibold shadow-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      {accessLoading ? (
        <StateNotice title="Memeriksa permission account management" tone="loading">
          Sistem sedang mengecek izin akun admin ini sebelum menampilkan section yang boleh diakses.
        </StateNotice>
      ) : accessError ? (
        <StateNotice title="Permission account management gagal dimuat" tone="error">
          {accessError}
        </StateNotice>
      ) : access && !canOpenAccountManagement ? (
        <StateNotice title="Akses account management belum dibuka" tone="error">
          Super admin perlu memberi izin ke akun admin ini lebih dulu. Saat ini permission kamu:
          <br />
          `canManageAccounts`: {String(access.permissions.canManageAccounts)}
          <br />
          `canReviewPasswordResets`: {String(access.permissions.canReviewPasswordResets)}
        </StateNotice>
      ) : null}

      {canManageAccounts || canReviewPasswordResets ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          {canManageAccounts ? (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">Create account internal</h2>
            <p className="text-sm leading-6 text-slate-500">
              Admin bisa membuat akun `USER`, `ADMIN`, dan `KASIR`. Hanya super admin yang bisa membuat akun `SUPER_ADMIN`.
            </p>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleCreateAccount}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama">
                <input
                  className={inputClassName}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Email">
                <input
                  className={inputClassName}
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="No. HP">
                <input
                  className={inputClassName}
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </Field>
              <Field label="Role akun">
                <select
                  className={inputClassName}
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreatableRole }))}
                >
                  {creatableRoles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Password awal">
                <input
                  className={inputClassName}
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClassName}
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as "ACTIVE" | "BANNED" | "PENDING_VERIFICATION",
                    }))
                  }
                >
                  {statusOptions
                    .filter((item): item is Exclude<StatusFilter, "ALL"> => item !== "ALL")
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </Field>
            </div>

            {actorRole === "SUPER_ADMIN" && form.role === "ADMIN" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    checked={form.adminCanManageAccounts}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        adminCanManageAccounts: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="block font-semibold text-slate-950">Boleh buka account management</span>
                    <span className="mt-1 block text-slate-500">
                      Admin ini bisa lihat daftar akun, create account internal, dan mengelola lifecycle akun.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                    checked={form.adminCanReviewPasswordResets}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        adminCanReviewPasswordResets: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="block font-semibold text-slate-950">Boleh review reset password</span>
                    <span className="mt-1 block text-slate-500">
                      Admin ini bisa approve/reject request reset password dan membuka akses reset ke akun lain.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
              Akun `SELLER` dan `AFFILIATE` tetap tercatat di sini untuk dikelola reset password dan penghapusan, tapi pembuatan awalnya tetap lewat flow seller/affiliate yang sudah ada.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
            >
              {submitting ? "Membuat akun..." : "Create account"}
            </button>
          </form>
        </section>
          ) : (
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <StateNotice title="Create account disembunyikan" tone="empty">
                Akun admin ini tidak punya permission `canManageAccounts`, jadi section create/delete account tidak dibuka.
              </StateNotice>
            </section>
          )}

          {canReviewPasswordResets ? (
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">Request reset password</h2>
            <p className="text-sm leading-6 text-slate-500">
              Semua request di bawah ini datang dari dashboard akun masing-masing. Admin dan super admin sama-sama bisa review request yang boleh mereka kelola.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <StateNotice title="Memuat request reset password" tone="loading">
                Request dari akun sedang dimuat dari backend.
              </StateNotice>
            ) : pendingRequests.length === 0 ? (
              <StateNotice title="Belum ada request pending" tone="empty">
                Saat ada akun yang mengajukan reset password, daftar request akan muncul di sini.
              </StateNotice>
            ) : (
              pendingRequests.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={roleTone(item.user.role)}>{item.user.role}</StatusBadge>
                        <StatusBadge tone={requestTone(item.status)}>{item.status}</StatusBadge>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-950">{item.user.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{item.user.email}</p>
                      <p className="mt-2 text-xs text-slate-500">Diajukan {formatDateTime(item.requestedAt)}</p>
                      {item.note ? (
                        <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-600">
                          {item.note}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyKey === `request-${item.id}`}
                        onClick={() => void handleRequestReview(item.id, "APPROVED", item.user.email)}
                        className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `request-${item.id}`}
                        onClick={() => void handleRequestReview(item.id, "REJECTED", item.user.email)}
                        className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
          ) : (
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              <StateNotice title="Review reset password disembunyikan" tone="empty">
                Akun admin ini tidak punya permission `canReviewPasswordResets`, jadi queue request reset password tidak dibuka.
              </StateNotice>
            </section>
          )}
        </div>
      ) : null}

      {canReviewPasswordResets ? (
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">Riwayat reset password</h2>
            <p className="text-sm leading-6 text-slate-500">
              Section ini menampilkan request yang sudah selesai diproses supaya approval flow bisa diaudit tanpa harus buka audit trail mentah.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {loading ? (
            <StateNotice title="Memuat riwayat reset password" tone="loading">
              Riwayat reset password sedang diambil dari backend.
            </StateNotice>
          ) : reviewedRequests.length === 0 ? (
            <StateNotice title="Belum ada riwayat review" tone="empty">
              Request yang sudah approved, rejected, atau completed akan muncul di sini.
            </StateNotice>
          ) : (
            reviewedRequests.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={roleTone(item.user.role)}>{item.user.role}</StatusBadge>
                      <StatusBadge tone={requestTone(item.status)}>{item.status}</StatusBadge>
                    </div>
                    <h3 className="mt-3 text-base font-bold text-slate-950">{item.user.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.user.email}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Diajukan {formatDateTime(item.requestedAt)} | Direview {formatDateTime(item.reviewedAt)}
                    </p>
                    {item.reviewedBy ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Direview oleh {item.reviewedBy.name} ({item.reviewedBy.role})
                      </p>
                    ) : null}
                    {item.note ? (
                      <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-600">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
      ) : null}

      {canOpenAccountManagement ? (
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-950">All accounts</h2>
            <p className="text-sm leading-6 text-slate-500">
              Daftar ini mencakup user, seller, affiliate, kasir, admin, dan super admin sesuai hak akses akun yang sedang login.
            </p>
            <p className="text-sm leading-6 text-slate-500">
              Saat akun masih terhubung ke booking, wallet, withdraw, atau transaksi penting lain, sistem akan
              mengarsipkan akun dan mematikan akses login. Kalau tidak ada relasi penting, akun akan dihapus total.
            </p>
          </div>
        </div>

        <form className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]" onSubmit={handleSearchSubmit}>
          <Field label="Cari akun">
            <input
              className={inputClassName}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, phone, seller, atau kode affiliate"
            />
          </Field>
          <Field label="Filter role">
            <select
              className={inputClassName}
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              {visibleRoleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Filter status">
            <select
              className={inputClassName}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex h-[50px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
            >
              Terapkan
            </button>
          </div>
        </form>

        <div className="mt-5 overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Akun", "Role", "Status", "Reset password", "Aksi"].map((column) => (
                  <th key={column} className="whitespace-nowrap px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-sm text-slate-500" colSpan={5}>
                    Memuat daftar akun...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 text-sm text-slate-500" colSpan={5}>
                    Tidak ada akun yang cocok dengan filter saat ini.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account.id} className="border-t border-slate-200 align-top">
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="font-semibold text-slate-950">{account.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{account.email}</div>
                      {account.phone ? <div className="mt-1 text-xs text-slate-500">{account.phone}</div> : null}
                      {account.sellerProfile ? (
                        <div className="mt-2 text-xs text-emerald-700">
                          Seller: {account.sellerProfile.displayName} ({account.sellerProfile.status})
                        </div>
                      ) : null}
                      {account.affiliateProfile ? (
                        <div className="mt-2 text-xs text-sky-700">
                          Affiliate: {account.affiliateProfile.displayName} ({account.affiliateProfile.code})
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <StatusBadge tone={roleTone(account.role)}>{account.role}</StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="font-semibold text-slate-900">{account.status}</div>
                      {account.archivedAt ? (
                        <div className="mt-1 text-xs font-semibold text-rose-600">
                          Diarsipkan {formatDateTime(account.archivedAt)}
                        </div>
                      ) : null}
                      <div className="mt-1 text-xs text-slate-500">Update {formatDateTime(account.updatedAt)}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <StatusBadge tone={account.passwordResetEnabled ? "emerald" : "slate"}>
                        {account.passwordResetEnabled ? "OPEN" : "LOCKED"}
                      </StatusBadge>
                      {account.passwordResetEnabledAt ? (
                        <div className="mt-2 text-xs text-slate-500">Dibuka {formatDateTime(account.passwordResetEnabledAt)}</div>
                      ) : null}
                      {account.latestPasswordResetRequest ? (
                        <div className="mt-2 text-xs text-slate-500">
                          Request terakhir: {account.latestPasswordResetRequest.status} pada{" "}
                          {formatDateTime(account.latestPasswordResetRequest.requestedAt)}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="flex flex-wrap gap-2">
                        {canReviewPasswordResets ? (
                        <button
                          type="button"
                          disabled={busyKey === `reset-${account.id}`}
                          onClick={() => void handleResetAccess(account, !account.passwordResetEnabled)}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {account.passwordResetEnabled ? "Tutup akses reset" : "Buka akses reset"}
                        </button>
                        ) : null}

                        {canDirectlySetPassword ? (
                          <button
                            type="button"
                            disabled={busyKey === `password-${account.id}`}
                            onClick={() => void handleDirectPasswordSet(account)}
                            className="inline-flex items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Set password
                          </button>
                        ) : null}

                        {actorRole === "SUPER_ADMIN" && account.role === "ADMIN" ? (
                          <>
                            <button
                              type="button"
                              disabled={busyKey === `permission-${account.id}-canManageAccounts`}
                              onClick={() =>
                                void handleAdminPermissionToggle(
                                  account,
                                  "canManageAccounts",
                                  !account.adminPermissions.canManageAccounts
                                )
                              }
                              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {account.adminPermissions.canManageAccounts
                                ? "Cabut akses account mgmt"
                                : "Izinkan account mgmt"}
                            </button>
                            <button
                              type="button"
                              disabled={busyKey === `permission-${account.id}-canReviewPasswordResets`}
                              onClick={() =>
                                void handleAdminPermissionToggle(
                                  account,
                                  "canReviewPasswordResets",
                                  !account.adminPermissions.canReviewPasswordResets
                                )
                              }
                              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {account.adminPermissions.canReviewPasswordResets
                                ? "Cabut akses review reset"
                                : "Izinkan review reset"}
                            </button>
                          </>
                        ) : null}

                        {account.role === "ADMIN" ? (
                          <div className="basis-full text-[11px] leading-5 text-slate-500">
                            Permission admin:
                            {" "}
                            account management={String(account.adminPermissions.canManageAccounts)}
                            {" | "}
                            review reset={String(account.adminPermissions.canReviewPasswordResets)}
                          </div>
                        ) : null}

                        {canManageAccounts ? (
                        <button
                          type="button"
                          disabled={busyKey === `delete-${account.id}`}
                          onClick={() => void handleDeleteAccount(account)}
                          className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function StateNotice({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "loading" | "empty" | "error";
  children: React.ReactNode;
}) {
  const palette =
    tone === "loading"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-[24px] border px-5 py-4 ${palette}`}>
      <p className="text-sm font-bold">{title}</p>
      <div className="mt-2 text-sm leading-6">{children}</div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100";
