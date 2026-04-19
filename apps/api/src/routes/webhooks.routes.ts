import crypto from "node:crypto";
import { Router } from "express";
import type { XenditInvoiceSnapshot } from "../repositories/xendit-payments-grouped.repo.js";
import { z } from "zod";
import logger from "../lib/logger.js";
import rateLimit from "../middlewares/rateLimit.js";
import { syncXenditInvoiceToBooking } from "../repositories/xendit-payments-grouped.repo.js";

const router = Router();

function verifyXenditCallbackToken(receivedToken: string, expectedToken: string) {
  const received = Buffer.from(receivedToken.trim());
  const expected = Buffer.from(expectedToken.trim());

  if (received.length === 0 || received.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(received, expected);
}

const XenditInvoiceWebhookBody = z.object({
  id: z.string().trim().min(1).optional(),
  invoice_id: z.string().trim().min(1).optional(),
  external_id: z.string().trim().min(1).nullable().optional(),
  status: z.string().trim().min(1),
  amount: z.coerce.number().nonnegative().optional(),
  invoice_url: z.string().trim().nullable().optional(),
  paid_at: z.string().trim().nullable().optional(),
  expiry_date: z.string().trim().nullable().optional(),
  payer_email: z.string().trim().nullable().optional(),
  payment_method: z.string().trim().nullable().optional(),
  payment_channel: z.string().trim().nullable().optional(),
  reference_id: z.string().trim().nullable().optional(),
});

const XenditEventDataBody = z.object({
  id: z.string().trim().min(1).optional(),
  invoice_id: z.string().trim().min(1).optional(),
  external_id: z.string().trim().min(1).nullable().optional(),
  status: z.string().trim().min(1).optional(),
  amount: z.coerce.number().nonnegative().optional(),
  invoice_url: z.string().trim().nullable().optional(),
  paid_at: z.string().trim().nullable().optional(),
  expiry_date: z.string().trim().nullable().optional(),
  payer_email: z.string().trim().nullable().optional(),
  payment_method: z.string().trim().nullable().optional(),
  payment_channel: z.string().trim().nullable().optional(),
  reference_id: z.string().trim().nullable().optional(),
});

const XenditEventWebhookBody = z.object({
  event: z.string().trim().min(1),
  id: z.string().trim().min(1).optional(),
  data: XenditEventDataBody.optional(),
});

const SUPPORTED_XENDIT_SUCCESS_EVENTS = new Set(["invoice.paid", "payment.succeeded"]);

function normalizeXenditWebhookPayload(body: unknown):
  | { ignored: true; reason: string }
  | { ignored: false; snapshot: XenditInvoiceSnapshot } {
  const directPayload = XenditInvoiceWebhookBody.safeParse(body);
  if (directPayload.success) {
    return {
      ignored: false,
      snapshot: {
        ...directPayload.data,
        event_type: null,
      },
    };
  }

  const eventPayload = XenditEventWebhookBody.parse(body);
  const eventType = eventPayload.event.trim().toLowerCase();
  if (!SUPPORTED_XENDIT_SUCCESS_EVENTS.has(eventType)) {
    return {
      ignored: true,
      reason: `unsupported_event:${eventType}`,
    };
  }

  const data = eventPayload.data ?? {};
  return {
    ignored: false,
    snapshot: {
      id: data.invoice_id ?? data.id ?? eventPayload.id ?? null,
      invoice_id: data.invoice_id ?? null,
      external_id: data.external_id ?? null,
      status: data.status ?? "PAID",
      amount: data.amount ?? null,
      invoice_url: data.invoice_url ?? null,
      paid_at: data.paid_at ?? null,
      expiry_date: data.expiry_date ?? null,
      payer_email: data.payer_email ?? null,
      payment_method: data.payment_method ?? null,
      payment_channel: data.payment_channel ?? null,
      reference_id: data.reference_id ?? null,
      event_type: eventType,
    },
  };
}

// LEGACY - DO NOT USE
// Midtrans tidak lagi menjadi source of truth transaksi. Route ini sengaja
// dipertahankan dalam mode disabled agar caller lama mendapat sinyal eksplisit.
router.post("/midtrans", rateLimit, async (_req, res) => {
  return res.status(410).json({
    ok: false,
    error: "legacy webhook disabled",
    canonicalWebhook: "/webhooks/xendit",
  });
});

router.post("/xendit", rateLimit, async (req, res) => {
  const callbackToken =
    process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN?.trim() ||
    process.env.XENDIT_CALLBACK_TOKEN?.trim();
  if (!callbackToken) {
    logger.error("[xendit] callback token missing");
    return res.status(503).json({
      error: "xendit webhook verification token not configured",
    });
  }

  const receivedToken = req.get("x-callback-token")?.trim() ?? "";
  if (!verifyXenditCallbackToken(receivedToken, callbackToken)) {
    return res.status(401).json({ error: "invalid callback token" });
  }

  let normalizedPayload:
    | { ignored: true; reason: string }
    | { ignored: false; snapshot: XenditInvoiceSnapshot };
  try {
    normalizedPayload = normalizeXenditWebhookPayload(req.body ?? {});
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "invalid webhook payload",
        detail: error.flatten(),
      });
    }

    return res.status(400).json({ error: "invalid webhook payload" });
  }

  if (normalizedPayload.ignored) {
    return res.json({
      ok: true,
      ignored: true,
      reason: normalizedPayload.reason,
    });
  }

  try {
    const result = await syncXenditInvoiceToBooking(normalizedPayload.snapshot);

    return res.json({
      ok: true,
      code: result.bookingCode,
      status: result.bookingStatus,
      paymentStatus: result.paymentStatus,
      ignored: result.ignored ?? false,
      reason: result.reason ?? null,
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    if (status >= 400 && status < 500) {
      logger.warn(
        {
          status,
          payload: normalizedPayload.snapshot,
        },
        `[xendit] webhook ignored: ${error instanceof Error ? error.message : "client error"}`
      );

      return res.json({
        ok: true,
        ignored: true,
        reason: error instanceof Error ? error.message : "client error",
      });
    }

    logger.error(error, "[xendit] webhook error");
    return res.status(500).json({ error: "internal error" });
  }
});

export default router;

// Canonical payment webhook path for the active `Booking + Payment` transaction flow.
