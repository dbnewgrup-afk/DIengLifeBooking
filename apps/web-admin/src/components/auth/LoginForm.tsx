"use client";

import { useState } from "react";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  errorMessage?: string;
  defaultEmail?: string;
};

export default function LoginForm({
  onSubmit,
  errorMessage,
  defaultEmail = "",
}: LoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : "Gagal login. Coba lagi.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalError("Email dan password wajib diisi.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setLocalError("Format email tidak valid.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ email: trimmedEmail, password });
    } catch (error: unknown) {
      setLocalError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen">
      {/* pola background */}
      <svg className="pattern" aria-hidden="true">
        <defs>
          <symbol id="ico-villa" viewBox="0 0 24 24">
            <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" fill="currentColor" />
          </symbol>
          <symbol id="ico-jeep" viewBox="0 0 24 24">
            <path d="M3 13v-3l2-3h9l2 3v3h1a2 2 0 1 1 0 4h-1v-1H5v1H4a2 2 0 1 1 0-4h1v-3h-2z" fill="currentColor" />
          </symbol>
          <symbol id="ico-car" viewBox="0 0 24 24">
            <path d="M5 12l2-4h10l2 4v4h1a2 2 0 1 1 0 4h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3a2 2 0 1 1 0-4h2v-4z" fill="currentColor" />
          </symbol>
          <symbol id="ico-camera" viewBox="0 0 24 24">
            <path d="M4 7h4l2-2h4l2 2h4v12H4V7zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" fill="currentColor" />
          </symbol>

          <pattern id="tile" width="120" height="120" patternUnits="userSpaceOnUse">
            <g fill="#001826">
              <use href="#ico-villa" x="12" y="12" width="20" height="20" />
              <use href="#ico-jeep" x="72" y="18" width="20" height="20" />
              <use href="#ico-car" x="36" y="72" width="20" height="20" />
              <use href="#ico-camera" x="90" y="78" width="20" height="20" />
            </g>
          </pattern>

          <radialGradient id="vignette">
            <stop offset="65%" stopColor="transparent" />
            <stop offset="100%" stopColor="#022F40" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#tile)" opacity="0.08" />
        <rect width="100%" height="100%" fill="url(#vignette)" opacity="0.45" />
      </svg>

      {/* kartu login */}
      <div className="card">
        <div className="cardHead">
          <span className="pill"><span className="dot" />Akses Admin</span>
          <h1 className="title">Masuk ke Admin</h1>
          <p className="sub">Gunakan kredensial sesuai role. Aktivitas akan diaudit.</p>
        </div>

        {(localError || errorMessage) && (
          <div className="alert">{localError || errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />

          <label htmlFor="password" className="label">Password</label>
          <div className="pwdWrap">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pwd"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="toggle"
              aria-label={showPwd ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" disabled={loading} className="submit">
            {loading ? "Masuk..." : "Masuk"}
          </button>

          <p className="hint">
            Lupa password? <span className="link">Hubungi admin</span>
          </p>
        </form>

        <div className="stripe" />
      </div>

      <style jsx>{`
        /* paksa body full dan non-scroll agar nggak kelihatan konten di bawah */
        :global(html, body, #__next) { height: 100%; }
        :global(body) { margin: 0; overflow: hidden; }

        .screen {
          --blue: #38AECC;
          --donker: #022F40;
          --bg-top: #0B3C55;
          --panel: rgba(255, 255, 255, 0.1);
          --panel-border: rgba(255, 255, 255, 0.15);
          --ring: rgba(255, 255, 255, 0.25);
          --text: rgba(255, 255, 255, 0.95);
          --muted: rgba(226, 240, 247, 0.9);

          position: fixed;   /* kunci ke viewport, full layar */
          inset: 0;          /* top/right/bottom/left = 0 */
          width: 100vw;
          height: 100vh;
          z-index: 50;       /* nutupin layout lain */
          color: var(--text);
          background:
            radial-gradient(60% 40% at 30% 18%, rgba(56,174,204,0.33) 0%, transparent 60%),
            radial-gradient(40% 30% at 80% 10%, rgba(56,174,204,0.22) 0%, transparent 60%),
            linear-gradient(180deg, var(--bg-top) 0%, var(--donker) 100%);
          overflow: hidden;
        }

        .pattern {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .card {
          position: absolute;
          left: 50%;
          top: 22%;
          transform: translateX(-50%);
          width: min(92vw, 460px);
          background: var(--panel);
          border: 1px solid var(--panel-border);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.35);
          overflow: hidden;
        }
        @media (max-height: 680px) {
          .card { top: 16%; }
        }

        .cardHead { padding: 20px 22px 6px 22px; }
        .pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.12); font-size: 12px; letter-spacing: .3px; }
        .dot { width: 8px; height: 8px; border-radius: 999px; background: #5CF6A8; }
        .title { margin: 10px 0 4px; font-size: 26px; font-weight: 700; line-height: 1.15; }
        .sub { margin: 0 0 8px; font-size: 13px; color: rgba(226,240,247,0.85); }

        .alert { margin: 0 22px 10px; padding: 10px 12px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); color: #ffe7e7; font-size: 13px; }

        .form { display: grid; grid-template-columns: 1fr; row-gap: 10px; padding: 0 22px 20px 22px; }
        .label { font-size: 13px; font-weight: 600; color: rgba(246,251,255,0.92); }
        .input { width: 100%; height: 40px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--panel-border); background: rgba(255,255,255,0.85); color: #0f172a; outline: none; font-size: 14px; transition: box-shadow .15s ease, border-color .15s ease, background .15s ease; }
        .input::placeholder { color: #687385; }
        .input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px rgba(56,174,204,0.35); background: #fff; }

        .pwdWrap { position: relative; }
        .pwd { padding-right: 64px; }
        .toggle { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); height: 30px; padding: 0 10px; border-radius: 10px; font-size: 12px; color: #0b2a3a; background: rgba(226,240,247,0.85); border: 1px solid rgba(255,255,255,0.5); cursor: pointer; }
        .toggle:hover { filter: brightness(0.97); }
        .toggle:active { transform: translateY(-50%) scale(0.98); }

        .submit { margin-top: 6px; height: 42px; border: none; border-radius: 12px; background: linear-gradient(180deg, #38AECC 0%, #2AA2C1 100%); color: #022F40; font-weight: 700; letter-spacing: .2px; cursor: pointer; box-shadow: 0 10px 22px rgba(9, 34, 46, 0.35); transition: transform .05s ease, opacity .15s ease; }
        .submit:hover { opacity: .95; }
        .submit:active { transform: scale(0.99); }
        .submit:disabled { opacity: .6; cursor: not-allowed; }

        .hint { margin: 6px 0 0; text-align: center; font-size: 12px; color: rgba(226,240,247,0.85); }
        .link { text-decoration: underline; text-underline-offset: 3px; }
        .stripe { height: 8px; width: 100%; background: linear-gradient(90deg, #38AECC, #71CDE0, #38AECC); opacity: .9; }

        @media (max-width: 440px) {
          .card { width: calc(100vw - 24px); }
          .title { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
