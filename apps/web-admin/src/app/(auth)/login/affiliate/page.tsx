import { Suspense } from "react";
import RoleLoginPage from "@/components/auth/RoleLoginPage";

export const dynamic = "force-dynamic";

export default function AffiliateLoginPage() {
  return (
    <Suspense fallback={null}>
      <RoleLoginPage
        audience="affiliate"
        title="Masuk sebagai affiliate"
        description="Halaman ini khusus untuk akun affiliate. Login affiliate dibuat seragam dengan portal auth lain, tapi tetap diarahkan ke dashboard affiliate yang sesuai."
        endpoint="/auth/login/seller"
        submitLabel="Masuk ke affiliate"
        supportText="Gunakan akun affiliate yang sudah aktif untuk membuka dashboard campaign, komisi, dan withdraw."
      />
    </Suspense>
  );
}
