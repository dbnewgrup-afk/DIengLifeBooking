// apps/web-admin/src/lib/auth/middleware-guard.ts
// Hook guard untuk halaman privat. Redirect ke /login jika tidak memenuhi syarat.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getRole, getToken, onAuthChange } from "./session";
import type { Role } from "@/lib/api/schemas";
import {
  buildLoginRedirectUrl,
  resolveDashboardPath,
  resolveLoginPathForRole,
} from "./role-routing";

function rolePriority(r?: Role): number {
  switch (r) {
    case "SUPER_ADMIN":
      return 5;
    case "ADMIN":
      return 4;
    case "KASIR":
      return 3;
    case "SELLER":
    case "PARTNER":
    case "AFFILIATE":
      return 2;
    case "USER":
      return 1;
    default:
      return 0;
  }
}

export type UseAuthGuardResult = {
  authed: boolean;
  role?: Role;
  loading: boolean;
};

/**
 * Pakai di halaman/layout privat.
 * Contoh:
 * const { authed, role, loading } = useAuthGuard("ADMIN");
 */
export function useAuthGuard(minRole?: Role): UseAuthGuardResult {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [role, setRole] = useState<Role | undefined>(() => getRole());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Sync saat token berubah dari tempat lain
    const off = onAuthChange(() => {
      setTokenState(getToken());
      setRole(getRole());
    });
    // Initial settle
    setLoading(false);
    return off;
  }, []);

  const authed = useMemo(() => {
    if (!token) return false;
    if (!minRole) return true;
    return rolePriority(role) >= rolePriority(minRole);
  }, [token, role, minRole]);

  useEffect(() => {
    if (loading) return;
    if (!authed) {
      if (token && role) {
        router.replace(resolveDashboardPath(role));
        return;
      }

      const loginPath = minRole === "SELLER" ? "/login/seller" : resolveLoginPathForRole(role);
      router.replace(buildLoginRedirectUrl(loginPath, pathname));
    }
  }, [authed, loading, minRole, pathname, role, router, token]);

  return { authed, role, loading };
}
