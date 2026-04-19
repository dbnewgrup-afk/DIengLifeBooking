// apps/api/src/services/orders.service.ts
import { CreateOrderBody, GetOrderParams, VerifyOrderParams } from "../schemas/orders.schema.js";
import * as repo from "../repositories/orders.repo.js";
import { nightsBetween } from "../utils/date.js";
import { makeCode } from "../utils/string.js";
import { OrderStatus, type OrderItem, type Payment } from '@prisma/client';

export async function createOrder(userId: string | null, rawBody: unknown) {
  const body = CreateOrderBody.parse(rawBody);

  const units =
    body.start && body.end
      ? Math.max(1, nightsBetween(body.start, body.end))
      : (body.qty ?? 1);

  const { product, total, unitPrice } = await repo.calcOrderTotal(body.productId, units);
  const code = makeCode("ORD", 8);

  // Status awal: PENDING. Payment dibuat nanti (snap/webhook/mark-cash).
  const status: OrderStatus = OrderStatus.PENDING;

  const order = await repo.createOrder({
    code,
    userId: userId ?? null,
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

  return {
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
  };
}

export async function getOrder(rawParams: unknown) {
  const { code } = GetOrderParams.parse(rawParams);
  const order = await repo.getByCode(code);
  if (!order) {
    const err: any = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  return order;
}

export async function verifyOrder(rawParams: unknown) {
  const { code } = VerifyOrderParams.parse(rawParams);
  const order = await repo.getByCode(code);
  if (!order) {
    const err: any = new Error("Order not found");
    err.status = 404;
    throw err;
  }
  // Sinkron ke Xendit nanti; untuk sekarang, ambil dari DB
  return {
    code: order.code,
    status: order.status,
    payments: order.payments.map((p: Payment) => ({
      provider: p.provider,
      status: p.status,
    })),
  };
}

export async function markCash(rawParams: unknown, actorId: string | null) {
  const { code } = GetOrderParams.parse(rawParams);
  const updated = await repo.markCash(code, { actorId: actorId ?? "SYSTEM" });

  return {
    code: updated.code,
    status: updated.status,
    total: updated.total,
    payments: updated.payments.map((p: Payment) => ({
      provider: p.provider,
      status: p.status,
    })),
  };
}










/**
 * LEGACY TRANSACTION FLOW
 *
 * This service still uses the legacy `Order` repository and is not part of the
 * active runtime route graph. Canonical transaction state now lives in
 * `Booking + Payment`.
 */
