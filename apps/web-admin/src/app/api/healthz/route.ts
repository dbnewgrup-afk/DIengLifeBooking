import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || "");
    if (!token) {
      return NextResponse.json({ message: "token required" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    // set HttpOnly cookie so middleware can read it (Next middleware reads cookies sent by browser)
    // secure = true in production; maxAge set to 7 days
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "internal error" }, { status: 500 });
  }
}
