"use client";

import { useEffect, useMemo, useState } from "react";
import { clearToken, getRole as readRoleFromToken, getToken as readTokenFromSession } from "@/lib/auth/session";
import type { Role } from "@/lib/api/schemas";

export type AuthGuardProps = {
  children: React.ReactNode;
  /** Path redirect jika tidak ada token. Default: "/login/admin" */
  redirectTo?: string;
  /** Jika diisi, cek role harus termasuk salah satu allowed */
  requireRoles?: readonly Role[];
  /** Custom getter token (opsional). Default: baca storage 'admin_session' */
  getToken?: () => string | null;
  /** Custom getter role (opsional). Default: storage 'admin_role' */
  getRole?: () => Role | null;
  /** Jika true, render children meski belum valid, tapi segera redirect. Default false. */
  renderDuringRedirect?: boolean;
};

function defaultGetToken(): string | null {
  return readTokenFromSession();
}
function defaultGetRole(): Role | null {
  return readRoleFromToken() ?? null;
}

export default function AuthGuard({
  children,
  redirectTo = "/login/admin",
  requireRoles,
  getToken = defaultGetToken,
  getRole = defaultGetRole,
  renderDuringRedirect = false,
}: AuthGuardProps) {
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const loginUrl = useMemo(() => redirectTo, [redirectTo]);

  const needRoleCheck = useMemo(
    () => Array.isArray(requireRoles) && requireRoles.length > 0,
    [requireRoles]
  );

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthorized(false);
      setChecked(true);
      return;
    }

    if (needRoleCheck) {
      const role = getRole();
      if (!role || !requireRoles!.includes(role)) {
        setAuthorized(false);
        setChecked(true);
        return;
      }
    }

    setAuthorized(true);
    setChecked(true);
  }, [getRole, getToken, needRoleCheck, requireRoles]);

  // UX: skeleton kecil saat cek
  if (!checked && !renderDuringRedirect) {
    return (
      <div className="grid min-h-[200px] place-items-center">
        <div className="animate-pulse text-sm text-slate-500">Memeriksa sesi…</div>
      </div>
    );
  }

  if (!authorized && !renderDuringRedirect) {
    return (
      <div className="grid min-h-[280px] place-items-center px-6">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white/85 px-6 py-7 text-center shadow-sm backdrop-blur">
          <div className="text-sm font-semibold text-slate-900">Sesi tidak valid</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            Sesi login tidak cocok untuk halaman ini atau sudah tidak aktif. Kamu bisa login ulang
            atau logout dulu untuk membersihkan token yang nyangkut.
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.assign(loginUrl);
                }
              }}
              className="inline-flex rounded-full border border-slate-300 bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Login sekarang
            </button>
            <button
              type="button"
              disabled={loggingOut}
              onClick={async () => {
                setLoggingOut(true);
                try {
                  await fetch("/api/auth/clear-cookie", { method: "POST" });
                } finally {
                  clearToken();
                  if (typeof window !== "undefined") {
                    window.location.assign(loginUrl);
                  }
                }
              }}
              className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60"
            >
              {loggingOut ? "Membersihkan..." : "Logout & bersihkan sesi"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
