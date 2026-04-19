import {
  BookingStatus,
  ListingStatus,
  ListingUnitType,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  Role,
  UserStatus,
} from "@prisma/client";
import prisma from "../lib/db.js";
import { ensureBookingEscrowBooked } from "./booking-finance.repo.js";
import {
  fetchXenditInvoice,
  syncXenditInvoiceToBooking,
} from "./xendit-payments-grouped.repo.js";

const WALKIN_SOURCE = "WALKIN_CASHIER";
const WALKIN_CHANNEL = "ONSITE";

const cashierBookingSelect = {
  id: true,
  code: true,
  buyerEmail: true,
  buyerPhone: true,
  startDate: true,
  endDate: true,
  totalAmount: true,
  totalDays: true,
  qty: true,
  guestCount: true,
  subtotal: true,
  discountAmount: true,
  platformFee: true,
  pricePerUnit: true,
  status: true,
  paymentStatus: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  listing: {
    select: {
      id: true,
      title: true,
      type: true,
      unitType: true,
      locationText: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      provider: true,
      externalId: true,
      invoiceUrl: true,
      amount: true,
      paymentMethod: true,
      status: true,
      paidAt: true,
      expiredAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.BookingSelect;

type CashierBookingRecord = Prisma.BookingGetPayload<{
  select: typeof cashierBookingSelect;
}>;

type CashierActor = {
  actorId?: string | null;
  actorRole?: Role | null;
};

export type CashierSummary = {
  walkinsToday: number;
  checkinsToday: number;
  pendingPayments: number;
  revenueToday: number;
  xenditAwaitingVerification: number;
};

export type CashierBookingRow = {
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  productName: string;
  listingId: string;
  listingType: string;
  unitType: string;
  locationText: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalDays: number;
  quantity: number;
  guestCount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider | null;
  paymentMethod: string | null;
  paymentExternalId: string | null;
  invoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  isWalkIn: boolean;
  source: "WALKIN_CASHIER" | "ONLINE";
};

export type CashierOverviewPayload = {
  summary: CashierSummary;
  recentBookings: CashierBookingRow[];
  pendingPayments: CashierBookingRow[];
  pendingXendit: CashierBookingRow[];
};

type WalkInCustomerInput = {
  name: string;
  email: string;
  phone: string;
};

export type CreateWalkInBookingInput = CashierActor & {
  listingId: string;
  startDate: string;
  endDate?: string | null;
  quantity: number;
  guestCount: number;
  customer: WalkInCustomerInput;
  affiliateReference?: string | null;
  note?: string | null;
};

export type ManualPaymentInput = CashierActor & {
  code: string;
  amount?: number;
  method: "CASH" | "TRANSFER";
  note?: string | null;
};

export type CashierVerifyXenditResult = {
  booking: CashierBookingRow;
  invoice: {
    id: string | null;
    externalId: string;
    status: string;
    amount: number;
    invoiceUrl: string | null;
    paidAt: string | null;
    expiryDate: string | null;
    payerEmail: string | null;
  };
};

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfToday() {
  const value = startOfToday();
  value.setHours(23, 59, 59, 999);
  return value;
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "").trim();
}

function parseDateOnly(input: string, fieldName: string) {
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) {
    throw createHttpError(400, `${fieldName} tidak valid`);
  }
  return value;
}

function getDateDiffInDays(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  return Number.isFinite(diff) ? diff : 0;
}

function isPaidLike(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.PAID ||
    status === BookingStatus.PAID ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  );
}

function isWalkInSource(notes?: string | null) {
  return typeof notes === "string" && notes.includes(`"source":"${WALKIN_SOURCE}"`);
}

