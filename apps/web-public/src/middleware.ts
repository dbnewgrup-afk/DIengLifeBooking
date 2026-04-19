// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Redirect ke HTTPS kalau di prod & bukan localhost
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("host") || "";
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".ngrok-free.app"); // sesuaikan kalau perlu

  if (!isLocal && proto === "http") {
    const url = req.nextUrl;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Lanjutkan request + tambahkan header keamanan ringan
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  // XSS-Protection kini deprecated; biarin 0 supaya gak bikin ilusi aman
  res.headers.set("X-XSS-Protection", "0");

  return res;
}

// Kecualikan asset statis & file publik biar gak diproses middleware
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)).*)",
  ],
};
