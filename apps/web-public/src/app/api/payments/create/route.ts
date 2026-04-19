import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { API_BASE_URL } from "@/lib/auth";

export const runtime = "nodejs";

const payloadSchema = z.object({
  orderCode: z.string().trim().min(3),
});

export async function POST(request: Request) {
  const token = (await cookies()).get("token")?.value ?? "";

  let body: z.infer<typeof payloadSchema>;
  try {
    body = payloadSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Payload pembayaran tidak valid.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sesi buyer tidak ditemukan. Login lagi sebelum memulai pembayaran.",
      },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(body.orderCode)}/pay`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            json && typeof json === "object"
              ? (json as { error?: string; message?: string }).error ??
                (json as { error?: string; message?: string }).message ??
                "Gagal membuat invoice canonical dari backend."
              : "Gagal membuat invoice canonical dari backend.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Tidak bisa menghubungi backend untuk membuat invoice canonical.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
