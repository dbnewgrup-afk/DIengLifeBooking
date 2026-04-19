import { Router, type Request } from "express";
import { z } from "zod";
import prisma from "../lib/db.js";
import {
  BookingStatus,
  ListingStatus,
  ListingUnitType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
} from "@prisma/client";
import {
  CompleteOrderParams,
  CreateOrderBody,
  CreateOrderItemBody,
  GetOrderParams,
  MarkCashParams,
  VerifyOrderParams,
} from "../schemas/orders.schema.js";
import { nightsBetween } from "../utils/date.js";
import { makeCode } from "../utils/string.js";
import auth, { requireRole } from "../middlewares/auth.js";
import {
  ensureBookingEscrowBooked,
  ensureBookingEscrowReleased,
} from "../repositories/booking-finance.repo.js";
import { verifyAffiliateAttribution } from "../repositories/affiliates.repo.js";
import {
  createGroupedXenditInvoice,
  fetchXenditInvoice,
  syncXenditInvoiceToBooking,
} from "../repositories/xendit-payments-grouped.repo.js";
import { reserveBookingAvailability } from "../repositories/booking-availability.repo.js";
import { syncExpiredBookings } from "../repositories/booking-expiry.repo.js";
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

const orderInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      type: true,
      unitType: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      provider: true,
      status: true,
      externalId: true,
      invoiceUrl: true,
      paidAt: true,
      createdAt: true,
    },
  },
  promoPackage: {
    select: {
      id: true,
      code: true,
      title: true,
    },
  },
} satisfies Prisma.BookingInclude;

type OrderBookingRecord = Prisma.BookingGetPayload<{
  include: typeof orderInclude;
}>;

type OrderLineInput = z.infer<typeof CreateOrderItemBody>;

type CartOrderInput = Extract<
  z.infer<typeof CreateOrderBody>,
  { mode: "cart" }
>;

type SingleOrderInput = Exclude<z.infer<typeof CreateOrderBody>, CartOrderInput>;

type OrderCustomerInput = NonNullable<SingleOrderInput["customer"]> | CartOrderInput["customer"];

type BuyerSnapshot = {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: Role;
};

type BookingListingRecord = {
  id: string;
  sellerId: string;
  title: string;
  basePrice: number;
  maxGuest: number;
  status: ListingStatus;
  type: OrderBookingRecord["listing"]["type"];
  unitType: ListingUnitType;
};

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

async function ensureOrderAccess(
  bookings: OrderBookingRecord[],
  user: { id: string; role: Role } | undefined
) {
  if (!user) {
    throw createHttpError(401, "Unauthorized");
  }

  if (
    user.role === Role.ADMIN ||
    user.role === Role.KASIR ||
    user.role === Role.SUPER_ADMIN
  ) {
    return;
  }

  if (user.role === Role.USER) {
    const isOwner = bookings.every((booking) => booking.userId === user.id);
    if (!isOwner) {
      throw createHttpError(403, "Forbidden");
    }
    return;
  }

  if (user.role === Role.SELLER) {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const isSellerOwner =
      Boolean(seller) &&
      bookings.every((booking) => booking.sellerId === seller?.id);

    if (!isSellerOwner) {
      throw createHttpError(403, "Forbidden");
    }
    return;
  }

  throw createHttpError(403, "Forbidden");
}

function isCartOrderBody(body: z.infer<typeof CreateOrderBody>): body is CartOrderInput {
  return "items" in body;
}

function normalizeDateOnly(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function formatDateOnly(value?: Date | string | null) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function toSafeDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return normalizeDateOnly(parsed);
}

function resolveListingId(input: { listingId?: string; productId?: string }) {
  return input.listingId ?? input.productId ?? null;
}

async function loadListingForOrder(
  client: Prisma.TransactionClient | typeof prisma,
  listingId: string
) {
  const listing = await client.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      sellerId: true,
      title: true,
      basePrice: true,
      maxGuest: true,
      status: true,
      type: true,
      unitType: true,
    },
  });

  if (!listing || listing.status !== ListingStatus.APPROVED) {
    return null;
  }

  return listing satisfies BookingListingRecord;
}

