"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SuperAdminAreaLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireRoles={["SUPER_ADMIN"]} redirectTo="/login/admin">
      {children}
    </AuthGuard>
  );
}
