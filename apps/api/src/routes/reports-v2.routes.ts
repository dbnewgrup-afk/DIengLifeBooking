import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { z } from "zod";
import prisma from "../lib/db.js";
import { BookingStatus, PaymentStatus } from "@prisma/client";
import * as sellerDashboardRepo from "../repositories/partner-dashboard.repo.js";
import { SellerRangeQuery } from "../schemas/seller.schema.js";

const r = Router();

const Range = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

const SellerExportQuery = SellerRangeQuery.extend({
  type: z.enum(["bookings", "performance"]).default("bookings"),
  format: z.enum(["csv", "excel"]).default("csv"),
});

function toDateRange(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  const range: { gte?: Date; lte?: Date } = {};
  if (from) {
    range.gte = new Date(from);
  }
  if (to) {
    range.lte = new Date(to);
  }
  return range;
}

function toDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday() {
  const value = new Date();
  value.setHours(23, 59, 59, 999);
  return value;
}

async function handleSellerSummary(req: { user?: { id?: string }; query: unknown }, res: any) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const range = SellerRangeQuery.parse(req.query);
  const result = await sellerDashboardRepo.getPartnerSummary(userId, range);
  return res.json(result);
}

function resolveSellerUserId(req: { user?: { id?: string } }) {
  return req.user?.id ?? null;
}

function escapeCsv(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).replace(/\r?\n/g, " ").trim();
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function rowsToCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));
  return [headers.join(","), ...lines].join("\n");
}

function rowsToHtmlTable(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) {
    return "<table><tr><td>No data</td></tr></table>";
  }

  const headers = Object.keys(rows[0]);
  const headerHtml = headers.map((header) => `<th>${escapeCsv(header)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => {
      const cells = headers
        .map((header) => `<td>${escapeCsv(row[header])}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html><html><body><table border="1"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
}

async function handleSellerExport(req: { user?: { id?: string }; query: unknown }, res: any) {
  const userId = resolveSellerUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = SellerExportQuery.parse(req.query);
  const range = { from: query.from, to: query.to };
  const rows =
    query.type === "performance"
      ? await sellerDashboardRepo.getPartnerPerformanceExport(userId, range)
      : await sellerDashboardRepo.listPartnerBookingsForExport(userId, range);

  const fromLabel = (query.from || "all").slice(0, 10);
  const toLabel = (query.to || "all").slice(0, 10);
  if (query.format === "excel") {
    const filename = `seller-${query.type}-${fromLabel}-${toLabel}.xls`;
    const html = rowsToHtmlTable(rows);
    res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(`\uFEFF${html}`);
  }

  const filename = `seller-${query.type}-${fromLabel}-${toLabel}.csv`;
  const csv = rowsToCsv(rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.status(200).send(`\uFEFF${csv}`);
}

r.get("/admin/overview", auth, requireRole("ADMIN", "SUPER_ADMIN", "KASIR"), async (req, res, next) => {
  try {
    const { from, to } = Range.parse(req.query);
    const createdAt = toDateRange(from, to);
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const [bookings, payments, todayCheckin, todayCheckout, pendingPayments] = await Promise.all([
      prisma.booking.findMany({
        where: createdAt ? { createdAt } : undefined,
        select: {
          createdAt: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({
        where: createdAt ? { booking: { createdAt } } : undefined,
        select: {
          provider: true,
        },
      }),
      prisma.booking.count({
        where: {
          startDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.booking.count({
        where: {
          endDate: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      prisma.booking.count({
        where: {
          paymentStatus: PaymentStatus.PENDING,
        },
      }),
    ]);

    const isPaidBooking = (status: BookingStatus, paymentStatus: PaymentStatus) =>
      paymentStatus === PaymentStatus.PAID ||
      status === BookingStatus.PAID ||
      status === BookingStatus.CONFIRMED ||
      status === BookingStatus.COMPLETED;

    const paidBookings = bookings.filter((booking) => isPaidBooking(booking.status, booking.paymentStatus));
    const revenue = paidBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const orders = bookings.length;
    const avgOrderValue = paidBookings.length ? Math.round(revenue / paidBookings.length) : 0;
    const paidRate = orders ? Math.round((paidBookings.length / orders) * 100) : 0;

    const byDayMap = new Map<string, { label: string; orders: number; revenue: number }>();
    for (const booking of bookings) {
      const key = toDayKey(booking.createdAt);
      const row = byDayMap.get(key) ?? { label: key, orders: 0, revenue: 0 };
      row.orders += 1;
      if (isPaidBooking(booking.status, booking.paymentStatus)) {
        row.revenue += booking.totalAmount;
      }
      byDayMap.set(key, row);
    }

    const methodSplitMap = new Map<string, number>();
    for (const payment of payments) {
      const key = String(payment.provider);
      methodSplitMap.set(key, (methodSplitMap.get(key) ?? 0) + 1);
    }

    const topProductsMap = new Map<string, { id: string; name: string; orders: number; revenue: number }>();
    for (const booking of bookings) {
      const key = booking.listing.id;
      const row = topProductsMap.get(key) ?? {
        id: booking.listing.id,
        name: booking.listing.title,
        orders: 0,
        revenue: 0,
      };
      row.orders += 1;
      if (isPaidBooking(booking.status, booking.paymentStatus)) {
        row.revenue += booking.totalAmount;
      }
      topProductsMap.set(key, row);
    }

    return res.json({
      ok: true,
      kpis: {
        revenue,
        orders,
        avgOrderValue,
        paidRate,
        checkinToday: todayCheckin,
        checkoutToday: todayCheckout,
        pendingPayments,
      },
      byDay: Array.from(byDayMap.values()),
      methodSplit: Array.from(methodSplitMap.entries()).map(([name, count]) => ({ name, count })),
      topProducts: Array.from(topProductsMap.values())
        .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders)
        .slice(0, 5),
    });
  } catch (e) {
    next(e);
  }
});

r.get("/seller/me", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerSummary(req, res);
  } catch (e) {
    next(e);
  }
});

// LEGACY / COMPAT ONLY: keep /partner alive temporarily while clients migrate to /seller.
r.get("/partner/me", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerSummary(req, res);
  } catch (e) {
    next(e);
  }
});

r.get("/seller/export", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerExport(req, res);
  } catch (e) {
    next(e);
  }
});

// LEGACY / COMPAT ONLY: keep /partner alive temporarily while clients migrate to /seller.
r.get("/partner/export", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerExport(req, res);
  } catch (e) {
    next(e);
  }
});

export default r;
