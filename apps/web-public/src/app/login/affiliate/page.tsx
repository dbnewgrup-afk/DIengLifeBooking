"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { PublicPortalShell } from "@/components/auth/PublicPortalShell";
import { useLang } from "@/components/i18n/lang";
import { buildAdminUrl } from "@/lib/auth";

export default function AffiliateLoginBridgePage() {
  const searchParams = useSearchParams();
  const { t: L } = useLang();
  const email = searchParams.get("email")?.trim() || "";
  const returnTo = searchParams.get("returnTo")?.trim() || "";

  const adminAffiliateLoginUrl = useMemo(() => {
    const params = new URLSearchParams();

    if (email) params.set("email", email);
    if (returnTo) params.set("returnTo", returnTo);

    const query = params.toString();
    return `${buildAdminUrl("/login/affiliate")}${query ? `?${query}` : ""}`;
  }, [email, returnTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.assign(adminAffiliateLoginUrl);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [adminAffiliateLoginUrl]);

  return (
    <PublicPortalShell
      eyebrow={L("Login Affiliate", "Affiliate Login")}
      title={L("Masuk sebagai affiliate", "Sign in as affiliate")}
      description={L(
        "Akun affiliate memakai tampilan auth yang sama dan diarahkan ke dashboard app untuk akses link campaign, komisi, dan withdraw.",
        "Affiliate accounts use the same auth styling and redirect into the dashboard app for campaign links, commissions, and withdrawals."
      )}
      links={[
        { href: "/login/user", label: L("Login user", "User login") },
        { href: "/register/affiliate", label: L("Register affiliate", "Register affiliate") },
      ]}
    >
      <div className="authCard">
        {email ? (
          <div className="authAlert authAlertInfo">
            {L("Email yang akan dipakai:", "Email to be used:")}{" "}
            <span className="authEmphasis">{email}</span>
          </div>
        ) : null}

        <a href={adminAffiliateLoginUrl} className="authSubmitLink">
          {L(
            "Buka login affiliate di dashboard",
            "Open affiliate login in dashboard"
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
