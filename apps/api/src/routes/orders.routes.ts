import { Router } from 'express';
import { z } from "zod";
import prisma from "../lib/db.js";
import {
  BookingStatus,
  ListingStatus,
  ListingUnitType,
  PaymentProvider,
  PaymentStatus,
  Role,
} from "@prisma/client";
import {
  CreateOrderBody,
  GetOrderParams,
  VerifyOrderParams,
  MarkCashParams,
  CompleteOrderParams,
} from "../schemas/orders.schema.js";
import { nightsBetween } from "../utils/date.js";
import { makeCode } from "../utils/string.js";
import auth, { requireRole } from "../middlewares/auth.js";
import {
  ensureBookingEscrowBooked,
  ensureBookingEscrowReleased,
} from "../repositories/booking-finance.repo.js";
import { resolvePromoForListing } from "../repositories/promo-rules.repo.js";
import {
  getBookingCustomerSnapshot,
  getBookingNoteText,
  getEnabledBookingAddons,
  parseBookingNotes,
} from "../utils/booking-notes.js";

const r = Router();
r.use(auth);

const ListOrdersQuery = z.object({
  q: z.string().trim().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(["code", "productName", "customerName", "amount", "updatedAt"]).default("updatedAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

async function loadListingForOrder(listingId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      title: true,
      basePrice: true,
      status: true,
      type: true,
      unitType: true,
    },
  });

  if (!listing || listing.status !== ListingStatus.APPROVED) {
    return null;
  }

  return listing;
}

function serializeBookingSummary(booking: {
  code: string;
  status: BookingStatus;
  totalAmount: number;
  subtotal: number;
  discountAmount?: number;
  promoCode?: string | null;
  promoTitle?: string | null;
  pricePerUnit: number;
  qty: number;
  guestCount: number;
  startDate: Date;
  endDate: Date;
  notes?: string | null;
  listing: { id: string; title: string };
}) {
  const noteData = parseBookingNotes(booking.notes);
  const addons = getEnabledBookingAddons(noteData);

  return {
    code: booking.code,
    status: booking.status,
    total: booking.totalAmount,
    subtotal: booking.subtotal,
    discountAmount: booking.discountAmount ?? 0,
    startDate: booking.startDate,
    endDate: booking.endDate,
    qty: booking.qty,
    guestCount: booking.guestCount,
    notes: getBookingNoteText(noteData),
    customer: getBookingCustomerSnapshot(noteData),
    addons,
    promo: booking.promoCode
      ? {
          code: booking.promoCode,
          title: booking.promoTitle ?? booking.promoCode,
        }
      : null,
    items: [
      {
        productId: booking.listing.id,
        name: booking.listing.title,
        unitPrice: booking.pricePerUnit,
        qty: booking.qty,
      },
      ...addons.map((addon) => ({
        productId: `addon:${addon.key}`,
        name: addon.label,
        unitPrice: addon.price,
        qty: 1,
      })),
    ],
  };
}

async function validateBuyerIdentity(input: {
  userId: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
  };
}) {
  const buyer = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
    },
  });

  if (!buyer || buyer.role !== Role.USER) {
    const error = new Error("Buyer account not found") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  if (!input.customer) {
    return buyer;
  }

  const normalizedEmail = input.customer.email?.trim().toLowerCase();
  const normalizedBuyerEmail = buyer.email.trim().toLowerCase();
  if (normalizedEmail && normalizedEmail !== normalizedBuyerEmail) {
    const error = new Error("Email buyer harus sesuai dengan akun yang login") as Error & { status?: number };
    error.status = 400;
    throw error;
  }

  const normalizedPhone = input.customer.phone.replace(/\D/g, "");
  const normalizedBuyerPhone = buyer.phone?.replace(/\D/g, "") ?? "";
  if (normalizedBuyerPhone && normalizedPhone && normalizedPhone !== normalizedBuyerPhone) {
    const error = new Error("Nomor HP buyer harus sesuai dengan akun yang login") as Error & { status?: number };
    error.status = 400;
    throw error;
  }

  return buyer;
}

