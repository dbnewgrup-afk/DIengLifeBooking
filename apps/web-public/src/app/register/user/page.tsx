"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PublicPortalShell } from "@/components/auth/PublicPortalShell";
import { useLang } from "@/components/i18n/lang";
import { API_BASE_URL, persistPublicSession } from "@/lib/auth";
import { appendPublicReturnTo, resolvePublicReturnTo } from "@/lib/public-redirect";

export default function UserRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t: L } = useLang();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordMismatch = useMemo(
    () => form.confirmPassword.length > 0 && form.password !== form.confirmPassword,
    [form.confirmPassword, form.password]
  );
  const redirectTarget = useMemo(
    () => resolvePublicReturnTo(searchParams.get("returnTo"), "/"),
    [searchParams]
  );
  const loginHref = useMemo(
    () => appendPublicReturnTo("/login/user", redirectTarget),
    [redirectTarget]
  );

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError(
        L(
          "Nama, email, dan password wajib diisi.",
          "Name, email, and password are required."
        )
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(
        L(
          "Konfirmasi password belum sama.",
          "Password confirmation does not match."
        )
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json?.message ||
            json?.error ||
            L("Register user gagal.", "User registration failed.")
        );
      }

      const token = json?.accessToken;
      const role = json?.user?.role || "USER";

      if (!token) {
        throw new Error(
          L(
            "Token user tidak ditemukan setelah register.",
            "User token was not found after registration."
          )
        );
      }

      await persistPublicSession(token, role, json?.refreshToken);
      router.replace(resolvePublicReturnTo(json?.auth?.redirectTo, redirectTarget));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : L(
              "Register user gagal. Coba lagi.",
              "User registration failed. Please try again."
            )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPortalShell
      eyebrow={L("Register User", "Register User")}
      title={L("Buat akun user", "Create a user account")}
      description={L(
        "Isi data dasar akun user untuk booking lebih cepat, checkout lebih ringkas, dan dashboard customer yang tetap sinkron.",
        "Fill in your basic user account details for faster booking, smoother checkout, and a synced customer dashboard."
      )}
      links={[
        { href: loginHref, label: L("Login user", "User login") },
        { href: "/", label: L("Web public", "Public site") },
      ]}
    >
      <div className="authCard">
        {error ? <div className="authAlert authAlertError">{error}</div> : null}

        {passwordMismatch ? (
          <div className="authAlert authAlertWarn">
            {L(
              "Konfirmasi password masih belum sama.",
              "Password confirmation still does not match."
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="authField">
            <label htmlFor="register-user-name" className="authLabel">
              {L("Nama lengkap", "Full name")}
            </label>
            <input
              id="register-user-name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={L("Masukkan nama lengkap", "Enter your full name")}
              className="authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="register-user-email" className="authLabel">
              Email
            </label>
            <input
              id="register-user-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@example.com"
              className="authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="register-user-phone" className="authLabel">
              {L("Nomor WhatsApp", "WhatsApp number")}
            </label>
            <input
              id="register-user-phone"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder={L("Opsional untuk kebutuhan booking", "Optional for booking needs")}
              className="authInput"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor="register-user-password" className="authLabel">
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
              id="register-user-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder={L("Minimal 8 karakter", "Minimum 8 characters")}
              className="authInput"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor="register-user-confirm-password" className="authLabel">
                {L("Konfirmasi password", "Confirm password")}
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="authToggle"
              >
                {showConfirmPassword ? L("Sembunyikan", "Hide") : L("Tampilkan", "Show")}
              </button>
            </div>
            <input
              id="register-user-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder={L("Ulangi password", "Repeat your password")}
              className="authInput"
            />
          </div>

          <button
            type="submit"
            disabled={loading || passwordMismatch}
            className="authSubmit"
          >
            {loading ? L("Membuat akun...", "Creating account...") : L("Buat akun user", "Create user account")}
          </button>
        </form>

        <div className="authMetaRow">
          <Link href={loginHref} className="authInlineLink">
            {L("Sudah punya akun? Masuk", "Already have an account? Sign in")}
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

        .authAlertWarn {
          border: 1px solid #fde68a;
          background: #fffbeb;
          color: #b45309;
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