function parseBookingNotes(notes?: string | null) {
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function mergeBookingNotes(
  notes: string | null,
  patch: Record<string, unknown>
) {
  const current = parseBookingNotes(notes);
  return JSON.stringify({
    ...current,
    ...patch,
  });
}

function serializeCashierBooking(booking: CashierBookingRecord): CashierBookingRow {
  const noteData = parseBookingNotes(booking.notes);
  const customerSnapshot =
    noteData.customer && typeof noteData.customer === "object"
      ? (noteData.customer as Record<string, unknown>)
      : null;
  const latestPayment = booking.payments[0] ?? null;
  const isWalkIn = isWalkInSource(booking.notes);

  return {
    code: booking.code,
    customerName:
      (typeof customerSnapshot?.name === "string" && customerSnapshot.name) ||
      booking.user.name,
    customerEmail:
      (typeof customerSnapshot?.email === "string" && customerSnapshot.email) ||
      booking.buyerEmail ||
      booking.user.email,
    customerPhone:
      (typeof customerSnapshot?.phone === "string" && customerSnapshot.phone) ||
      booking.buyerPhone ||
      booking.user.phone ||
      null,
    productName: booking.listing.title,
    listingId: booking.listing.id,
    listingType: booking.listing.type,
    unitType: booking.listing.unitType,
    locationText: booking.listing.locationText,
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalAmount: booking.totalAmount,
    totalDays: booking.totalDays,
    quantity: booking.qty,
    guestCount: booking.guestCount,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentProvider: latestPayment?.provider ?? null,
    paymentMethod: latestPayment?.paymentMethod ?? null,
    paymentExternalId: latestPayment?.externalId ?? null,
    invoiceUrl: latestPayment?.invoiceUrl ?? null,
    paidAt: booking.paidAt?.toISOString() ?? latestPayment?.paidAt?.toISOString() ?? null,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    isWalkIn,
    source: isWalkIn ? "WALKIN_CASHIER" : "ONLINE",
  };
}

async function resolveWalkInBuyer(
  tx: Prisma.TransactionClient,
  customer: WalkInCustomerInput
) {
  const email = customer.email.trim().toLowerCase();
  const phone = normalizePhone(customer.phone);

  const existing = await tx.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
    },
  });

  if (existing) {
    if (existing.role !== Role.USER) {
      throw createHttpError(
        409,
        "Email customer sudah dipakai akun internal. Gunakan email customer yang berbeda."
      );
    }

    return tx.user.update({
      where: { id: existing.id },
      data: {
        name: customer.name.trim(),
        phone,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
  }

  return tx.user.create({
    data: {
      name: customer.name.trim(),
      email,
      phone,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });
}

async function getBookingRecordByCode(code: string) {
  const booking = await prisma.booking.findUnique({
    where: { code },
    select: cashierBookingSelect,
  });

  if (!booking) {
    throw createHttpError(404, "Booking tidak ditemukan.");
  }

  return booking;
}

export async function getCashierOverview(): Promise<CashierOverviewPayload> {
  const today = {
    gte: startOfToday(),
    lte: endOfToday(),
  };

  const walkInMarker = `"source":"${WALKIN_SOURCE}"`;
  const pendingBaseWhere: Prisma.BookingWhereInput = {
    paymentStatus: PaymentStatus.PENDING,
    status: {
      in: [BookingStatus.PENDING, BookingStatus.AWAITING_PAYMENT],
    },
  };

  const nonWalkInWhere: Prisma.BookingWhereInput = {
    OR: [
      { notes: null },
      {
        NOT: {
          notes: {
            contains: walkInMarker,
          },
        },
      },
    ],
  };

  const [walkinsToday, checkinsToday, pendingPayments, revenueToday, recentBookings, pendingBookingRows, pendingXenditRows] =
    await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: today,
          notes: {
            contains: walkInMarker,
          },
        },
      }),
      prisma.booking.count({
        where: {
          startDate: today,
          status: {
            in: [BookingStatus.PAID, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
          },
        },
      }),
      prisma.booking.count({
        where: pendingBaseWhere,
      }),
      prisma.booking.aggregate({
        where: {
          paidAt: today,
          paymentStatus: PaymentStatus.PAID,
        },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        orderBy: [{ updatedAt: "desc" }],
        take: 8,
        select: cashierBookingSelect,
      }),
      prisma.booking.findMany({
        where: pendingBaseWhere,
        orderBy: [{ createdAt: "desc" }],
        take: 8,
        select: cashierBookingSelect,
      }),
      prisma.booking.findMany({
        where: {
          ...pendingBaseWhere,
          AND: [
            nonWalkInWhere,
            {
              payments: {
                none: {
                  provider: PaymentProvider.MANUAL,
                },
              },
            },
          ],
        },
        orderBy: [{ createdAt: "desc" }],
        take: 8,
        select: cashierBookingSelect,
      }),
    ]);

  return {
    summary: {
      walkinsToday,
      checkinsToday,
      pendingPayments,
      revenueToday: revenueToday._sum.totalAmount ?? 0,
      xenditAwaitingVerification: pendingXenditRows.length,
    },
    recentBookings: recentBookings.map(serializeCashierBooking),
    pendingPayments: pendingBookingRows.map(serializeCashierBooking),
    pendingXendit: pendingXenditRows.map(serializeCashierBooking),
  };
}

