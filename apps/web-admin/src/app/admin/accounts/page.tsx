"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AccountManagementConsole from "@/components/account-management/AccountManagementConsole";

export default function AdminAccountsPage() {
  return (
    <AuthGuard requireRoles={["ADMIN", "SUPER_ADMIN"]} redirectTo="/login/admin">
      <AccountManagementConsole
        title="Kelola seluruh akun dari panel admin"
        description="Di halaman ini admin dan super admin bisa melihat semua akun yang boleh mereka kelola, membuka/tutup akses reset password, review pengajuan reset password, membuat akun internal, dan menghapus akun."
        homeHref="/admin"
        homeLabel="Kembali ke dashboard admin"
      />
    </AuthGuard>
  );
}