r.get(
  "/",
  requireRole(Role.ADMIN, Role.KASIR, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const query = ListOrdersQuery.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const search = query.q?.trim();

      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" as const } },
                { listing: { title: { contains: search, mode: "insensitive" as const } } },
                { user: { name: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      };

      const [items, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          skip,
          take: query.limit,
          orderBy:
            query.sort === "code"
              ? { code: query.dir }
              : query.sort === "amount"
                ? { totalAmount: query.dir }
                : query.sort === "updatedAt"
                  ? { updatedAt: query.dir }
                  : query.sort === "productName"
                    ? { listing: { title: query.dir } }
                    : { user: { name: query.dir } },
          select: {
            code: true,
            totalAmount: true,
            status: true,
            updatedAt: true,
            listing: { select: { title: true } },
            user: { select: { name: true } },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      return res.json({
        items: items.map((booking) => ({
          code: booking.code,
          productName: booking.listing.title,
          customerName: booking.user.name,
          amount: booking.totalAmount,
          status: booking.status,
          updatedAt: booking.updatedAt.toISOString(),
        })),
        page: query.page,
        pageSize: query.limit,
        total,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/orders
 */
r.post("/", async (req, res, next) => {
  try {
    const body = CreateOrderBody.parse(req.body);
    const listingId = body.listingId ?? body.productId;
    if (!listingId) {
      return res.status(400).json({ error: "listingId or productId is required" });
    }

    const listing = await loadListingForOrder(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Product not found or inactive" });
    }

    const requestedQty = Math.max(1, body.qty ?? 1);
    const isStayListing = listing.unitType === ListingUnitType.PER_NIGHT;
    const parsedStartDate = body.start ? new Date(body.start) : new Date();
    const startDate = Number.isNaN(parsedStartDate.getTime()) ? new Date() : parsedStartDate;
    const quantity =
      isStayListing && body.start && body.end
        ? Math.max(1, nightsBetween(body.start, body.end))
        : requestedQty;
    const endDate = (() => {
      if (!isStayListing) {
        return startDate;
      }

      if (body.end) {
        const parsedEndDate = new Date(body.end);
        if (!Number.isNaN(parsedEndDate.getTime())) {
          return parsedEndDate;
        }
      }

      return new Date(startDate.getTime() + quantity * 24 * 60 * 60 * 1000);
    })();
    const pricePerUnit = listing.basePrice;
    const baseSubtotal = pricePerUnit * quantity;
    const enabledAddons = body.addons
      .filter((addon) => addon.enabled)
      .map((addon) => ({
        key: addon.key,
        label: addon.label,
        price: Math.max(0, Math.round(addon.price)),
        enabled: true,
      }));
    const addonTotal = enabledAddons.reduce((sum, addon) => sum + addon.price, 0);
    const subtotal = baseSubtotal + addonTotal;
    const guestCount = Math.max(1, body.guestCount ?? 1);
    const bookingNote = body.notes?.trim() || null;

    const code = makeCode("ORD", 8);
    const userId = req.user?.id ?? process.env.DEFAULT_PUBLIC_USER_ID;

    if (!userId) {
      return res.status(401).json({ error: "Login required to create an order" });
    }

    const buyer = await validateBuyerIdentity({
      userId,
      customer: body.customer,
    });

    const promo =
      body.promoCode
        ? await resolvePromoForListing({
            code: body.promoCode,
            listingType: listing.type,
            subtotal: baseSubtotal,
          })
        : null;
    const discountAmount = promo?.discountAmount ?? 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const booking = await prisma.booking.create({
      data: {
        code,
        userId,
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerEmail: buyer.email,
        buyerPhone: buyer.phone ?? body.customer?.phone ?? null,
        promoPackageId: promo?.id,
        promoCode: promo?.code,
        promoTitle: promo?.title,
        startDate,
        endDate,
        totalDays: quantity,
        qty: quantity,
        guestCount,
        pricePerUnit,
        subtotal,
        discountAmount,
        totalAmount,
        status: BookingStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        notes: JSON.stringify({
          customer: {
            ...(body.customer ?? {
              name: buyer.name,
              email: buyer.email,
              phone: buyer.phone,
            }),
            identityNumber: body.customer?.identityNumber?.trim() || null,
          },
          booking: {
            guestCount,
            quantity,
            notes: bookingNote,
            baseSubtotal,
            addonTotal,
            addons: enabledAddons,
          },
          promo: promo
            ? {
                id: promo.id,
                code: promo.code,
                title: promo.title,
                discountLabel: promo.discountLabel,
                discountAmount: promo.discountAmount,
              }
            : null,
        }),
      },
      include: {
        listing: {
          select: { id: true, title: true },
        },
        promoPackage: {
          select: { id: true, code: true, title: true },
        },
      },
    });

    return res.status(201).json({
      ok: true,
      payMethod: body.payMethod,
      ...serializeBookingSummary(booking),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:code â†’ detail
 */
r.get("/:code", async (req, res, next) => {
  try {
    const { code } = GetOrderParams.parse(req.params);
    const booking = await prisma.booking.findUnique({
      where: { code },
      include: {
        listing: { select: { id: true, title: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          select: { provider: true, status: true, externalId: true, invoiceUrl: true, paidAt: true },
        },
        promoPackage: { select: { id: true, code: true, title: true } },
      },
    });
    if (!booking) return res.status(404).json({ error: "Order not found" });
    return res.json({
      ok: true,
      order: {
        ...serializeBookingSummary(booking),
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
        buyerEmail: booking.buyerEmail,
        buyerPhone: booking.buyerPhone,
        payments: booking.payments,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:code/pay â†’ guard duplicate payment
 */
r.post("/:code/pay", async (req, res, next) => {
  try {
    const { code } = GetOrderParams.parse(req.params);
    const booking = await prisma.booking.findUnique({
      where: { code },
      select: { code: true, status: true, paymentStatus: true },
    });
    if (!booking) return res.status(404).json({ error: "Order not found" });

    if (booking.paymentStatus === PaymentStatus.PAID) {
      return res.status(409).json({ error: "Order already paid" });
    }

    return res.json({
      ok: true,
      code: booking.code,
      canProceed: true,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/orders/:code/verify
 */
r.get("/:code/verify", async (req, res, next) => {
  try {
    const { code } = VerifyOrderParams.parse(req.params);
    const booking = await prisma.booking.findUnique({
      where: { code },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          select: { provider: true, status: true, externalId: true, paidAt: true, invoiceUrl: true },
        },
      },
    });
    if (!booking) return res.status(404).json({ error: "Order not found" });

    return res.json({
      ok: true,
      code: booking.code,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      payments: booking.payments,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:code/mark-cash
 */
r.post(
  "/:code/mark-cash",
  requireRole(Role.ADMIN, Role.KASIR, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { code } = MarkCashParams.parse(req.params);
      const booking = await prisma.booking.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          sellerId: true,
          paymentStatus: true,
          totalAmount: true,
          platformFee: true,
          discountAmount: true,
          subtotal: true,
        },
      });
      if (!booking) return res.status(404).json({ error: "Order not found" });
      if (booking.paymentStatus === PaymentStatus.PAID) {
        return res.status(409).json({ error: "Order already settled" });
      }

      const externalId = `manual-${booking.code}`;

      const updated = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.upsert({
          where: { externalId },
          update: {
            provider: PaymentProvider.MANUAL,
            amount: 0,
            status: PaymentStatus.PAID,
            paymentMethod: "cash",
            paidAt: new Date(),
          },
          create: {
            bookingId: booking.id,
            provider: PaymentProvider.MANUAL,
            externalId,
            amount: 0,
            currency: "IDR",
            paymentMethod: "cash",
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
          select: { provider: true, status: true, externalId: true, paidAt: true },
        });

        const nextBooking = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.PAID,
            paymentStatus: PaymentStatus.PAID,
            paidAt: new Date(),
          },
          select: {
            code: true,
            status: true,
            totalAmount: true,
          },
        });

        await ensureBookingEscrowBooked(tx, booking);

        return { payment, booking: nextBooking };
      });

      return res.json({
        ok: true,
        code: updated.booking.code,
        status: updated.booking.status,
        total: updated.booking.totalAmount,
        payments: [updated.payment],
      });
    } catch (err) {
      next(err);
    }
  }
);

r.post("/:code/public-settled", requireRole(Role.USER), async (req, res, next) => {
  try {
    const { code } = GetOrderParams.parse(req.params);
    const booking = await prisma.booking.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        userId: true,
        status: true,
        paymentStatus: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (booking.userId !== req.user?.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return res.json({
      ok: true,
      code: booking.code,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      sourceOfTruth: "backend_webhook",
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orders/:code/complete
 */
r.post(
  "/:code/complete",
  requireRole(Role.SELLER, Role.ADMIN, Role.KASIR, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { code } = CompleteOrderParams.parse(req.params);
      const booking = await prisma.booking.findUnique({
        where: { code },
        select: {
          id: true,
          code: true,
          sellerId: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          platformFee: true,
          discountAmount: true,
          subtotal: true,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: "Order not found" });
      }

      const completableStatuses: BookingStatus[] = [
        BookingStatus.PAID,
        BookingStatus.CONFIRMED,
        BookingStatus.COMPLETED,
      ];

      if (!completableStatuses.includes(booking.status)) {
        return res.status(409).json({ error: "Order is not ready to complete" });
      }

      if (booking.paymentStatus !== PaymentStatus.PAID) {
        return res.status(409).json({ error: "Order is not paid yet" });
      }

      if (req.user?.role === Role.SELLER) {
        const seller = await prisma.sellerProfile.findUnique({
          where: { userId: req.user.id },
          select: { id: true },
        });

        if (!seller || seller.id !== booking.sellerId) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }

      const completed = await prisma.$transaction(async (tx) => {
        await ensureBookingEscrowBooked(tx, booking);
        await ensureBookingEscrowReleased(tx, booking);

        return tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.COMPLETED,
            completedAt: new Date(),
          },
          select: {
            code: true,
            status: true,
            totalAmount: true,
            completedAt: true,
          },
        });
      });

      return res.json({
        ok: true,
        code: completed.code,
        status: completed.status,
        total: completed.totalAmount,
        completedAt: completed.completedAt,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default r;











// Canonical transaction source of truth for the active app:
// - `Booking` stores the transaction itself
// - `Payment` stores payment state/history