export async function createWalkInBooking(input: CreateWalkInBookingInput) {
  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    select: {
      id: true,
      sellerId: true,
      title: true,
      type: true,
      unitType: true,
      basePrice: true,
      locationText: true,
      maxGuest: true,
      status: true,
    },
  });

  if (!listing || listing.status !== ListingStatus.APPROVED) {
    throw createHttpError(404, "Listing untuk walk-in tidak ditemukan atau belum aktif.");
  }

  const startDate = parseDateOnly(input.startDate, "Tanggal mulai");
  const endDate =
    listing.unitType === ListingUnitType.PER_NIGHT
      ? parseDateOnly(input.endDate ?? "", "Tanggal selesai")
      : startDate;

  const totalDays =
    listing.unitType === ListingUnitType.PER_NIGHT
      ? getDateDiffInDays(input.startDate, input.endDate ?? "")
      : 1;

  if (listing.unitType === ListingUnitType.PER_NIGHT && totalDays <= 0) {
    throw createHttpError(400, "Tanggal selesai harus lebih besar dari tanggal mulai.");
  }

  const quantity = Math.max(1, input.quantity);
  const chargeUnits = listing.unitType === ListingUnitType.PER_NIGHT ? totalDays * quantity : quantity;
  const subtotal = listing.basePrice * chargeUnits;

  const booking = await prisma.$transaction(async (tx) => {
    const buyer = await resolveWalkInBuyer(tx, input.customer);
    const code = `WALK-${Date.now().toString(36).toUpperCase()}`;

    return tx.booking.create({
      data: {
        code,
        userId: buyer.id,
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerEmail: buyer.email,
        buyerPhone: buyer.phone ?? input.customer.phone,
        startDate,
        endDate,
        totalDays: listing.unitType === ListingUnitType.PER_NIGHT ? totalDays : 1,
        qty: quantity,
        guestCount: Math.max(1, input.guestCount),
        pricePerUnit: listing.basePrice,
        subtotal,
        totalAmount: subtotal,
        status: BookingStatus.AWAITING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        notes: JSON.stringify({
          source: WALKIN_SOURCE,
          channel: WALKIN_CHANNEL,
          customer: {
            name: input.customer.name.trim(),
            email: input.customer.email.trim().toLowerCase(),
            phone: normalizePhone(input.customer.phone),
          },
          affiliateReference: input.affiliateReference ?? null,
          cashierNote: input.note ?? null,
          createdBy: {
            actorId: input.actorId ?? null,
            actorRole: input.actorRole ?? null,
          },
        }),
      },
      select: cashierBookingSelect,
    });
  });

  return serializeCashierBooking(booking);
}

