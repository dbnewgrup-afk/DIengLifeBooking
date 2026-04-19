"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  API_BASE_URL,
  clearPublicSession,
  resolvePublicSession,
} from "@/lib/auth";

type PasswordResetState = {
  userId: string;
  role: string;
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

async function requestWithSession<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await resolvePublicSession("USER");
  if (!session) {
    throw new Error("Sesi buyer tidak valid. Login ulang dulu.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${session.token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      await clearPublicSession();
    }
    throw new Error(extractErrorMessage(payload, "Request reset password buyer gagal."));
  }

  return payload as T;
}

export default function BuyerResetPasswordPage() {
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
      const response = await requestWithSession<{ ok: true } & PasswordResetState>("/auth/password-reset-access/me");
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
        text: error instanceof Error ? error.message : "Gagal memuat status reset password buyer.",
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
      await requestWithSession("/auth/password-reset-access/request", {
        method: "POST",
        body: JSON.stringify({ note: note.trim() || null }),
      });
      setFeedback({
        tone: "success",
        text: "Pengajuan reset password buyer berhasil dikirim.",
      });
      setNote("");
      await loadState();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Gagal mengirim pengajuan reset password buyer.",
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
      await requestWithSession("/auth/password-reset/me", {
        method: "POST",
        body: JSON.stringify({ newPassword }),
      });
      setFeedback({
        tone: "success",
        text: "Password buyer berhasil diganti. Akses reset password ditutup lagi oleh sistem.",
      });
      setNewPassword("");
      setConfirmPassword("");
      await loadState();
    } catch (error) {
      setFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Gagal mengganti password buyer.",
      });
    } finally {
      setBusy(false);
    }
  }

  const hasPendingRequest = state?.latestRequest?.status === "PENDING";

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Buyer Reset Password</p>
              <h1 className="mt-3 text-3xl font-black">Ajukan atau pakai akses reset password buyer</h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Halaman ini dipakai buyer untuk meminta akses reset password ke admin/super admin. Kalau akses sudah dibuka, password baru bisa langsung disimpan dari sini.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Kembali ke dashboard buyer
            </Link>
          </div>
        </section>

        {feedback ? (
          <div
            className={`rounded-[22px] border px-4 py-3 text-sm font-semibold ${
              feedback.tone === "success"
                ? "border-emerald-200/60 bg-emerald-50 text-emerald-950"
                : "border-rose-200/60 bg-rose-50 text-rose-900"
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
          {loading ? (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-4 text-sm text-sky-100">
              Memuat status reset password buyer...
            </div>
          ) : state ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <InfoCard label="Role akun" value={state.role} />
                <InfoCard
                  label="Status akses"
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Request terbaru</div>
                  <div className="mt-3 text-sm font-semibold text-white">{state.latestRequest.status}</div>
                  <div className="mt-1 text-sm text-slate-300">Diajukan {formatDateTime(state.latestRequest.requestedAt)}</div>
                  {state.latestRequest.reviewedAt ? (
                    <div className="mt-1 text-sm text-slate-300">Direview {formatDateTime(state.latestRequest.reviewedAt)}</div>
                  ) : null}
                  {state.latestRequest.note ? (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-300">
                      {state.latestRequest.note}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {state.passwordResetEnabled ? (
                <form className="grid gap-4" onSubmit={handleResetPassword}>
                  <div>
                    <h2 className="text-xl font-black text-white">Set password baru</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Akses reset kamu sedang aktif, jadi password baru bisa langsung disimpan sekarang.
                    </p>
                  </div>

                  <Field label="Password baru">
                    <input
                      className={inputClassName}
                      type="password"
                      minLength={8}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Konfirmasi password baru">
                    <input
                      className={inputClassName}
                      type="password"
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
                  >
                    {busy ? "Menyimpan password..." : "Simpan password baru"}
                  </button>
                </form>
              ) : (
                <form className="grid gap-4" onSubmit={handleRequestAccess}>
                  <div>
                    <h2 className="text-xl font-black text-white">Ajukan pembukaan akses reset</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Kalau akses reset masih tertutup, kirim pengajuan dari sini. Admin atau super admin akan membuka akses kalau request disetujui.
                    </p>
                  </div>

                  <Field label="Catatan opsional">
                    <textarea
                      className={`${inputClassName} min-h-[120px]`}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Contoh: ganti password karena akun dipakai keluarga lain."
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={busy || hasPendingRequest}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-sky-300"
                  >
                    {busy ? "Mengirim pengajuan..." : hasPendingRequest ? "Pengajuan masih pending" : "Ajukan reset password"}
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className="mt-2 text-lg font-black text-white">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10";
