"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { PublicPortalShell } from "@/components/auth/PublicPortalShell";
import { useLang } from "@/components/i18n/lang";
import { buildAdminUrl } from "@/lib/auth";

export default function AffiliateRegisterBridgePage() {
  const { t: L } = useLang();
  const adminAffiliateRegisterUrl = useMemo(
    () => buildAdminUrl("/register/affiliate"),
    []
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(adminAffiliateRegisterUrl);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [adminAffiliateRegisterUrl]);

  return (
    <PublicPortalShell
      eyebrow={L("Register Affiliate", "Register Affiliate")}
      title={L("Daftar sebagai affiliate", "Register as affiliate")}
      description={L(
        "Halaman affiliate sekarang memakai tampilan auth yang sama dan diarahkan ke dashboard app agar jalurnya tetap konsisten.",
        "Affiliate registration now uses the same auth styling and redirects into the dashboard app so the flow stays consistent."
      )}
      links={[
        { href: "/login/affiliate", label: L("Login affiliate", "Affiliate login") },
        { href: "/register/user", label: L("Register user", "Register user") },
      ]}
    >
      <div className="authCard">
        <div className="authAlert authAlertInfo">
          {L(
            "Kamu sedang diarahkan ke halaman register affiliate di dashboard.",
            "You are being redirected to the affiliate registration page in the dashboard."
          )}
        </div>

        <a href={adminAffiliateRegisterUrl} className="authSubmitLink">
          {L(
            "Buka register affiliate di dashboard",
            "Open affiliate registration in dashboard"
          )}
        </a>

        <div className="authMetaRow">
          <Link href="/register/user" className="authInlineLink">
            {L("Kembali ke register user", "Back to user registration")}
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

        .authAlertInfo {
          border: 1px solid #bae6fd;
          background: #f0f9ff;
          color: #0369a1;
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