function resolveDurationAndDates(listing: BookingListingRecord, item: OrderLineInput) {
  const parsedStart = toSafeDate(item.start);
  if (!parsedStart) {
    throw createHttpError(400, `Tanggal mulai wajib diisi untuk ${listing.title}.`);
  }

  if (listing.unitType === ListingUnitType.PER_NIGHT) {
    if (!item.start || !item.end) {
      throw createHttpError(400, `Check-in dan check-out wajib diisi untuk ${listing.title}.`);
    }

    const parsedEnd = toSafeDate(item.end);
    if (!parsedEnd) {
      throw createHttpError(400, `Tanggal selesai tidak valid untuk ${listing.title}.`);
    }

    if (parsedEnd.getTime() <= parsedStart.getTime()) {
      throw createHttpError(400, `Tanggal checkout harus setelah check-in untuk ${listing.title}.`);
    }

    return {
      startDate: parsedStart,
      endDate: parsedEnd,
      durationUnits: Math.max(1, nightsBetween(item.start, item.end)),
      unitLabel: "malam",
    };
  }

  return {
    startDate: parsedStart,
    endDate: parsedStart,
    durationUnits: Math.max(1, item.schedule?.hours ?? 1),
    unitLabel: item.schedule?.hours ? "jam" : "rute",
  };
}

function buildOrderItemScheduleLabel(booking: OrderBookingRecord) {
  const noteData = parseBookingNotes(booking.notes);
  const rawSchedule =
    noteData.booking && typeof noteData.booking === "object"
      ? (noteData.booking.schedule as Record<string, unknown> | null | undefined)
      : null;
  const time = typeof rawSchedule?.time === "string" ? rawSchedule.time : null;

  const startLabel = formatDateOnly(booking.startDate);
  const endLabel = formatDateOnly(booking.endDate);

  if (booking.listing.unitType === ListingUnitType.PER_NIGHT) {
    return `${startLabel ?? "-"} - ${endLabel ?? "-"}`;
  }

  return `${startLabel ?? "-"}${time ? `, ${time}` : ""}`;
}

function buildOrderItemDetailLabel(booking: OrderBookingRecord) {
  const noteData = parseBookingNotes(booking.notes);
  const bookingMeta =
    noteData.booking && typeof noteData.booking === "object"
      ? (noteData.booking as Record<string, unknown>)
      : null;
  const rawSchedule =
    bookingMeta?.schedule && typeof bookingMeta.schedule === "object"
      ? (bookingMeta.schedule as Record<string, unknown>)
      : null;
  const route = typeof rawSchedule?.route === "string" ? rawSchedule.route : null;
  const hours = Number(rawSchedule?.hours ?? bookingMeta?.durationUnits ?? 0);
  const guestCount = Number(bookingMeta?.guestCount ?? booking.guestCount);

  if (booking.listing.unitType === ListingUnitType.PER_NIGHT) {
    return `${booking.totalDays} malam | ${guestCount} tamu`;
  }

  if (booking.listing.type === "TRANSPORT") {
    return route || `${booking.qty} rute`;
  }

  return `${Math.max(1, hours || booking.totalDays)} jam | ${booking.qty} unit`;
}

function buildOrderItemsFromBooking(booking: OrderBookingRecord) {
  const noteData = parseBookingNotes(booking.notes);
  const bookingMeta =
    noteData.booking && typeof noteData.booking === "object"
      ? (noteData.booking as Record<string, unknown>)
      : null;
  const baseSubtotalValue = Number(bookingMeta?.baseSubtotal ?? booking.pricePerUnit * booking.qty);
  const baseSubtotal = Number.isFinite(baseSubtotalValue)
    ? Math.max(0, Math.round(baseSubtotalValue))
    : booking.pricePerUnit * booking.qty;
  const addons = getEnabledBookingAddons(noteData);

  return [
    {
      productId: booking.listing.id,
      name: booking.listing.title,
      qty: booking.qty,
      unitPrice: booking.pricePerUnit,
      lineTotal: baseSubtotal,
      type: "listing" as const,
      bookingCode: booking.code,
      scheduleLabel: buildOrderItemScheduleLabel(booking),
      detailLabel: buildOrderItemDetailLabel(booking),
    },
    ...addons.map((addon) => ({
      productId: `addon:${booking.code}:${addon.key}`,
      name: `${addon.label} (${booking.listing.title})`,
      qty: 1,
      unitPrice: addon.price,
      lineTotal: addon.price,
      type: "addon" as const,
      bookingCode: booking.code,
    })),
  ];
}

