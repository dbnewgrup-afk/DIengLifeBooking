import type { Role } from "@/lib/api/schemas";

export const AUTH_TOKEN_COOKIE = "token";
export const AUTH_ROLE_COOKIE = "bv_admin_role";
export const AUTH_PORTAL_COOKIE = "bv_admin_portal";
export const AUTH_REDIRECT_COOKIE = "bv_admin_redirect";

export const AUTH_ROLE_STORAGE_KEY = AUTH_ROLE_COOKIE;
export const LEGACY_TOKEN_STORAGE_KEY = "admin_session";
export const LEGACY_ROLE_STORAGE_KEY = "admin_role";

export const ADMIN_ROLES: readonly Role[] = ["SUPER_ADMIN", "ADMIN", "KASIR"];
export const SELLER_ROLES: readonly Role[] = ["SELLER", "AFFILIATE"];
export const SELLER_CANONICAL_PATH = "/seller";
export const SELLER_COMPAT_PATHS = [SELLER_CANONICAL_PATH, "/partner"] as const;

// Canonical role rule:
// - `SELLER` adalah role utama
// - `PARTNER` hanya alias legacy untuk kompatibilitas route/session lama
export function normalizeRole(value?: string | null): Role | undefined {
  switch (value) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "KASIR":
    case "AFFILIATE":
    case "SELLER":
    case "USER":
      return value;
    case "PARTNER":
      return "SELLER";
    default:
      return undefined;
  }
}

export function resolveDashboardPath(role?: string | null): string {
  switch (normalizeRole(role)) {
    case "SUPER_ADMIN":
      return "/super-admin";
    case "ADMIN":
      return "/admin";
    case "KASIR":
      return "/kasir";
    case "SELLER":
    case "AFFILIATE":
      return SELLER_CANONICAL_PATH;
    default:
      return "/login/admin";
  }
}

export function isAuthRoute(pathname?: string | null): boolean {
  if (!pathname) return false;
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

export function resolveLoginPathForRole(role?: string | null): string {
  return SELLER_ROLES.includes(normalizeRole(role) ?? "USER") ? "/login/seller" : "/login/admin";
}

export function isSellerPath(pathname: string): boolean {
  return SELLER_COMPAT_PATHS.some((path) => pathname.startsWith(path));
}

export function resolveLoginPathForPath(pathname: string): string {
  return isSellerPath(pathname) ? "/login/seller" : "/login/admin";
}

export function isRoleAllowedForPath(role: string | null | undefined, pathname: string): boolean {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;

  if (isSellerPath(pathname)) {
    return SELLER_ROLES.includes(normalizedRole);
  }

  if (pathname.startsWith("/super-admin")) {
    return normalizedRole === "SUPER_ADMIN";
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/kasir")) {
    return ADMIN_ROLES.includes(normalizedRole);
  }

  return true;
}

export function buildLoginRedirectUrl(loginPath: string, returnTo?: string | null): string {
  if (!returnTo) return loginPath;
  const encoded = encodeURIComponent(returnTo);
  return `${loginPath}?returnTo=${encoded}`;
}

export function sanitizePostAuthRedirectPath(
  redirectTo: string | null | undefined,
  role?: string | null
): string {
  if (typeof redirectTo === "string" && redirectTo.startsWith("/") && !isAuthRoute(redirectTo)) {
    return redirectTo;
  }

  return resolveDashboardPath(role);
}