export async function markManualPayment(input: ManualPaymentInput) {
  const booking = await prisma.booking.findUnique({
    where: { code: input.code },
    select: {
      id: true,
      code: true,
      sellerId: true,
      paymentStatus: true,
      totalAmount: true,
      platformFee: true,
      discountAmount: true,
      subtotal: true,
      notes: true,
    },
  });

  if (!booking) {
    throw createHttpError(404, "Booking tidak ditemukan.");
  }

  if (booking.paymentStatus === PaymentStatus.PAID) {
    throw createHttpError(409, "Booking ini sudah lunas.");
  }

  const amount = input.amount ?? booking.totalAmount;
  if (amount !== booking.totalAmount) {
    throw createHttpError(
      400,
      `Nominal manual harus sama dengan total booking (${booking.totalAmount}).`
    );
  }

  await prisma.$transaction(async (tx) => {
    const existingManualPayment = await tx.payment.findFirst({
      where: {
        bookingId: booking.id,
        provider: PaymentProvider.MANUAL,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    const rawPayload = {
      source: WALKIN_SOURCE,
      amount,
      method: input.method,
      note: input.note ?? null,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
    } as Prisma.InputJsonValue;

    const paymentPayload: Prisma.PaymentUncheckedUpdateInput = {
      provider: PaymentProvider.MANUAL,
      amount,
      currency: "IDR",
      paymentMethod: input.method.toLowerCase(),
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      rawPayload,
    };

    const paymentCreatePayload: Prisma.PaymentUncheckedCreateInput = {
      bookingId: booking.id,
      externalId: `manual-${booking.code}`,
      invoiceUrl: null,
      provider: PaymentProvider.MANUAL,
      amount,
      currency: "IDR",
      paymentMethod: input.method.toLowerCase(),
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      rawPayload,
    };

    if (existingManualPayment) {
      await tx.payment.update({
        where: { id: existingManualPayment.id },
        data: paymentPayload,
      });
    } else {
      await tx.payment.create({
        data: paymentCreatePayload,
      });
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: new Date(),
        notes: mergeBookingNotes(booking.notes, {
          manualPayment: {
            amount,
            method: input.method,
            note: input.note ?? null,
            markedAt: new Date().toISOString(),
            actorId: input.actorId ?? null,
            actorRole: input.actorRole ?? null,
          },
        }),
      },
    });

    await ensureBookingEscrowBooked(tx, booking);
  });

  const updatedBooking = await getBookingRecordByCode(input.code);
  return serializeCashierBooking(updatedBooking);
}

export async function verifyXenditPayment(code: string): Promise<CashierVerifyXenditResult> {
  const booking = await prisma.booking.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      sellerId: true,
      totalAmount: true,
      platformFee: true,
      discountAmount: true,
      subtotal: true,
      paymentStatus: true,
      notes: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          provider: true,
          externalId: true,
        },
      },
    },
  });

  if (!booking) {
    throw createHttpError(404, "Booking tidak ditemukan.");
  }

  const latestManualPayment = booking.payments.find(
    (payment) => payment.provider === PaymentProvider.MANUAL
  );
  if (booking.paymentStatus === PaymentStatus.PAID && latestManualPayment) {
    throw createHttpError(
      409,
      "Booking ini sudah ditandai lunas manual, jadi verifikasi Xendit diblokir."
    );
  }

  const invoice = await fetchXenditInvoice(code);
  const invoiceStatus = String(invoice.status ?? "PENDING").trim().toUpperCase() || "PENDING";
  await syncXenditInvoiceToBooking(invoice);

  const refreshedBooking = await getBookingRecordByCode(code);

  return {
    booking: serializeCashierBooking(refreshedBooking),
    invoice: {
      id: invoice.id ?? null,
      externalId: invoice.external_id ?? code,
      status: invoiceStatus,
      amount: Number(invoice.amount ?? booking.totalAmount),
      invoiceUrl: invoice.invoice_url ?? null,
      paidAt: invoice.paid_at ?? null,
      expiryDate: invoice.expiry_date ?? null,
      payerEmail: invoice.payer_email ?? null,
    },
  };
}