function normalizePaymentDisplayKey(payment: OrderBookingRecord["payments"][number]) {
  if (payment.invoiceUrl) {
    return payment.invoiceUrl;
  }

  if (payment.externalId?.includes(":")) {
    return payment.externalId.split(":")[0];
  }

  return payment.externalId ?? `${payment.provider}:${payment.status}`;
}

function extractInvoiceId(payment: OrderBookingRecord["payments"][number] | null | undefined) {
  if (!payment?.externalId) return null;
  return payment.externalId.includes(":")
    ? payment.externalId.split(":")[0]
    : payment.externalId;
}

function getLatestXenditPayment(bookings: OrderBookingRecord[]) {
  return bookings
    .flatMap((booking) => booking.payments)
    .filter((payment) => payment.provider === PaymentProvider.XENDIT)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0] ?? null;
}

function resolvePublicAppUrl(req: Request) {
  const envUrl =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  const origin = req.get("origin")?.trim();
  if (origin) {
    return origin.replace(/\/+$/, "");
  }

  const referer = req.get("referer")?.trim();
  if (referer) {
    try {
      const url = new URL(referer);
      return `${url.protocol}//${url.host}`;
    } catch {
      // Ignore invalid referer values.
    }
  }

  const proto = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
  const host = req.get("x-forwarded-host")?.split(",")[0]?.trim() || req.get("host")?.trim();
  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return null;
}

function buildPaymentRedirectUrls(
  req: Request,
  orderCode: string,
  mode: "single" | "cart"
) {
  const appUrl = resolvePublicAppUrl(req);
  if (!appUrl) {
    throw createHttpError(
      503,
      "URL aplikasi public belum bisa ditentukan untuk redirect pembayaran."
    );
  }

  return {
    successRedirectUrl: `${appUrl}/payment/success?code=${encodeURIComponent(orderCode)}&mode=${mode}`,
    failureRedirectUrl:
      mode === "cart"
        ? `${appUrl}/checkout?source=cart&status=failed&code=${encodeURIComponent(orderCode)}`
        : `${appUrl}/checkout?status=failed&code=${encodeURIComponent(orderCode)}`,
  };
}

function buildXenditOrderDescription(order: ReturnType<typeof serializeOrderSummary>) {
  const listingItems = order.items.filter((item) => item.type !== "addon");
  const customerName = order.customer?.name?.trim() || order.buyerEmail?.trim() || order.code;

  return order.isMultiItem
    ? `Checkout ${listingItems.length} item - ${customerName}`
    : `Booking ${listingItems[0]?.name ?? order.code} - ${customerName}`;
}

function resolveOrderCustomer(order: ReturnType<typeof serializeOrderSummary>) {
  const fullName = order.customer?.name?.trim();
  const email = order.buyerEmail?.trim().toLowerCase();
  const phone = order.buyerPhone?.trim();

  if (!fullName || !email || !phone) {
    throw createHttpError(
      409,
      "Data customer order belum lengkap untuk membuat invoice Xendit."
    );
  }

  return {
    fullName,
    email,
    phone,
  };
}

async function syncCanonicalOrderPaymentStatus(orderGroup: NonNullable<Awaited<ReturnType<typeof loadOrderBookings>>>) {
  const currentPaymentStatus = aggregatePaymentStatus(orderGroup.bookings);
  if (
    currentPaymentStatus === PaymentStatus.PAID ||
    currentPaymentStatus === PaymentStatus.REFUNDED
  ) {
    return orderGroup;
  }

  const latestXenditPayment = getLatestXenditPayment(orderGroup.bookings);
  if (!latestXenditPayment) {
    return orderGroup;
  }

  try {
    const invoice = await fetchXenditInvoice(orderGroup.orderCode);
    await syncXenditInvoiceToBooking(invoice);
    return (await loadOrderBookings(orderGroup.orderCode)) ?? orderGroup;
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;

    if (status === 404 || status === 503) {
      return orderGroup;
    }

    throw error;
  }
}

