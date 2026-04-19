"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AdminOwnPasswordResetPage from "@/components/account-management/AdminOwnPasswordResetPage";

export default function AdminResetPasswordPage() {
  return (
    <AuthGuard requireRoles={["ADMIN", "SUPER_ADMIN"]} redirectTo="/login/admin">
      <AdminOwnPasswordResetPage
        title="Reset password untuk akun admin"
        description="Halaman ini dipakai admin untuk mengajukan akses reset password ke admin/super admin lain, atau langsung mengganti password saat akses reset sudah dibuka."
        homeHref="/admin"
        homeLabel="Kembali ke dashboard admin"
      />
    </AuthGuard>
  );
}
