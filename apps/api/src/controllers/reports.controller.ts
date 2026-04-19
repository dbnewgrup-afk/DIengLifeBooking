// apps/api/src/controllers/reports.controller.ts
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import prisma from "../lib/db.js";

// Pakai string biasa untuk rentang waktu. Kalau mau, nanti bisa dinaikkan ke z.string().datetime().
const Range = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// Tipis tapi jelas: apa yang kita baca dari query
type OrderRow = { total: number; status: unknown };
type PaymentRow = { provider: unknown; status: unknown };

// GET /api/reports/admin/overview?from&to
export async function adminOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const q = Range.parse(req.query);

    // Build filter tanggal sekali, reusable untuk orders & payments.order
    let createdAt: { gte?: Date; lte?: Date } | undefined;
    if (q.from || q.to) {
      createdAt = {};
      if (q.from) createdAt.gte = new Date(q.from);
      if (q.to) createdAt.lte = new Date(q.to);
    }

    const orderWhere = createdAt ? { createdAt } : {};
    const paymentWhere = createdAt ? { order: { createdAt } } : {};

    const [orders, payments] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere as any, // model name di schema kamu beda? santai, ini hanya filter createdAt
        select: { total: true, status: true },
      }) as Promise<OrderRow[]>,
      prisma.payment.findMany({
        where: paymentWhere as any,
        select: { provider: true, status: true },
      }) as Promise<PaymentRow[]>,
    ]);

    // Jangan bergantung pada enum runtime yang gak diekspor. Pakai string 'PAID'.
    const isPaid = (s: unknown) => String(s) === "PAID";

    const paidOrdersArr = orders.filter((o) => isPaid(o.status));
    const revenue = paidOrdersArr.reduce((sum: number, o: OrderRow) => sum + o.total, 0);
    const totalOrders = orders.length;
    const paidOrders = paidOrdersArr.length;
    const avgOrderValue = paidOrders ? Math.round(revenue / paidOrders) : 0;
    const paidRate = totalOrders ? Math.round((paidOrders / totalOrders) * 100) : 0;

    // Split metode berdasarkan provider payment
    const methodSplitMap: Record<string, number> = {};
    for (const p of payments) {
      const key = String(p.provider);
      methodSplitMap[key] = (methodSplitMap[key] ?? 0) + 1;
    }
    const methodSplit = Object.entries(methodSplitMap).map(([name, count]) => ({ name, count }));

    res.json({
      ok: true,
      kpis: { revenue, orders: totalOrders, avgOrderValue, paidRate },
      byDay: [],         // nanti isi time-series
      methodSplit,       // { name: provider, count }
      topProducts: [],   // nanti via join OrderItem
    });
  } catch (e) {
    next(e);
  }
}

// GET /api/reports/partner/:partnerId?from&to  (placeholder)
export async function partnerReport(_req: Request, res: Response) {
  res.json({ ok: true, kpis: { revenue: 0, orders: 0 }, byDay: [], products: [] });
}

// GET /api/reports/affiliate/:affiliateId?from&to  (placeholder)
export async function affiliateReport(_req: Request, res: Response) {
  res.json({ ok: true, kpis: { clicks: 0, conversions: 0, commission: 0 }, byDay: [] });
}
