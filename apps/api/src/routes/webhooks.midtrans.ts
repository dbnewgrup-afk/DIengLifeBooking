
// ⚠️ LEGACY - DO NOT USE
/**
 * LEGACY / COMPAT ONLY
 *
 * File ini mempertahankan webhook provider lama untuk kompatibilitas historis.
 * Jalur webhook aktif untuk flow pembayaran sekarang adalah Xendit.
 */
import crypto from "crypto";
import db from "../lib/db.js";
import logger from "../lib/logger.js";
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
const router = Router();

function verifySignature(body: any, serverKey: string): boolean {
  // Midtrans: signature_key = SHA512(order_id + status_code + gross_amount + serverKey)
  const { order_id, status_code, gross_amount, signature_key } = body || {};
  if (!order_id || !status_code || !gross_amount || !signature_key) return false;
  const payload = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expected = crypto.createHash("sha512").update(payload).digest("hex");
  return expected === String(signature_key);
}

type OrderStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

// Mapping status Midtrans ke status Order kita
function mapMidtransToOrderStatus(notif: any): OrderStatus {
  const s = String(notif.transaction_status || "").toLowerCase();
  const fraud = String(notif.fraud_status || "").toLowerCase(); // utk CC capture
  if (s === "capture") {
    if (fraud === "challenge") return "PENDING";
    if (fraud === "accept") return "PAID";
    return "FAILED";
  }
  if (s === "settlement") return "PAID";
  if (s === "pending") return "PENDING";
  if (s === "deny" || s === "cancel" || s === "expire") return "FAILED";
  if (s === "refund" || s === "partial_refund") return "REFUNDED";
  if (s === "chargeback" || s === "partial_chargeback") return "FAILED";
  return "FAILED";
}

router.post("/api/webhooks/midtrans", async (req: Request, res: Response) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    if (!serverKey) {
      logger.error("MIDTRANS_SERVER_KEY kosong");
      return res.status(500).json({ error: "server key missing" });
    }

    const notif = req.body;
    if (!verifySignature(notif, serverKey)) {
      const oid = notif?.order_id ?? "(null)";
      logger.warn(`Signature mismatch untuk order_id=${oid}`);
      return res.status(400).json({ error: "invalid signature" });
    }

    // Midtrans biasanya kirim order_id = code (ORD-xxx), transaction_id unik
    const orderCode = String(notif.order_id);
    const txid = String(notif.transaction_id ?? ""); // jangan campur || dan ?? tanpa kurung
    if (!txid) {
      logger.warn(`transaction_id kosong untuk order_id=${orderCode}`);
      return res.status(400).json({ error: "transaction_id required" });
    }

    // Cari order by code
    const order = await db.order.findUnique({ where: { code: orderCode } });
    if (!order) {
      logger.warn(`Order tidak ditemukan untuk code=${orderCode}`);
      return res.status(404).json({ error: "order not found" });
    }

    // Idempotensi: upsert Payment berbasis transactionId unik
    const grossInt = Math.round(Number(notif.gross_amount || 0));
    const paymentStatus = String(notif.transaction_status || "").toUpperCase();

    await db.payment.upsert({
      where: { transactionId: txid },
      update: {
        status: paymentStatus as any,
        raw: notif,
        grossAmount: Number.isFinite(grossInt) ? grossInt : 0,
        updatedAt: new Date(),
      },
      create: {
        orderId: order.id,
        transactionId: txid,
        grossAmount: Number.isFinite(grossInt) ? grossInt : 0,
        paymentType: String(notif.payment_type || ""),
        status: paymentStatus as any,
        raw: notif,
      },
    });

    // Update Order status konsisten
    const newOrderStatus = mapMidtransToOrderStatus(notif);
    if (order.status !== newOrderStatus) {
      await db.order.update({
        where: { id: order.id },
        data: { status: newOrderStatus },
      });

      // Tulis audit log sederhana (jika model Audit ada)
      try {
        await db.audit.create({
          data: {
            actorType: "SYSTEM",
            actorId: null,
            action: "MIDTRANS_WEBHOOK",
            target: "ORDER",
            targetId: order.id,
            meta: { from: order.status, to: newOrderStatus, txid },
          },
        });
      } catch {
        // Jangan matikan webhook kalau tabel audit belum ada
        logger.warn(`Gagal tulis audit untuk order=${order.id}, txid=${txid}`);
      }
    }

    return res.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    logger.error(`Webhook error: ${msg}`);
    return res.status(500).json({ error: "internal error" });
  }
});

export default router;










/**
 * LEGACY TRANSACTION FLOW
 *
 * This route still targets the old `order` table family and is not mounted in
 * `apps/api/src/routes/index.ts`. Keep this file as legacy / compat only. The
 * active webhook route is `routes/webhooks.routes.ts`, which updates
 * `Booking + Payment` via Xendit.
 */
