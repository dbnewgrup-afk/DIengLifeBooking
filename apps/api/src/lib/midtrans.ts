// LEGACY - DO NOT USE
// apps/api/src/lib/midtrans.ts
//
// LEGACY / COMPAT ONLY:
// Util ini dipertahankan untuk jalur provider lama. Provider aktif untuk flow
// pembayaran utama sekarang adalah Xendit.
import crypto from "crypto";
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

// Env
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const MIDTRANS_BASE_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

// TS di proyekmu kemungkinan tidak include DOM lib, jadi ambil fetch dari globalThis
const fetchAny: any = (globalThis as any).fetch;

/**
 * Verifikasi signature dari notifikasi Midtrans
 * formula: sha512(order_id + status_code + gross_amount + serverKey)
 */
export function verifySignature(
  body: Record<string, any> | undefined,
  signature: string | undefined
): boolean {
  if (!body || !signature || !SERVER_KEY) return false;
  const raw = `${body.order_id}${body.status_code}${body.gross_amount}${SERVER_KEY}`;
  const hash = crypto.createHash("sha512").update(raw).digest("hex");
  return hash === signature;
}

/**
 * Mapping status Midtrans → PaymentStatus Prisma
 */
export function mapMidtransToPaymentStatus(s: string): PaymentStatus {
  const v = String(s || "").toLowerCase();
  switch (v) {
    case "pending":
      return PaymentStatus.PENDING;
    case "settlement":
      return PaymentStatus.SETTLEMENT;
    case "capture":
      return PaymentStatus.CAPTURE;
    case "deny":
      return PaymentStatus.DENY;
    case "cancel":
      return PaymentStatus.CANCEL;
    case "expire":
      return PaymentStatus.EXPIRE;
    case "refund":
    case "partial_refund":
      return PaymentStatus.REFUND;
    case "chargeback":
    case "partial_chargeback":
      return PaymentStatus.CHARGEBACK;
    default:
      return PaymentStatus.FAILURE;
  }
}

/**
 * Mapping status Midtrans (+ fraud_status untuk capture) → OrderStatus Prisma
 * Aturan ringkas:
 * - settlement → PAID
 * - capture + fraud=accept → PAID
 * - capture + fraud=challenge → PENDING
 * - pending → PENDING
 * - deny/cancel/expire/failure/chargeback → FAILED
 * - refund/partial_refund → REFUNDED
 */
export function mapMidtransToOrderStatus(
  transactionStatus: string,
  fraudStatus?: string
): OrderStatus {
  const t = String(transactionStatus || "").toLowerCase();
  const f = String(fraudStatus || "").toLowerCase();

  if (t === "settlement") return OrderStatus.PAID;
  if (t === "capture") {
    if (f === "challenge") return OrderStatus.PENDING;
    if (f === "accept") return OrderStatus.PAID;
    return OrderStatus.FAILED;
  }
  if (t === "pending") return OrderStatus.PENDING;
  if (t === "refund" || t === "partial_refund") return OrderStatus.REFUNDED;
  if (t === "expire") return OrderStatus.EXPIRED;

  // deny/cancel/failure/chargeback → FAILED
  return OrderStatus.FAILED;
}

/**
 * Panggil Midtrans Status API untuk verifikasi manual
 * GET /v2/{order_id}/status
 */
export async function fetchMidtransStatus(orderId: string) {
  if (!SERVER_KEY) {
    throw new Error("[Midtrans] SERVER_KEY missing");
  }

  const url = `${MIDTRANS_BASE_URL}/${encodeURIComponent(orderId)}/status`;
  const auth = Buffer.from(SERVER_KEY + ":").toString("base64");

  const resp = await fetchAny(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!resp || !resp.ok) {
    const code = resp?.status ?? 0;
    const text = resp?.statusText ?? "unknown";
    throw new Error(`[Midtrans] status fetch failed: ${code} ${text}`);
  }

  const data = (await resp.json()) as any;

  const paymentStatus = mapMidtransToPaymentStatus(data?.transaction_status);
  const orderStatus = mapMidtransToOrderStatus(data?.transaction_status, data?.fraud_status);

  return {
    raw: data,
    providerStatus: String(data?.transaction_status || ""),
    paymentStatus,
    orderStatus,
    transactionId: String(data?.transaction_id || ""),
    grossAmount:
      typeof data?.gross_amount === "string"
        ? Number(data.gross_amount)
        : Number(data?.gross_amount ?? 0),
    paymentType: String(data?.payment_type ?? "unknown"),
  };
}











