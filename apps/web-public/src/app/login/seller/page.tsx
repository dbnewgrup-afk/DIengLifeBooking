"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PublicPortalShell } from "@/components/auth/PublicPortalShell";
import { useLang } from "@/components/i18n/lang";
import { buildAdminUrl } from "@/lib/auth";

export default function SellerLoginBridgePage() {
  const searchParams = useSearchParams();
  const { t: L } = useLang();
  const registered = searchParams.get("registered") === "1";
  const email = searchParams.get("email")?.trim() || "";
  const returnTo = searchParams.get("returnTo")?.trim() || "";

  const adminSellerLoginUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (registered) params.set("registered", "1");
    if (email) params.set("email", email);
    if (returnTo) params.set("returnTo", returnTo);

    const query = params.toString();
    return `${buildAdminUrl("/login/seller")}${query ? `?${query}` : ""}`;
  }, [email, registered, returnTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(adminSellerLoginUrl);
    }, registered ? 1200 : 900);

    return () => window.clearTimeout(timer);
  }, [adminSellerLoginUrl, registered]);

  return (
    <PublicPortalShell
      eyebrow={L("Login Seller", "Seller Login")}
      title={L("Masuk sebagai seller", "Sign in as seller")}
      description={L(
        "Jalur login seller sekarang disatukan tampilannya dengan portal auth utama dan diarahkan ke dashboard app.",
        "Seller login now uses the same auth portal style and redirects into the dashboard app."
      )}
      links={[
        { href: "/login/user", label: L("Login user", "User login") },
        { href: "/register/seller", label: L("Register seller", "Register seller") },
      ]}
    >
      <div className="authCard">
        {registered ? (
          <div className="authAlert authAlertSuccess">
            {L(
              "Akun seller berhasil dibuat. Kamu sedang diarahkan ke halaman login seller.",
              "Seller account created successfully. You are being redirected to the seller login page."
            )}
          </div>
        ) : null}

        {email ? (
          <div className="authAlert authAlertInfo">
            {L("Email yang akan dipakai:", "Email to be used:")}{" "}
            <span className="authEmphasis">{email}</span>
          </div>
        ) : null}

        <a href={adminSellerLoginUrl} className="authSubmitLink">
          {L(
            "Buka login seller di dashboard",
            "Open seller login in dashboard"
          )}
        </a>

        <div className="authMetaRow">
          <Link href="/login/user" className="authInlineLink">
            {L("Kembali ke login user", "Back to user login")}
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

        .authAlertInfo {
          border: 1px solid #bae6fd;
          background: #f0f9ff;
          color: #0369a1;
        }

        .authEmphasis {
          font-weight: 800;
        }

        .authSubmitLink {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 50px;
          border: 1px solid #0f6aa8;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 800;
          color: #ffffff;
          text-decoration: none;
          background: linear-gradient(90deg, #0f6aa8, #1fa0dc);
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
    </PublicPortalShell>
  );
}
