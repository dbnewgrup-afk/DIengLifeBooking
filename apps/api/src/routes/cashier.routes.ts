import { Router } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import auth, { requireRole } from "../middlewares/auth.js";
import {
  createWalkInBooking,
  getCashierOverview,
  markManualPayment,
  verifyXenditPayment,
} from "../repositories/cashier.repo.js";
import * as auditsRepo from "../repositories/audits.repo.js";

const r = Router();

r.use(auth, requireRole(Role.ADMIN, Role.KASIR, Role.SUPER_ADMIN));

const WalkInBody = z.object({
  listingId: z.string().trim().min(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional().nullable(),
  quantity: z.coerce.number().int().positive().default(1),
  guestCount: z.coerce.number().int().positive().default(1),
  customer: z.object({
    name: z.string().trim().min(1, "Nama customer wajib diisi."),
    email: z.string().trim().email("Email customer tidak valid."),
    phone: z.string().trim().min(6, "Nomor telepon customer wajib diisi."),
  }),
  affiliateReference: z.string().trim().optional().nullable(),
  note: z.string().trim().optional().nullable(),
});

const BookingCodeParams = z.object({
  code: z.string().trim().min(1),
});

const ManualPaymentBody = z.object({
  amount: z.coerce.number().int().positive().optional(),
  method: z.enum(["CASH", "TRANSFER"]),
  note: z.string().trim().optional().nullable(),
});

r.get("/overview", async (_req, res, next) => {
  try {
    const overview = await getCashierOverview();
    return res.json({
      ok: true,
      ...overview,
    });
  } catch (error) {
    next(error);
  }
});

r.post("/walkins", async (req, res, next) => {
  try {
    const body = WalkInBody.parse(req.body);
    const booking = await createWalkInBooking({
      ...body,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
    });

    await auditsRepo.write({
      action: "CASHIER_WALKIN_CREATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "BOOKING",
      targetId: booking.code,
      meta: {
        listingId: booking.listingId,
        totalAmount: booking.totalAmount,
        customerName: booking.customerName,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.status(201).json({
      ok: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
});

r.post("/orders/:code/manual-payment", async (req, res, next) => {
  try {
    const { code } = BookingCodeParams.parse(req.params);
    const body = ManualPaymentBody.parse(req.body);
    const booking = await markManualPayment({
      code,
      ...body,
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
    });

    await auditsRepo.write({
      action: "CASHIER_MANUAL_PAYMENT_MARKED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "BOOKING",
      targetId: booking.code,
      meta: {
        amount: body.amount ?? booking.totalAmount,
        method: body.method,
        paymentStatus: booking.paymentStatus,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({
      ok: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
});

r.post("/orders/:code/verify-xendit", async (req, res, next) => {
  try {
    const { code } = BookingCodeParams.parse(req.params);
    const result = await verifyXenditPayment(code);

    await auditsRepo.write({
      action: "CASHIER_XENDIT_VERIFIED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "BOOKING",
      targetId: result.booking.code,
      meta: {
        invoiceId: result.invoice.id,
        invoiceStatus: result.invoice.status,
        amount: result.invoice.amount,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default r;
