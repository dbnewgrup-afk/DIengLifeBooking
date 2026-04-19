"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import AuthPortalShell from "@/components/auth/AuthPortalShell";
import { API_BASE_URL, PUBLIC_APP_URL } from "@/lib/constants";
import { setSession } from "@/lib/auth/session";
import {
  isRoleAllowedForPath,
  normalizeRole,
  resolveDashboardPath,
} from "@/lib/auth/role-routing";

type RoleLoginPageProps = {
  audience: "admin" | "seller" | "affiliate";
  title: string;
  description: string;
  endpoint: string;
  submitLabel: string;
  supportText: string;
};

type LoginResponse = {
  accessToken?: string;
  user?: {
    role?: string;
  };
  auth?: {
    portal?: string;
    redirectTo?: string;
  };
  error?: string;
  message?: string;
};

type LoginAttemptResult = {
  res: Response;
  json: LoginResponse;
  endpoint: string;
};

function externalPublicPath(path: string) {
  return `${PUBLIC_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message?.trim() || "Login gagal. Coba lagi.";
    if (/failed to fetch|networkerror|network error/i.test(message)) {
      return `Backend API tidak terhubung. Pastikan service apps/api aktif dan bisa diakses di ${API_BASE_URL}.`;
    }
    return message;
  }
  return "Login gagal. Coba lagi.";
}

export default function RoleLoginPage({
  audience,
  title,
  description,
  endpoint,
  submitLabel,
}: RoleLoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") || "";
  const returnTo = searchParams.get("returnTo") || searchParams.get("next");
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState(prefilledEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contextualLinks =
    audience === "seller"
      ? [
          { href: externalPublicPath("/"), label: "Web public", external: true },
          { href: "/register/seller", label: "Daftar seller" },
        ]
      : audience === "affiliate"
        ? [
            { href: externalPublicPath("/"), label: "Web public", external: true },
            { href: "/register/affiliate", label: "Daftar affiliate" },
          ]
      : [{ href: externalPublicPath("/"), label: "Web public", external: true }];

  async function persistSession(
    token: string,
    role: string,
    auth?: LoginResponse["auth"]
  ) {
    const res = await fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        role,
        portal: auth?.portal,
        redirectTo: auth?.redirectTo,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gagal set cookie auth: ${res.status} ${text}`);
    }

    const normalizedRole = normalizeRole(role);
    setSession(token, normalizedRole, true);
  }

  async function submitLogin(targetEndpoint: string): Promise<LoginAttemptResult> {
    const res = await fetch(`${API_BASE_URL}${targetEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const json = (await res.json().catch(() => ({}))) as LoginResponse;
    return { res, json, endpoint: targetEndpoint };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const fallbackEndpoint =
        audience === "admin" ? "/auth/login/seller" : "/auth/login/admin";

      let attempt = await submitLogin(endpoint);
      let redirectedByRole = false;

      if (!attempt.res.ok && attempt.res.status === 403) {
        const fallbackAttempt = await submitLogin(fallbackEndpoint);
        if (fallbackAttempt.res.ok) {
          attempt = fallbackAttempt;
          redirectedByRole = true;
        }
      }

      if (!attempt.res.ok) {
        throw new Error(attempt.json?.message || attempt.json?.error || "Login gagal.");
      }

      const token = attempt.json?.accessToken;
      const role =
        normalizeRole(attempt.json?.user?.role) ?? (audience === "seller" ? "SELLER" : "ADMIN");

      if (!token) {
        throw new Error("Token login tidak ditemukan.");
      }

      const defaultTarget =
        typeof attempt.json?.auth?.redirectTo === "string" && attempt.json.auth.redirectTo.startsWith("/")
          ? attempt.json.auth.redirectTo
          : resolveDashboardPath(role);
      const nextTarget =
        returnTo && isRoleAllowedForPath(role, returnTo) ? returnTo : defaultTarget;

      await persistSession(token, role, attempt.json?.auth);
      toast.success(
        redirectedByRole
          ? `Akun ${role === "SELLER" ? "seller" : "admin"} terdeteksi. Mengarahkan ke dashboard yang sesuai.`
          : "Login berhasil"
      );
      router.replace(nextTarget);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPortalShell
      eyebrow={audience === "seller" ? "Seller Login" : "Admin Login"}
      audience={audience === "seller" ? "Portal seller" : "Portal internal"}
      title={title}
      description={description}
      highlights={[]}
      steps={[]}
      links={contextualLinks}
    >
      <div className="authCard">
        {registered ? (
          <div className="authAlert authAlertSuccess">
            Akun baru sudah dibuat. Tinggal login.
          </div>
        ) : null}

        {error ? (
          <div className="authAlert authAlertError">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="authField">
            <label htmlFor={`${audience}-email`} className="authLabel">
              Email
            </label>
            <input
              id={`${audience}-email`}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor={`${audience}-password`} className="authLabel">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="authToggle"
              >
                {showPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <input
              id={`${audience}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Masukkan password"
              className="input authInput"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary authSubmit"
          >
            {loading ? "Memproses..." : submitLabel}
          </button>
        </form>
      </div>

      <style jsx>{`
        .authCard {
          position: relative;
          z-index: 1;
        }

        .authAlert {
          margin-bottom: 14px;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.55;
        }

        .authAlertSuccess {
          border: 1px solid #a7f3d0;
          background: #ecfdf5;
          color: #047857;
        }

        .authAlertError {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .authForm {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .authField {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .authFieldHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .authLabel {
          font-size: 12px;
          font-weight: 800;
          color: #2c3650;
        }

        .authInput {
          width: 100%;
          min-height: 52px;
          border-radius: 14px;
          padding-inline: 14px;
          font-size: 14px;
          border-color: #c9e7ff;
          background: #ffffff;
          box-shadow: none;
        }

        .authToggle {
          border: 0;
          background: transparent;
          padding: 0;
          font-size: 12px;
          font-weight: 700;
          color: #2094d1;
          cursor: pointer;
        }

        .authToggle:hover {
          color: #0f6aa8;
        }

        .authSubmit {
          width: 100%;
          min-height: 50px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 800;
          background: linear-gradient(90deg, #0f6aa8, #1fa0dc);
          border-color: #0f6aa8;
          box-shadow: 0 16px 28px rgba(15, 106, 168, 0.24);
        }
      `}</style>
    </AuthPortalShell>
  );
}
