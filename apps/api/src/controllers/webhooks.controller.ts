// LEGACY - DO NOT USE
import type { Request, Response } from "express";
import db from "../lib/db.js";
import logger from "../lib/logger.js";
import { $Enums } from "@prisma/client";

/**
 * Legacy / compat-only webhook handler for the previous provider.
 * - Signature sudah diverifikasi di middleware (kalau ada).
 * - Hanya update status order ? paid/failed/pending.
 */
export async function midtrans(req: Request, res: Response) {
  try {
    const notif = req.body;

    const orderId = notif.order_id;
    const status = notif.transaction_status; // "settlement" | "pending" | "deny" | "cancel" | "expire" | "refund"
    const fraud = notif.fraud_status;        // "accept" | "challenge" | "deny"

    logger.info({ notif }, "[midtrans] webhook received");

    const order = await db.order.findUnique({ where: { code: orderId } });
    if (!order) {
      logger.warn({ orderId }, "[midtrans] order not found");
      return res.status(404).json({ error: "order not found" });
    }

    let newStatus: $Enums.PaymentStatus = order.paymentStatus;

    if (status === "settlement" && fraud === "accept") {
      newStatus = $Enums.PaymentStatus.PAID;
    } else if (status === "pending") {
      newStatus = $Enums.PaymentStatus.PENDING;
    } else if (["deny", "cancel", "expire"].includes(status)) {
      newStatus = $Enums.PaymentStatus.FAILED;
    }

    await db.order.update({
      where: { code: orderId },
      data: {
        paymentStatus: newStatus,
        paymentProvider: $Enums.PaymentProvider.MIDTRANS,
        updatedAt: new Date()
      }
    });

    return res.json({ ok: true });
  } catch (err) {
    logger.error(err, "[midtrans] webhook error");
    return res.status(500).json({ error: "internal error" });
  }
}
/**
 * LEGACY TRANSACTION FLOW
 *
 * This webhook controller updates the old `order` table shape and is not
 * mounted by the active API router. The live webhook path is
 * `routes/webhooks.routes.ts`, which updates `Booking + Payment`.
 */

