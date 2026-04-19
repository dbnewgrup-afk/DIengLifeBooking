"use client";

import Link from "next/link";
import AuthPortalShell from "@/components/auth/AuthPortalShell";
import { PUBLIC_APP_URL } from "@/lib/constants";

function externalPublicPath(path: string) {
  return `${PUBLIC_APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function AffiliateRegisterPage() {
  return (
    <AuthPortalShell
      eyebrow="Affiliate Register"
      audience="Portal affiliate"
      title="Daftar sebagai affiliate"
      description="Halaman affiliate dibuat seragam dengan auth portal lain. Saat ini onboarding affiliate masih dibuka lewat proses review internal sebelum akun aktif."
      highlights={[]}
      steps={[]}
      links={[
        { href: "/login/affiliate", label: "Login affiliate" },
        { href: "/register/seller", label: "Daftar seller" },
        { href: externalPublicPath("/"), label: "Web public", external: true },
      ]}
    >
      <div className="authCard">
        <div className="authAlert authAlertInfo">
          Pendaftaran affiliate belum memakai self-register API terpisah. Onboarding affiliate masih
          lewat review internal agar kode referral, komisi, dan akses dashboard bisa disiapkan dengan
          benar.
        </div>

        <div className="authInfoBox">
          <p className="authInfoTitle">Langkah yang dipakai saat ini</p>
          <ul className="authInfoList">
            <li>Kirim detail calon affiliate ke tim internal untuk proses review awal.</li>
            <li>Tim admin akan menyiapkan akun affiliate, kode referral, dan hak akses dashboard.</li>
            <li>Setelah akun aktif, login dilakukan lewat halaman affiliate yang sama dengan desain portal ini.</li>
          </ul>
        </div>

        <div className="authMetaRow">
          <Link href="/login/affiliate" className="authInlineLink">
            Sudah punya akun affiliate? Login
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

        .authInfoBox {
          border: 1px solid #d7e3f8;
          border-radius: 18px;
          background: linear-gradient(180deg, #f8fbff, #edf4ff);
          padding: 16px;
          font-size: 14px;
          line-height: 1.7;
          color: #526985;
        }

        .authInfoTitle {
          margin: 0;
          font-weight: 800;
          color: #234a84;
        }

        .authInfoList {
          margin: 10px 0 0;
          padding-left: 18px;
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
