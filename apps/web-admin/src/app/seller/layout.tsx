"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SellerAreaLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireRoles={["SELLER", "AFFILIATE"]} redirectTo="/login/seller">
      {children}
    </AuthGuard>
  );
}
