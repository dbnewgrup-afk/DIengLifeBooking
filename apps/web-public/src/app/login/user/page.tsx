"use client";

export const dynamic = "force-dynamic";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PublicPortalShell } from "@/components/auth/PublicPortalShell";
import { useLang } from "@/components/i18n/lang";
import { API_BASE_URL, persistPublicSession } from "@/lib/auth";
import { appendPublicReturnTo, resolvePublicReturnTo } from "@/lib/public-redirect";

export default function UserLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t: L } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = useMemo(
    () => resolvePublicReturnTo(searchParams.get("returnTo"), "/"),
    [searchParams]
  );
  const registerHref = useMemo(
    () => appendPublicReturnTo("/register/user", redirectTarget),
    [redirectTarget]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError(L("Email dan password wajib diisi.", "Email and password are required."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.message ||
            json?.error ||
            L("Login user gagal.", "User login failed.")
        );
      }

      const token = json?.accessToken;
      const role = json?.user?.role || "USER";

      if (!token) {
        throw new Error(
          L(
            "Token login user tidak ditemukan.",
            "User login token was not found."
          )
        );
      }

      await persistPublicSession(token, role, json?.refreshToken);
      router.replace(resolvePublicReturnTo(json?.auth?.redirectTo, redirectTarget));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : L("Login user gagal. Coba lagi.", "User login failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPortalShell
      eyebrow={L("Login User", "User Login")}
      title={L("Masuk sebagai user", "Sign in as user")}
      description={L(
        "Gunakan akun user untuk lanjut booking, checkout, dan melihat dashboard akun customer dengan data yang sama.",
        "Use your user account to continue booking, checkout, and access your customer dashboard with the same data."
      )}
      links={[
        { href: registerHref, label: L("Daftar user", "Register user") },
        { href: "/", label: L("Web public", "Public site") },
      ]}
    >
      <div className="authCard">
        {error ? <div className="authAlert authAlertError">{error}</div> : null}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="authField">
            <label htmlFor="user-email" className="authLabel">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={L("name@example.com", "name@example.com")}
              className="authInput"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor="user-password" className="authLabel">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="authToggle"
              >
                {showPassword ? L("Sembunyikan", "Hide") : L("Tampilkan", "Show")}
              </button>
            </div>
            <input
              id="user-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={L("Masukkan password", "Enter your password")}
              className="authInput"
            />
          </div>

          <button type="submit" disabled={loading} className="authSubmit">
            {loading ? L("Memproses...", "Processing...") : L("Masuk sebagai user", "Sign in as user")}
          </button>
        </form>

        <div className="authMetaRow">
          <Link href={registerHref} className="authInlineLink">
            {L("Belum punya akun? Daftar", "Don't have an account? Register")}
          </Link>
        </div>
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
          border: 1px solid #c9e7ff;
          border-radius: 14px;
          padding-inline: 14px;
          font-size: 14px;
          background: #ffffff;
          color: #101828;
          outline: none;
        }

        .authInput:focus {
          border-color: #7dd3fc;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
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
          border: 1px solid #0f6aa8;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          background: linear-gradient(90deg, #0f6aa8, #1fa0dc);
          box-shadow: 0 16px 28px rgba(15, 106, 168, 0.24);
          cursor: pointer;
        }

        .authSubmit:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .authMetaRow {
          margin-top: 14px;
          display: flex;
          justify-content: center;
        }

        .authInlineLink {
          font-size: 13px;
          font-weight: 700;
          color: #0f6aa8;
          text-decoration: none;
        }

        .authInlineLink:hover {
          text-decoration: underline;
        }
      `}</style>
    </PublicPortalShell>
  );
}
