import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_REDIRECT_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  buildLoginRedirectUrl,
  isSellerPath,
  isAuthRoute,
  isRoleAllowedForPath,
  resolveDashboardPath,
  sanitizePostAuthRedirectPath,
  resolveLoginPathForPath,
} from "./lib/auth/role-routing";
import { decodeAuthRole } from "./lib/auth/token";

/**
 * DEV BYPASS: set NEXT_PUBLIC_DEV_NO_AUTH=1 di env, maka semua request lolos.
 * Production: hapus env itu, auth jalan normal.
 */
export function middleware(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEV_NO_AUTH === "1") {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    /\.[a-z0-9]+$/i.test(pathname);

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const publicPaths = [
    "/login",
    "/register",
    "/api/healthz",
    "/api/auth/set-cookie",
    "/api/auth/clear-cookie",
  ];
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;
    if (!isAuthRoute(pathname) || !token) {
      return NextResponse.next();
    }

    const role = req.cookies.get(AUTH_ROLE_COOKIE)?.value || decodeAuthRole(token);
    if (!role) {
      return NextResponse.next();
    }

    const redirectTo = sanitizePostAuthRedirectPath(
      req.cookies.get(AUTH_REDIRECT_COOKIE)?.value,
      role
    );
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  const token = req.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    const loginPath = resolveLoginPathForPath(pathname);
    return NextResponse.redirect(
      new URL(buildLoginRedirectUrl(loginPath, pathname), req.url)
    );
  }

  const role = req.cookies.get(AUTH_ROLE_COOKIE)?.value || decodeAuthRole(token);
  if (isSellerPath(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/super-admin") || pathname.startsWith("/kasir")) {
    if (!isRoleAllowedForPath(role, pathname)) {
      return NextResponse.redirect(new URL(resolveDashboardPath(role), req.url));
    }
  }

  return NextResponse.next();
}

// jalankan di semua path
export const config = {
  matcher: ["/:path*"],
};
