// apps/api/src/repositories/orders.repo.ts
// ⚠️ LEGACY - DO NOT USE
import prisma from "../lib/db.js";
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
} from "@prisma/client";

// Tipe input yang rapi pakai Prisma
type NewOrderItem = {
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
};

type NewOrder = {
  code: string;
  userId: string | null;
  status: OrderStatus;
  total: number;
  items: NewOrderItem[];
  // Jangan buat payment di create. Biarkan undefined.
  initialPayment?: never;
};

export async function calcOrderTotal(productId: string, units: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    const err: any = new Error("Product not found or inactive");
    err.status = 404;
    throw err;
  }
  const unitPrice = product.price;
  const total = unitPrice * units;
  return { product, unitPrice, total };
}

export async function createOrder(data: NewOrder) {
  return prisma.order.create({
    data: {
      code: data.code,
      userId: data.userId,
      status: data.status,
      total: data.total,
      items: { create: data.items.map((i) => ({ ...i })) },
      // payments: tidak dibuat di sini
    },
    include: { items: true, payments: true },
  });
}

export async function getByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: { items: true, payments: true },
  });
}

export async function setStatusByCode(code: string, status: OrderStatus) {
  return prisma.order.update({
    where: { code },
    data: { status },
    include: { items: true, payments: true },
  });
}

/**
 * Tambah payment manual (mis. setelah Snap dibuat).
 * NOTE: repo ini milik flow legacy `order`. Jangan pakai untuk flow aktif
 * Booking + Payment yang sekarang memakai Xendit.
 */
export async function addPayment(
  orderId: string,
  provider: PaymentProvider, // ikuti enum provider dari schema legacy
  status: PaymentStatus,
  raw: any
) {
  return prisma.payment.create({
    data: {
      orderId,
      provider,
      status,
      raw,
      transactionId: String(
        raw?.transaction_id ?? `${provider}-${orderId}-${Date.now()}`
      ),
      grossAmount:
        typeof raw?.gross_amount === "string"
          ? Number(raw.gross_amount)
          : Number(raw?.gross_amount ?? 0),
      currency: "IDR",
      paymentType: String(raw?.payment_type ?? "unknown"),
    },
  });
}

/**
 * Upsert dari webhook provider legacy:
 * - Idempotent by transaction_id (unik)
 * - Update Order status via mapping dari PaymentStatus → OrderStatus
 */
export async function upsertPaymentFromWebhook(args: {
  orderCode: string;
  provider: PaymentProvider; // ikuti enum provider dari schema legacy
  status: PaymentStatus;
  raw: any;
}) {
  const order = await prisma.order.findUnique({
    where: { code: args.orderCode },
  });
  if (!order) return;

  const txId = String(args.raw?.transaction_id || "");
  if (!txId) return; // tanpa transaction_id, tidak bisa idempotent

  const exists = await prisma.payment.findUnique({
    where: { transactionId: txId },
  });
  if (exists) return;

  const grossAmount =
    typeof args.raw?.gross_amount === "string"
      ? Number(args.raw.gross_amount)
      : Number(args.raw?.gross_amount ?? 0);

  // Map PaymentStatus → OrderStatus
  const newOrderStatus: OrderStatus = (() => {
    switch (args.status) {
      case PaymentStatus.SETTLEMENT:
      case PaymentStatus.CAPTURE:
        return OrderStatus.PAID;
      case PaymentStatus.PENDING:
        return OrderStatus.PENDING;
      case PaymentStatus.REFUND:
        return OrderStatus.REFUNDED;
      case PaymentStatus.DENY:
      case PaymentStatus.CANCEL:
      case PaymentStatus.EXPIRE:
      case PaymentStatus.FAILURE:
      case PaymentStatus.CHARGEBACK:
      default:
        return OrderStatus.FAILED;
    }
  })();

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: args.provider,
        status: args.status,
        transactionId: txId,
        grossAmount,
        raw: args.raw,
        currency: "IDR",
        paymentType: String(args.raw?.payment_type ?? "unknown"),
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: newOrderStatus },
    });
  });
}

/**
 * Mark cash: repo legacy ini tidak membuat payment palsu untuk cash.
 * Cukup set order → PAID. Jangan jadikan repo ini acuan untuk flow aktif.
 */
export async function markCash(code: string, { actorId }: { actorId: string }) {
  const order = await prisma.order.findUnique({ where: { code } });
  if (!order) {
    const err: any = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: OrderStatus.PAID },
    include: { items: true, payments: true },
  });

  // Optional: tulis audit di layer lain; repo ini fokus DB utama saja
  return updated;
}
/**
 * LEGACY TRANSACTION FLOW
 *
 * This repository persists to the old `prisma.order` structure. The active
 * marketplace transaction flow no longer uses it; active paths read/write
 * `Booking` and `Payment` instead.
 */
