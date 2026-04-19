"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { ADMIN_ROLES } from "@/lib/auth/role-routing";

export default function KasirAreaLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireRoles={ADMIN_ROLES} redirectTo="/login/admin">
      {children}
    </AuthGuard>
  );
}
