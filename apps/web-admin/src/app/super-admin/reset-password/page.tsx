"use client";

import AdminOwnPasswordResetPage from "@/components/account-management/AdminOwnPasswordResetPage";

export default function SuperAdminResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.16), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(30,64,175,.20), transparent 60%), linear-gradient(180deg, #102a43 0%, #1e3a8a 58%, #312e81 100%)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 18px 40px" }}>
        <AdminOwnPasswordResetPage
          title="Reset password untuk akun super admin"
          description="Kalau flow reset mandiri dipakai, super admin tetap harus menunggu akses dibuka dulu. Setelah dibuka, password bisa diganti langsung dari halaman ini."
          homeHref="/super-admin"
          homeLabel="Kembali ke dashboard super admin"
        />
      </div>
    </div>
  );
}
