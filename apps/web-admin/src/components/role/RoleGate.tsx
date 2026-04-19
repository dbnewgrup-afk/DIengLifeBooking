"use client";

import { useMemo } from "react";

export type RoleGateProps = {
  /** Jika tidak diisi, RoleGate akan coba baca dari storage 'admin_role' */
  role?: string | null;
  /** Daftar role yang diizinkan */
  allowed: string[];
  /** Konten jika role tidak diizinkan (default: null) */
  fallback?: React.ReactNode;
  /** Custom getter role, default: storage 'admin_role' */
  getRole?: () => string | null;
};

function defaultGetRole(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("admin_role") ||
    sessionStorage.getItem("admin_role") ||
    null
  );
}

/**
 * Render children hanya jika role termasuk allowed.
 * Ini hanya kontrol UI. Pastikan server-side juga cek RBAC.
 */
export default function RoleGate({
  role,
  allowed,
  fallback = null,
  getRole = defaultGetRole,
  children,
}: React.PropsWithChildren<RoleGateProps>) {
  const effectiveRole = useMemo(() => {
    return role ?? getRole();
  }, [role, getRole]);

  const can = useMemo(() => {
    if (!allowed?.length) return true; // kalau tidak ada aturan, izinkan
    if (!effectiveRole) return false;
    return allowed.includes(effectiveRole);
  }, [allowed, effectiveRole]);

  if (!can) return <>{fallback}</>;

  return <>{children}</>;
}