function aggregatePaymentStatus(bookings: OrderBookingRecord[]) {
  const statuses = bookings.map((booking) => booking.paymentStatus);

  if (statuses.every((status) => status === PaymentStatus.PAID)) return PaymentStatus.PAID;
  if (statuses.every((status) => status === PaymentStatus.REFUNDED)) return PaymentStatus.REFUNDED;
  if (statuses.some((status) => status === PaymentStatus.PENDING)) return PaymentStatus.PENDING;
  if (statuses.some((status) => status === PaymentStatus.FAILED)) return PaymentStatus.FAILED;
  if (statuses.some((status) => status === PaymentStatus.EXPIRED)) return PaymentStatus.EXPIRED;

  return statuses[0] ?? PaymentStatus.PENDING;
}

function aggregateBookingStatus(bookings: OrderBookingRecord[]) {
  const statuses = bookings.map((booking) => booking.status);

  if (statuses.every((status) => status === BookingStatus.COMPLETED)) return BookingStatus.COMPLETED;
  if (statuses.every((status) => status === BookingStatus.PAID)) return BookingStatus.PAID;
  if (statuses.every((status) => status === BookingStatus.CONFIRMED)) return BookingStatus.CONFIRMED;
  if (statuses.some((status) => status === BookingStatus.AWAITING_PAYMENT || status === BookingStatus.PENDING)) {
    return BookingStatus.AWAITING_PAYMENT;
  }
  if (statuses.some((status) => status === BookingStatus.EXPIRED)) return BookingStatus.EXPIRED;
  if (statuses.some((status) => status === BookingStatus.CANCELLED)) return BookingStatus.CANCELLED;

  return statuses[0] ?? BookingStatus.PENDING;
}

function serializeOrderSummary(orderCode: string, bookings: OrderBookingRecord[]) {
  const sortedBookings = [...bookings].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );
  const firstBooking = sortedBookings[0];
  const customerSnapshot = getBookingCustomerSnapshot(parseBookingNotes(firstBooking?.notes));
  const allPayments = sortedBookings.flatMap((booking) => booking.payments);
  const paymentMap = new Map<string, (typeof allPayments)[number]>();

  for (const payment of allPayments) {
    const key = normalizePaymentDisplayKey(payment);
    if (!paymentMap.has(key)) {
      paymentMap.set(key, payment);
    }
  }

  const startDate = sortedBookings.reduce<Date | null>((current, booking) => {
    if (!current || booking.startDate < current) {
      return booking.startDate;
    }
    return current;
  }, null);

  const endDate = sortedBookings.reduce<Date | null>((current, booking) => {
    if (!current || booking.endDate > current) {
      return booking.endDate;
    }
    return current;
  }, null);

  const promos = sortedBookings
    .filter((booking) => booking.promoCode)
    .map((booking) => ({
      code: booking.promoCode as string,
      title: booking.promoTitle ?? booking.promoCode ?? "",
    }));
  const uniquePromo =
    promos.length === 1 || promos.every((promo) => promo.code === promos[0]?.code)
      ? promos[0] ?? null
      : null;

  return {
    code: orderCode,
    status: aggregateBookingStatus(sortedBookings),
    paymentStatus: aggregatePaymentStatus(sortedBookings),
    total: sortedBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    subtotal: sortedBookings.reduce((sum, booking) => sum + booking.subtotal, 0),
    discountAmount: sortedBookings.reduce((sum, booking) => sum + booking.discountAmount, 0),
    qty: sortedBookings.reduce((sum, booking) => sum + booking.qty, 0),
    guestCount:
      sortedBookings.length === 1
        ? firstBooking?.guestCount ?? null
        : sortedBookings.reduce((sum, booking) => sum + booking.guestCount, 0),
    startDate,
    endDate,
    notes:
      sortedBookings.length === 1
        ? getBookingNoteText(parseBookingNotes(firstBooking?.notes))
        : null,
    createdAt: firstBooking?.createdAt ?? null,
    buyerEmail: firstBooking?.buyerEmail ?? null,
    buyerPhone: firstBooking?.buyerPhone ?? null,
    customer: customerSnapshot,
    promo: uniquePromo,
    bookingCodes: sortedBookings.map((booking) => booking.code),
    isMultiItem: sortedBookings.length > 1,
    items: sortedBookings.flatMap(buildOrderItemsFromBooking),
    payments: [...paymentMap.values()].map((payment) => ({
      provider: payment.provider,
      status: payment.status,
      externalId:
        payment.externalId && payment.externalId.includes(":")
          ? payment.externalId.split(":")[0]
          : payment.externalId,
      invoiceUrl: payment.invoiceUrl,
      paidAt: payment.paidAt,
    })),
  };
}

