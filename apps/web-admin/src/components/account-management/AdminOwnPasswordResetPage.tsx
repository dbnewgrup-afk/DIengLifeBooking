"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { ApiError, Role } from "@/lib/api/schemas";

type PasswordResetState = {
  userId: string;
  role: Role;
  passwordResetEnabled: boolean;
  passwordResetEnabledAt?: string | null;
  latestRequest?: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
    note?: string | null;
    requestedAt: string;
    reviewedAt?: string | null;
  } | null;
};

type AdminOwnPasswordResetPageProps = {
  title: string;
  description: string;
  homeHref: string;
  homeLabel: string;
};

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

export default function AdminOwnPasswordResetPage({
  title,
  description,
  homeHref,
  homeLabel,
}: AdminOwnPasswordResetPageProps) {
  const [state, setState] = useState<PasswordResetState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadState();
  }, []);

  async function loadState() {
    setLoading(true);
    try {
      const response = await api.get<{ ok: true } & PasswordResetState>("/auth/password-reset-access/me");
      setState({
        userId: response.userId,
        role: response.role,
        passwordResetEnabled: response.passwordResetEnabled,
        passwordResetEnabledAt: response.passwordResetEnabledAt,
        latestRequest: response.latestRequest ?? null,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal memuat status reset password."),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    try {
      await api.post("/auth/password-reset-access/request", {
        note: note.trim() || null,
      });
      setFeedback({
        tone: "success",
        text: "Pengajuan reset password berhasil dikirim. Tunggu approval dari admin atau super admin.",
      });
      setNote("");
      await loadState();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal mengirim pengajuan reset password."),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setFeedback({
        tone: "error",
        text: "Konfirmasi password belum sama.",
      });
      return;
    }

    setBusy(true);
    setFeedback(null);

    try {
      await api.post("/auth/password-reset/me", {
        newPassword,
      });
      setFeedback({
        tone: "success",
        text: "Password berhasil diganti. Akses reset password langsung ditutup lagi oleh sistem.",
      });
      setNewPassword("");
      setConfirmPassword("");
      await loadState();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: getErrorMessage(error, "Gagal mengganti password."),
      });
    } finally {
      setBusy(false);
    }
  }

  const hasPendingRequest = state?.latestRequest?.status === "PENDING";

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-slate-950/80 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-sky-300">Reset Password Saya</p>
            <h1 className="mt-3 text-3xl font-black">{title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
          </div>

          <Link
            href={homeHref}
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            {homeLabel}
          </Link>
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

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        {loading ? (
          <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">
            Memuat status reset password...
          </div>
        ) : state ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard label="Role akun" value={state.role} />
              <InfoCard
                label="Akses reset"
                value={state.passwordResetEnabled ? "Terbuka" : hasPendingRequest ? "Menunggu approval" : "Tertutup"}
              />
              <InfoCard
                label="Terakhir berubah"
                value={
                  state.passwordResetEnabledAt
                    ? formatDateTime(state.passwordResetEnabledAt)
                    : state.latestRequest
                      ? formatDateTime(state.latestRequest.requestedAt)
                      : "-"
                }
              />
            </div>

            {state.latestRequest ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Riwayat request terbaru</div>
                <div className="mt-3 text-sm font-semibold text-slate-950">{state.latestRequest.status}</div>
                <div className="mt-1 text-sm text-slate-600">Diajukan {formatDateTime(state.latestRequest.requestedAt)}</div>
                {state.latestRequest.reviewedAt ? (
                  <div className="mt-1 text-sm text-slate-600">Direview {formatDateTime(state.latestRequest.reviewedAt)}</div>
                ) : null}
                {state.latestRequest.note ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600">
                    {state.latestRequest.note}
                  </div>
                ) : null}
              </div>
            ) : null}

            {state.passwordResetEnabled ? (
              <form className="grid gap-4" onSubmit={handleResetPassword}>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Ganti password sekarang</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Karena akses reset sedang dibuka oleh admin/super admin, kamu bisa langsung set password baru dari halaman ini.
                  </p>
                </div>

                <Field label="Password baru">
                  <input
                    className={inputClassName}
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
                <Field label="Konfirmasi password baru">
                  <input
                    className={inputClassName}
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </Field>

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
                >
                  {busy ? "Menyimpan password..." : "Simpan password baru"}
                </button>
              </form>
            ) : (
              <form className="grid gap-4" onSubmit={handleRequestAccess}>
                <div>
                  <h2 className="text-xl font-black text-slate-950">Ajukan akses reset password</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Kalau akses reset masih tertutup, kirim pengajuan dari sini. Admin atau super admin akan mereview dan membuka akses kalau disetujui.
                  </p>
                </div>

                <Field label="Catatan opsional">
                  <textarea
                    className={`${inputClassName} min-h-[120px]`}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Contoh: minta buka akses reset karena akun dipakai shift baru."
                  />
                </Field>

                <button
                  type="submit"
                  disabled={busy || hasPendingRequest}
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-200"
                >
                  {busy ? "Mengirim pengajuan..." : hasPendingRequest ? "Pengajuan masih pending" : "Ajukan reset password"}
                </button>
              </form>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 text-lg font-black text-slate-950">{value}</div>
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

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100";
