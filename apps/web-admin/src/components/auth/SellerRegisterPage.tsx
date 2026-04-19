"use client";

import Link from "next/link";
import { useState } from "react";
import AuthPortalShell from "@/components/auth/AuthPortalShell";
import { toast } from "@/components/ui/Toast";
import { API_BASE_URL, PUBLIC_APP_URL } from "@/lib/constants";

type SellerRegisterForm = {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  legalName: string;
  note: string;
  password: string;
  confirmPassword: string;
};

const INITIAL_FORM: SellerRegisterForm = {
  name: "",
  email: "",
  phone: "",
  businessName: "",
  legalName: "",
  note: "",
  password: "",
  confirmPassword: "",
};

function publicPath(path: string) {
  return `${PUBLIC_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function SellerRegisterPage() {
  const [form, setForm] = useState<SellerRegisterForm>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function updateField<K extends keyof SellerRegisterForm>(key: K, value: SellerRegisterForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.businessName.trim()) {
      setError("Nama PIC, email, WhatsApp, dan nama usaha wajib diisi.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          businessName: form.businessName.trim(),
          legalName: form.legalName.trim() || undefined,
          note: form.note.trim() || undefined,
          password: form.password,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message || json?.error || "Register seller gagal.");
      }

      const nextUrl = `/login/seller?registered=1&email=${encodeURIComponent(
        form.email.trim().toLowerCase()
      )}`;

      setSuccessMessage(
        "Akun seller berhasil dibuat. Sekarang lanjut login ke dashboard seller."
      );
      toast.success("Akun seller berhasil dibuat.");
      window.setTimeout(() => {
        window.location.assign(nextUrl);
      }, 900);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Register seller gagal. Coba lagi.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPortalShell
      eyebrow="Seller Register"
      audience="Portal seller"
      title="Daftar sebagai seller"
      description="Form register seller memakai desain auth yang sama persis dengan portal login lain supaya jalur masuk dan onboarding tetap konsisten."
      highlights={[]}
      steps={[]}
      links={[
        { href: "/login/seller", label: "Login seller" },
        { href: "/login/admin", label: "Login admin" },
        { href: publicPath("/"), label: "Web public", external: true },
      ]}
    >
      <div className="authCard">
        {error ? <div className="authAlert authAlertError">{error}</div> : null}

        {successMessage ? (
          <div className="authAlert authAlertSuccess">{successMessage}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="authForm">
          <div className="authField">
            <label htmlFor="seller-name" className="authLabel">
              Nama PIC
            </label>
            <input
              id="seller-name"
              autoComplete="name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Nama penanggung jawab"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="seller-email" className="authLabel">
              Email
            </label>
            <input
              id="seller-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="name@example.com"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="seller-phone" className="authLabel">
              WhatsApp aktif
            </label>
            <input
              id="seller-phone"
              inputMode="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="08xxxxxxxxxx"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="seller-business" className="authLabel">
              Nama usaha
            </label>
            <input
              id="seller-business"
              value={form.businessName}
              onChange={(event) => updateField("businessName", event.target.value)}
              placeholder="Contoh: Villa Panorama Dieng"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="seller-legal" className="authLabel">
              Nama legal usaha
            </label>
            <input
              id="seller-legal"
              value={form.legalName}
              onChange={(event) => updateField("legalName", event.target.value)}
              placeholder="Opsional"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <label htmlFor="seller-note" className="authLabel">
              Catatan usaha
            </label>
            <textarea
              id="seller-note"
              rows={4}
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Tulis singkat jenis usaha atau kebutuhan onboarding."
              className="textarea authTextarea"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor="seller-password" className="authLabel">
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
              id="seller-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Minimal 8 karakter"
              className="input authInput"
            />
          </div>

          <div className="authField">
            <div className="authFieldHead">
              <label htmlFor="seller-confirm-password" className="authLabel">
                Konfirmasi password
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="authToggle"
              >
                {showConfirmPassword ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <input
              id="seller-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              placeholder="Ulangi password"
              className="input authInput"
            />
          </div>

          <button type="submit" className="btn btn-primary authSubmit" disabled={loading}>
            {loading ? "Mendaftarkan seller..." : "Buat akun seller"}
          </button>
        </form>

        <div className="authMetaRow">
          <Link href="/login/seller" className="authInlineLink">
            Sudah punya akun seller? Login
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

        .authInput,
        .authTextarea {
          width: 100%;
          border-radius: 14px;
          font-size: 14px;
          border-color: #c9e7ff;
          background: #ffffff;
          box-shadow: none;
        }

        .authInput {
          min-height: 52px;
          padding-inline: 14px;
        }

        .authTextarea {
          min-height: 120px;
          padding: 14px;
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
    </AuthPortalShell>
  );
}
