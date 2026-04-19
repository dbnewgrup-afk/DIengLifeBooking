import { NextResponse } from "next/server";
import {
  AUTH_PORTAL_COOKIE,
  AUTH_REDIRECT_COOKIE,
  AUTH_ROLE_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/lib/auth/role-routing";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  res.cookies.delete(AUTH_TOKEN_COOKIE);
  res.cookies.delete(AUTH_ROLE_COOKIE);
  res.cookies.delete(AUTH_PORTAL_COOKIE);
  res.cookies.delete(AUTH_REDIRECT_COOKIE);

  return res;
}
