"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import AdminOwnPasswordResetPage from "@/components/account-management/AdminOwnPasswordResetPage";

export default function SellerResetPasswordPage() {
  return (
    <AuthGuard requireRoles={["SELLER", "AFFILIATE"]} redirectTo="/login/seller">
      <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 lg:px-6">
        <div className="mx-auto max-w-7xl">
          <AdminOwnPasswordResetPage
            title="Reset password untuk akun seller / affiliate"
            description="Seller dan affiliate bisa mengajukan pembukaan akses reset password dari dashboard ini. Setelah admin atau super admin approve, password baru bisa disimpan langsung dari halaman yang sama."
            homeHref="/seller"
            homeLabel="Kembali ke dashboard seller"
          />
        </div>
      </div>
    </AuthGuard>
  );
}
