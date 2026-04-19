import { Suspense } from "react";
import RoleLoginPage from "@/components/auth/RoleLoginPage";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <RoleLoginPage
        audience="admin"
        title="Masuk sebagai admin"
        description="Halaman ini khusus untuk admin internal, super admin, dan kasir. Login dipisah dari seller biar operasional lebih rapih dan route-nya tidak saling tabrak."
        endpoint="/auth/login/admin"
        submitLabel="Masuk ke admin"
        supportText="Gunakan akun internal yang memang punya akses operasional ke dashboard admin."
      />
    </Suspense>
  );
}
