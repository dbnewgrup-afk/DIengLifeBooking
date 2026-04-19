import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE_URL } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const token = (await cookies()).get("token")?.value ?? "";

  try {
    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          source: "session",
          message: "Sesi buyer tidak ditemukan. Login lagi untuk sinkronisasi status pembayaran.",
        },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(code)}`,
      {
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
                "Gagal mengambil status payment canonical dari backend."
              : "Gagal mengambil status payment canonical dari backend.",
          source: "backend",
        },
        { status: response.status }
      );
    }

    const order =
      json && typeof json === "object" && "order" in json
        ? ((json as { order?: Record<string, unknown> }).order ?? null)
        : null;

    const latestPayment = Array.isArray(order?.payments)
      ? ((order.payments as Array<Record<string, unknown>>)[0] ?? null)
      : null;

    return NextResponse.json({
      ok: true,
      source: "backend",
      payment: {
        code: typeof order?.code === "string" ? order.code : code,
        status: typeof order?.status === "string" ? order.status : null,
        paymentStatus:
          typeof order?.paymentStatus === "string" ? order.paymentStatus : null,
        provider: latestPayment?.provider ?? null,
        externalId: latestPayment?.externalId ?? null,
        invoiceUrl: latestPayment?.invoiceUrl ?? null,
        paidAt: latestPayment?.paidAt ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        source: "backend",
        message: "Tidak bisa menghubungi backend untuk cek status payment canonical.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
