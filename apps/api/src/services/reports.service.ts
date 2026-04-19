// apps/api/src/services/reports.service.ts
import { AdminOverviewQuery, PartnerReportParams, AffiliateReportParams } from "../schemas/reports.schema.js";
import prisma from "../lib/db.js"; // default export instance, bukan { prisma }
import { Prisma, OrderStatus } from '@prisma/client'; // pakai enum runtime: OrderStatus, PaymentProvider

export async function adminOverview(rawQuery: unknown) {
  const q = AdminOverviewQuery.parse(rawQuery);

  // Build filter tanggal sekali, pakai ke orders & payments.order
  let createdAt: { gte?: Date; lte?: Date } | undefined;
  if (q.from || q.to) {
    createdAt = {};
    if (q.from) createdAt.gte = new Date(q.from);
    if (q.to) createdAt.lte = new Date(q.to);
  }

  const orderWhere: Prisma.OrderWhereInput = createdAt ? { createdAt } : {};
  const paymentWhere: Prisma.PaymentWhereInput = createdAt ? { order: { createdAt } } : {};

  const [orders, payments] = await Promise.all([
    prisma.order.findMany({ where: orderWhere, select: { total: true, status: true } }),
    prisma.payment.findMany({ where: paymentWhere, select: { provider: true, status: true } }),
  ]);

  // Order dianggap paid kalau status = PAID (bukan "SETTLEMENT")
  const paidOrdersArr = orders.filter(o => o.status === OrderStatus.PAID);
  const revenue = paidOrdersArr.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const paidOrders = paidOrdersArr.length;
  const avgOrderValue = paidOrders ? Math.round(revenue / paidOrders) : 0;
  const paidRate = totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0;

  // Hitung split metode dari enum provider payment
  const methodSplitMap: Record<string, number> = {};
  for (const p of payments) {
    const key = String(p.provider);
    methodSplitMap[key] = (methodSplitMap[key] || 0) + 1;
  }
  const methodSplit = Object.entries(methodSplitMap).map(([name, count]) => ({ name, count }));

  return {
    kpis: { revenue, orders: totalOrders, avgOrderValue, paidRate },
    byDay: [],      // isi nanti kalau mau time-series
    methodSplit,
    topProducts: [], // nanti via join OrderItem
  };
}

export async function partnerReport(_rawParams: unknown, _rawQuery: unknown) {
  // Placeholder; nanti join partnerId -> orders
  return { kpis: { revenue: 0, orders: 0 }, byDay: [], products: [] };
}

export async function affiliateReport(_rawParams: unknown, _rawQuery: unknown) {
  // Placeholder; nanti join ledger affiliate
  return { kpis: { clicks: 0, conversions: 0, commission: 0 }, byDay: [] };
}










