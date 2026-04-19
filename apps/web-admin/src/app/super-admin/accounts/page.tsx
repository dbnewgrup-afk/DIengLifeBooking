"use client";

import AccountManagementConsole from "@/components/account-management/AccountManagementConsole";

export default function SuperAdminAccountsPage() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.16), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(30,64,175,.20), transparent 60%), linear-gradient(180deg, #102a43 0%, #1e3a8a 58%, #312e81 100%)",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 18px 40px" }}>
        <AccountManagementConsole
          title="Kelola seluruh akun dari panel super admin"
          description="Super admin bisa melihat seluruh role, termasuk akun super admin lain, mengatur password langsung, approve request reset password, dan mengelola akun internal tanpa pindah ke tool lain."
          homeHref="/super-admin"
          homeLabel="Kembali ke dashboard super admin"
        />
      </div>
    </div>
  );
}
