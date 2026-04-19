import { Suspense } from "react";
import RoleLoginPage from "@/components/auth/RoleLoginPage";

export const dynamic = "force-dynamic";

export default function SellerLoginPage() {
  return (
    <Suspense fallback={null}>
      <RoleLoginPage
        audience="seller"
        title="Masuk sebagai seller"
        description="Halaman ini khusus untuk akun seller. Login seller dipisah dari admin dan user supaya akses operasional tetap rapi dan jalur masuknya jelas."
        endpoint="/auth/login/seller"
        submitLabel="Masuk ke dashboard seller"
        supportText="Masukkan akun seller yang sudah terdaftar untuk membuka dashboard seller."
      />
    </Suspense>
  );
}