async function loadOrderBookings(code: string) {
  const grouped = await prisma.booking.findMany({
    where: { checkoutCode: code },
    include: orderInclude,
  });

  if (grouped.length > 0) {
    return {
      orderCode: code,
      bookings: grouped,
    };
  }

  const single = await prisma.booking.findUnique({
    where: { code },
    include: orderInclude,
  });

  if (!single) {
    return null;
  }

  return {
    orderCode: single.code,
    bookings: [single],
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
    throw createHttpError(404, "Buyer account not found");
  }

  if (!input.customer) {
    return buyer satisfies BuyerSnapshot;
  }

  const normalizedEmail = input.customer.email?.trim().toLowerCase();
  const normalizedBuyerEmail = buyer.email.trim().toLowerCase();
  if (normalizedEmail && normalizedEmail !== normalizedBuyerEmail) {
    throw createHttpError(400, "Email buyer harus sesuai dengan akun yang login");
  }

  const normalizedPhone = input.customer.phone.replace(/\D/g, "");
  const normalizedBuyerPhone = buyer.phone?.replace(/\D/g, "") ?? "";
  if (normalizedBuyerPhone && normalizedPhone && normalizedPhone !== normalizedBuyerPhone) {
    throw createHttpError(400, "Nomor HP buyer harus sesuai dengan akun yang login");
  }

  return buyer satisfies BuyerSnapshot;
}

