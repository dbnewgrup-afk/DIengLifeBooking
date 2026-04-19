import type { Request, Response, NextFunction } from 'express';
// apps/api/src/controllers/orders.controller.ts

import { CreateOrderBody, GetOrderParams, VerifyOrderParams } from "../schemas/orders.schema.js";
import * as repo from "../repositories/orders.repo.js";
import { makeCode } from "../utils/string.js";
import { nightsBetween } from "../utils/date.js";
import { OrderStatus, type OrderItem, type Payment } from '@prisma/client';

/**
 * POST /api/orders
 * Body: { productId, qty?, start?, end?, customer?, payMethod }
 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateOrderBody.parse(req.body);

    // hitung units: jika ada rentang tanggal â†’ nights; kalau tidak â†’ qty
    const units =
      body.start && body.end ? Math.max(1, nightsBetween(body.start, body.end)) : (body.qty ?? 1);

    const { product, total, unitPrice } = await repo.calcOrderTotal(body.productId, units);

    const code = makeCode("ORD", 8);
    // Non-cash tetap PENDING sampai webhook settle; cash juga mulai sebagai PENDING lalu di-mark cash.
    const status: OrderStatus = OrderStatus.PENDING;

    // Penting: JANGAN buat Payment di sini.
    // Payment baru dibuat saat Snap dibuat / webhook masuk / mark-cash.
    const order = await repo.createOrder({
      code,
      userId: req.user?.id ?? null,
      status,
      total,
      items: [
        {
          productId: product.id,
          nameSnapshot: product.name,
          priceSnapshot: unitPrice,
          qty: units,
        },
      ],
      // initialPayment: undefined
    });

    return res.status(201).json({
      ok: true,
      code: order.code,
      status: order.status,
      total: order.total,
      payMethod: body.payMethod,
      items: order.items.map((i: OrderItem) => ({
        productId: i.productId,
        name: i.nameSnapshot,
        unitPrice: i.priceSnapshot,
        qty: i.qty,
      })),
    });
  } catch (e) {
    next(e);
  }
}

/** GET /api/orders/:code */
export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = GetOrderParams.parse(req.params);
    const order = await repo.getByCode(code);
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.json({
      ok: true,
      order: {
        code: order.code,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt,
        items: order.items.map((i: OrderItem) => ({
          productId: i.productId,
          name: i.nameSnapshot,
          qty: i.qty,
          unitPrice: i.priceSnapshot,
        })),
        payments: order.payments.map((p: Payment) => ({
          provider: p.provider,
          status: p.status,
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}

/** GET /api/orders/:code/verify */
export async function verify(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = VerifyOrderParams.parse(req.params);
    const order = await repo.getByCode(code);
    if (!order) return res.status(404).json({ error: "Order not found" });

    return res.json({
      ok: true,
      code: order.code,
      status: order.status,
      payments: order.payments.map((p: Payment) => ({
        provider: p.provider,
        status: p.status,
      })),
    });
  } catch (e) {
    next(e);
  }
}

/** POST /api/orders/:code/mark-cash  (RBAC: ADMIN/KASIR/SUPER_ADMIN) */
export async function markCash(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = GetOrderParams.parse(req.params);
    const order = await repo.getByCode(code);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Jangan bandingkan dengan "SETTLEMENT" (itu status payment). Untuk order, pakai PAID.
    if (order.status === OrderStatus.PAID) {
      return res.status(409).json({ error: "Order already settled" });
    }

    const updated = await repo.markCash(code, { actorId: req.user?.id ?? "SYSTEM" });

    return res.json({
      ok: true,
      code: updated.code,
      status: updated.status,
      total: updated.total,
      payments: updated.payments.map((p: Payment) => ({
        provider: p.provider,
        status: p.status,
      })),
    });
  } catch (e) {
    next(e);
  }
}











/**
 * LEGACY TRANSACTION FLOW
 *
 * This controller still targets the removed/legacy `Order` model family and is
 * not mounted by `apps/api/src/routes/index.ts`.
 *
 * Active transaction source of truth:
 * - `Booking` for the primary transaction record
 * - `Payment` for payment state/history
 *
 * Keep this file only as historical reference until the legacy Order flow can
 * be deleted safely.
 */
