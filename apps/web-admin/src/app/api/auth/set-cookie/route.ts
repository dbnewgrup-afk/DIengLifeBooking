import { NextResponse } from "next/server";
import {
  AUTH_PORTAL_COOKIE,
  AUTH_REDIRECT_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
  normalizeRole,
  sanitizePostAuthRedirectPath,
} from "@/lib/auth/role-routing";

type SetCookiePayload = {
  token?: string;
  role?: string;
  portal?: string;
  redirectTo?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SetCookiePayload;
    const token = String(body?.token || "");
    const role = normalizeRole(body?.role);
    const redirectTo = sanitizePostAuthRedirectPath(body?.redirectTo, role);
    const portal = typeof body?.portal === "string" ? body.portal : undefined;

    if (!token) {
      return NextResponse.json({ message: "token required" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    };

    res.cookies.set(AUTH_TOKEN_COOKIE, token, cookieOptions);

    if (role) {
      res.cookies.set(AUTH_ROLE_COOKIE, role, cookieOptions);
    } else {
      res.cookies.delete(AUTH_ROLE_COOKIE);
    }

    if (portal) {
      res.cookies.set(AUTH_PORTAL_COOKIE, portal, cookieOptions);
    } else {
      res.cookies.delete(AUTH_PORTAL_COOKIE);
    }

    res.cookies.set(AUTH_REDIRECT_COOKIE, redirectTo, cookieOptions);

    return res;
  } catch (error: unknown) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "internal error" },
      { status: 500 }
    );
  }
}