async function createBookingLine(
  tx: Prisma.TransactionClient,
  input: {
    item: OrderLineInput;
    listing: BookingListingRecord;
    userId: string;
    buyer: BuyerSnapshot;
    checkoutCode: string | null;
    customer?: OrderCustomerInput;
    affiliateReference?: string | null;
  }
) {
  const { item, listing, userId, buyer, checkoutCode, customer, affiliateReference } = input;
  const requestedQty = Math.max(1, item.qty ?? 1);
  const { startDate, endDate, durationUnits, unitLabel } = resolveDurationAndDates(listing, item);
  const chargeUnits = requestedQty * durationUnits;
  const pricePerUnit = listing.basePrice;
  const baseSubtotal = pricePerUnit * chargeUnits;
  const enabledAddons = item.addons
    .filter((addon) => addon.enabled)
    .map((addon) => ({
      key: addon.key,
      label: addon.label,
      price: Math.max(0, Math.round(addon.price)),
      enabled: true,
    }));
  const addonTotal = enabledAddons.reduce((sum, addon) => sum + addon.price, 0);
  const subtotal = baseSubtotal + addonTotal;
  const guestCount = Math.max(1, item.guestCount ?? 1);
  if (guestCount > listing.maxGuest) {
    throw createHttpError(
      409,
      `Jumlah tamu untuk ${listing.title} melebihi kapasitas maksimum ${listing.maxGuest}.`
    );
  }

  const promo = item.promoCode
    ? await resolvePromoForListing({
        code: item.promoCode,
        listingType: listing.type,
        subtotal: baseSubtotal,
      })
    : null;
  const discountAmount = promo?.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  await reserveBookingAvailability(tx, {
    listingId: listing.id,
    startDate,
    endDate,
    qty: requestedQty,
    unitType: listing.unitType,
  });

  return tx.booking.create({
    data: {
      code: makeCode("ORD", 8),
      checkoutCode,
      userId,
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone ?? customer?.phone ?? null,
      promoPackageId: promo?.id,
      promoCode: promo?.code,
      promoTitle: promo?.title,
      startDate,
      endDate,
      totalDays: durationUnits,
      qty: requestedQty,
      guestCount,
      pricePerUnit,
      subtotal,
      discountAmount,
      totalAmount,
      status: BookingStatus.AWAITING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      notes: JSON.stringify({
        source: checkoutCode ? "cart" : "single",
        affiliateReference: affiliateReference?.trim().toUpperCase() || null,
        affiliateCode: affiliateReference?.trim().toUpperCase() || null,
        customer: {
          ...(customer ?? {
            name: buyer.name,
            email: buyer.email,
            phone: buyer.phone,
          }),
          identityNumber: customer?.identityNumber?.trim() || null,
        },
        booking: {
          guestCount,
          quantity: requestedQty,
          durationUnits,
          chargeUnits,
          notes: item.notes?.trim() || null,
          baseSubtotal,
          addonTotal,
          addons: enabledAddons,
          schedule: {
            time: item.schedule?.time?.trim() || null,
            hours: item.schedule?.hours ?? null,
            route: item.schedule?.route?.trim() || null,
            unitLabel,
          },
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
    include: orderInclude,
  });
}

r.get(
  "/",
  requireRole(Role.ADMIN, Role.KASIR, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      await syncExpiredBookings();

      const query = ListOrdersQuery.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const search = query.q?.trim();

      const where = {
        ...(query.status ? { status: query.status } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" as const } },
                { checkoutCode: { contains: search, mode: "insensitive" as const } },
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
            checkoutCode: true,
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
          checkoutCode: booking.checkoutCode,
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

r.post("/", async (req, res, next) => {
  try {
    await syncExpiredBookings();

    const body = CreateOrderBody.parse(req.body);
    const payMethod = body.payMethod;
    const userId = req.user?.id ?? process.env.DEFAULT_PUBLIC_USER_ID;

    if (!userId) {
      return res.status(401).json({ error: "Login required to create an order" });
    }

    const customer: OrderCustomerInput | undefined = isCartOrderBody(body)
      ? body.customer
      : body.customer;
    const buyer = await validateBuyerIdentity({
      userId,
      customer,
    });
    const verifiedAffiliateReference = await verifyAffiliateAttribution({
      affiliateReference: body.affiliateReference?.trim() || null,
      attribution: body.affiliateAttribution ?? null,
    });

    const lineItems = isCartOrderBody(body) ? body.items : [body];
    const checkoutCode = isCartOrderBody(body)
      ? body.orderCode?.trim() || makeCode("CRT", 10)
      : null;

    const bookings = await prisma.$transaction(async (tx) => {
      const createdBookings: OrderBookingRecord[] = [];

      for (const item of lineItems) {
        const listingId = resolveListingId(item);
        if (!listingId) {
          throw createHttpError(400, "listingId or productId is required");
        }

        const listing = await loadListingForOrder(tx, listingId);
        if (!listing) {
          throw createHttpError(404, "Product not found or inactive");
        }

        const created = await createBookingLine(tx, {
          item,
          listing,
          userId,
          buyer,
          checkoutCode,
          customer,
          affiliateReference: verifiedAffiliateReference,
        });
        createdBookings.push(created);
      }

      return createdBookings;
    });

    const orderCode = checkoutCode ?? bookings[0]?.code ?? makeCode("ORD", 8);
    const order = serializeOrderSummary(orderCode, bookings);

    return res.status(201).json({
      ok: true,
      payMethod,
      ...order,
      order,
    });
  } catch (err) {
    next(err);
  }
});

r.get("/:code", async (req, res, next) => {
  try {
    await syncExpiredBookings();

    const { code } = GetOrderParams.parse(req.params);
    const orderGroup = await loadOrderBookings(code);

    if (!orderGroup) {
      return res.status(404).json({ error: "Order not found" });
    }

    await ensureOrderAccess(orderGroup.bookings, req.user);
    const syncedOrderGroup = await syncCanonicalOrderPaymentStatus(orderGroup);

    return res.json({
      ok: true,
      order: serializeOrderSummary(syncedOrderGroup.orderCode, syncedOrderGroup.bookings),
    });
  } catch (err) {
    next(err);
  }
});

r.post("/:code/pay", async (req, res, next) => {
  try {
    await syncExpiredBookings();

    const { code } = GetOrderParams.parse(req.params);
    const orderGroup = await loadOrderBookings(code);

    if (!orderGroup) {
      return res.status(404).json({ error: "Order not found" });
    }

    await ensureOrderAccess(orderGroup.bookings, req.user);
    const syncedOrderGroup = await syncCanonicalOrderPaymentStatus(orderGroup);
    const paymentStatus = aggregatePaymentStatus(syncedOrderGroup.bookings);
    const status = aggregateBookingStatus(syncedOrderGroup.bookings);

    if (paymentStatus === PaymentStatus.PAID) {
      return res.status(409).json({ error: "Order already paid" });
    }

    if (paymentStatus === PaymentStatus.EXPIRED || paymentStatus === PaymentStatus.FAILED) {
      return res.status(409).json({
        error: "Order payment sudah berakhir. Buat booking baru untuk mencoba lagi.",
      });
    }

    if (status === BookingStatus.CANCELLED || status === BookingStatus.EXPIRED) {
      return res.status(409).json({
        error: "Order ini sudah tidak aktif untuk diproses pembayaran.",
      });
    }

    const existingPendingPayment = getLatestXenditPayment(syncedOrderGroup.bookings);
    if (
      existingPendingPayment?.status === PaymentStatus.PENDING &&
      existingPendingPayment.invoiceUrl
    ) {
      return res.json({
        ok: true,
        code: syncedOrderGroup.orderCode,
        canProceed: true,
        status,
        paymentStatus,
        invoiceId: extractInvoiceId(existingPendingPayment),
        invoiceUrl: existingPendingPayment.invoiceUrl,
      });
    }

    const order = serializeOrderSummary(syncedOrderGroup.orderCode, syncedOrderGroup.bookings);
    const mode: "single" | "cart" = order.isMultiItem ? "cart" : "single";
    const { successRedirectUrl, failureRedirectUrl } = buildPaymentRedirectUrls(
      req,
      syncedOrderGroup.orderCode,
      mode
    );
    const invoice = await createGroupedXenditInvoice({
      orderCode: syncedOrderGroup.orderCode,
      bookings: syncedOrderGroup.bookings.map((booking) => ({
        id: booking.id,
        code: booking.code,
        totalAmount: booking.totalAmount,
      })),
      amount: order.total,
      description: buildXenditOrderDescription(order),
      customer: resolveOrderCustomer(order),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.qty,
        price: item.unitPrice,
        category: item.type ?? "booking",
      })),
      successRedirectUrl,
      failureRedirectUrl,
    });

    return res.json({
      ok: true,
      code: syncedOrderGroup.orderCode,
      canProceed: true,
      status,
      paymentStatus,
      invoiceId: invoice.invoiceId,
      invoiceUrl: invoice.invoiceUrl,
      xenditStatus: invoice.invoiceStatus,
    });
  } catch (err) {
    next(err);
  }
});

r.get("/:code/verify", async (req, res, next) => {
  try {
    await syncExpiredBookings();

    const { code } = VerifyOrderParams.parse(req.params);
    const orderGroup = await loadOrderBookings(code);

    if (!orderGroup) {
      return res.status(404).json({ error: "Order not found" });
    }

    await ensureOrderAccess(orderGroup.bookings, req.user);
    const syncedOrderGroup = await syncCanonicalOrderPaymentStatus(orderGroup);
    const order = serializeOrderSummary(syncedOrderGroup.orderCode, syncedOrderGroup.bookings);

    return res.json({
      ok: true,
      code: order.code,
      status: order.status,
      paymentStatus: order.paymentStatus,
      payments: order.payments,
      bookingCodes: order.bookingCodes,
    });
  } catch (err) {
    next(err);
  }
});

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
