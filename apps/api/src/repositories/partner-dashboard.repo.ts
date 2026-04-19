import {
  BookingStatus,
  ListingStatus,
  ListingType,
  PaymentProvider,
  PaymentStatus,
  WalletTransactionStatus,
  WalletTransactionType,
  WithdrawStatus,
} from "@prisma/client";
import prisma from "../lib/db.js";
import {
  getBookingCustomerSnapshot,
  getBookingNoteText,
  parseBookingNotes,
} from "../utils/booking-notes.js";

type SellerContext = {
  userId: string;
  sellerId: string;
  walletId: string;
  balanceAvailable: number;
  balancePending: number;
};

function makeHttpError(status: number, message: string) {
  const err = new Error(message) as Error & { status?: number };
  err.status = status;
  return err;
}

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function endOfToday() {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

function nextCutoff() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 3, 17, 0, 0));
}

function asDateRange(from?: string, to?: string) {
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

function humanizeAgo(input: Date) {
  const diffMs = Date.now() - input.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMinutes < 1) return "baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function toDayKey(input: Date) {
  return input.toISOString().slice(0, 10);
}

function isPaidLike(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.PAID ||
    status === BookingStatus.PAID ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  );
}

function mapPayoutStatus(status: WithdrawStatus) {
  switch (status) {
    case WithdrawStatus.PAID:
      return "PAID";
    case WithdrawStatus.REJECTED:
    case WithdrawStatus.FAILED:
    case WithdrawStatus.CANCELLED:
      return "FAILED";
    default:
      return "PENDING";
  }
}

function mapRequestStatus(status: WithdrawStatus) {
  switch (status) {
    case WithdrawStatus.APPROVED:
    case WithdrawStatus.PROCESSING:
    case WithdrawStatus.PAID:
      return "APPROVED";
    case WithdrawStatus.REJECTED:
    case WithdrawStatus.FAILED:
    case WithdrawStatus.CANCELLED:
      return "REJECTED";
    default:
      return "PENDING";
  }
}

async function getReservedWithdrawAmount(sellerId: string) {
  const result = await prisma.withdraw.aggregate({
    where: {
      sellerId,
      status: {
        in: [WithdrawStatus.PENDING, WithdrawStatus.APPROVED, WithdrawStatus.PROCESSING],
      },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? 0;
}

async function getSellerContext(userId: string): Promise<SellerContext> {
  const seller = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: {
      userId: true,
      id: true,
      wallet: {
        select: {
          id: true,
          balanceAvailable: true,
          balancePending: true,
        },
      },
    },
  });

  if (!seller) {
    throw makeHttpError(404, "Seller profile not found");
  }

  let wallet = seller.wallet;
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        sellerId: seller.id,
      },
      select: {
        id: true,
        balanceAvailable: true,
        balancePending: true,
      },
    });
  }

  return {
    userId: seller.userId,
    sellerId: seller.id,
    walletId: wallet.id,
    balanceAvailable: wallet.balanceAvailable,
    balancePending: wallet.balancePending,
  };
}

export async function getPartnerBalance(userId: string) {
  const context = await getSellerContext(userId);
  const reservedWithdrawAmount = await getReservedWithdrawAmount(context.sellerId);

  return {
    balance: context.balanceAvailable + context.balancePending,
    available: Math.max(0, context.balanceAvailable - reservedWithdrawAmount),
    pending: context.balancePending + reservedWithdrawAmount,
    nextCutoff: nextCutoff().toISOString(),
  };
}

export async function listPartnerPayouts(userId: string, limit: number) {
  const context = await getSellerContext(userId);
  const rows = await prisma.withdraw.findMany({
    where: { sellerId: context.sellerId },
    orderBy: { requestedAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestedAt: true,
      amount: true,
      status: true,
      failureReason: true,
      externalDisbursementId: true,
    },
  });

  return rows.map((row) => ({
    id: row.externalDisbursementId ?? row.id,
    createdAt: row.requestedAt.toISOString(),
    amount: row.amount,
    status: mapPayoutStatus(row.status),
    note: row.failureReason ?? undefined,
  }));
}

export async function listPartnerWithdrawRequests(userId: string, limit: number) {
  const context = await getSellerContext(userId);
  const rows = await prisma.withdraw.findMany({
    where: { sellerId: context.sellerId },
    orderBy: { requestedAt: "desc" },
    take: limit,
    select: {
      id: true,
      requestedAt: true,
      amount: true,
      status: true,
      bankName: true,
      bankCode: true,
      accountNumber: true,
      accountName: true,
      externalDisbursementId: true,
    },
  });

  return rows.map((row) => ({
    id: row.externalDisbursementId ?? row.id,
    createdAt: row.requestedAt.toISOString(),
    amount: row.amount,
    target: {
      bank: row.bankName ?? row.bankCode,
      accNo: row.accountNumber,
      accName: row.accountName,
    },
    status: mapRequestStatus(row.status),
  }));
}

export async function createPartnerWithdrawRequest(
  userId: string,
  payload: { amount: number; target: { bank: string; accNo: string; accName: string } }
) {
  const context = await getSellerContext(userId);
  const reservedWithdrawAmount = await getReservedWithdrawAmount(context.sellerId);
  const availableToWithdraw = Math.max(0, context.balanceAvailable - reservedWithdrawAmount);

  if (payload.amount > availableToWithdraw) {
    throw makeHttpError(400, "Insufficient available balance");
  }

  const withdraw = await prisma.$transaction(async (tx) => {
    const created = await tx.withdraw.create({
      data: {
        sellerId: context.sellerId,
        walletId: context.walletId,
        amount: payload.amount,
        bankName: payload.target.bank,
        bankCode: payload.target.bank.toUpperCase().replace(/\s+/g, "_"),
        accountNumber: payload.target.accNo,
        accountName: payload.target.accName,
        provider: PaymentProvider.XENDIT,
        status: WithdrawStatus.PENDING,
      },
      select: {
        id: true,
        requestedAt: true,
        amount: true,
        status: true,
        bankName: true,
        bankCode: true,
        accountNumber: true,
        accountName: true,
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: context.walletId,
        sellerId: context.sellerId,
        withdrawId: created.id,
        type: WalletTransactionType.WITHDRAW_REQUEST,
        amount: payload.amount,
        status: WalletTransactionStatus.PENDING,
        referenceCode: created.id,
        description: `Withdraw request to ${payload.target.bank}`,
      },
    });

    return created;
  });

  return {
    id: withdraw.id,
    createdAt: withdraw.requestedAt.toISOString(),
    amount: withdraw.amount,
    target: {
      bank: withdraw.bankName ?? withdraw.bankCode,
      accNo: withdraw.accountNumber,
      accName: withdraw.accountName,
    },
    status: mapRequestStatus(withdraw.status),
  };
}

function mapWalletLedgerDirection(type: WalletTransactionType) {
  switch (type) {
    case WalletTransactionType.BOOKING_IN:
    case WalletTransactionType.ESCROW_RELEASE:
      return "IN" as const;
    case WalletTransactionType.WITHDRAW_REQUEST:
      return "HOLD" as const;
    default:
      return "OUT" as const;
  }
}

export async function listPartnerWalletTransactions(userId: string, limit: number) {
  const context = await getSellerContext(userId);
  const rows = await prisma.walletTransaction.findMany({
    where: {
      sellerId: context.sellerId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      description: true,
      referenceCode: true,
      createdAt: true,
      booking: {
        select: {
          code: true,
        },
      },
      withdraw: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    type: row.type,
    status: row.status,
    amount: row.amount,
    direction: mapWalletLedgerDirection(row.type),
    description: row.description ?? null,
    referenceCode: row.referenceCode ?? row.booking?.code ?? row.withdraw?.id ?? null,
  }));
}

export async function getPartnerSummary(userId: string, range?: { from?: string; to?: string }) {
  const context = await getSellerContext(userId);
  const todayRange = {
    gte: startOfToday(),
    lte: endOfToday(),
  };
  const createdRange = asDateRange(range?.from, range?.to);

  const [
    bookingsToday,
    checkinsToday,
    checkoutsToday,
    pendingPayments,
    activeTransportSlots,
    activeDocsJobs,
    latestBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: {
        sellerId: context.sellerId,
        createdAt: todayRange,
      },
    }),
    prisma.booking.count({
      where: {
        sellerId: context.sellerId,
        startDate: todayRange,
        status: {
          in: [BookingStatus.PAID, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
    }),
    prisma.booking.count({
      where: {
        sellerId: context.sellerId,
        endDate: todayRange,
        status: {
          in: [BookingStatus.PAID, BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
    }),
    prisma.booking.count({
      where: {
        sellerId: context.sellerId,
        paymentStatus: PaymentStatus.PENDING,
        ...(createdRange ? { createdAt: createdRange } : {}),
      },
    }),
    prisma.listing.count({
      where: {
        sellerId: context.sellerId,
        status: ListingStatus.APPROVED,
        type: {
          in: [ListingType.JEEP, ListingType.TRANSPORT],
        },
      },
    }),
    prisma.listing.count({
      where: {
        sellerId: context.sellerId,
        status: ListingStatus.APPROVED,
        type: ListingType.PHOTOGRAPHER,
      },
    }),
    prisma.booking.findMany({
      where: {
        sellerId: context.sellerId,
        ...(createdRange ? { createdAt: createdRange } : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        status: true,
        updatedAt: true,
        listing: {
          select: {
            title: true,
          },
        },
      },
    }),
  ]);

  return {
    bookingsToday,
    checkinsToday,
    checkoutsToday,
    pendingPayments,
    activeTransportSlots,
    activeDocsJobs,
    latestActivities: latestBookings.map((booking) => ({
      id: booking.id,
      text: `${booking.code} • ${booking.listing.title} — ${String(booking.status)}`,
      ago: humanizeAgo(booking.updatedAt),
    })),
  };
}

export async function listPartnerBookings(userId: string, range?: { from?: string; to?: string }, limit = 200) {
  const context = await getSellerContext(userId);
  const serviceRange = asDateRange(range?.from, range?.to);

  const rows = await prisma.booking.findMany({
    where: {
      sellerId: context.sellerId,
      ...(serviceRange ? { startDate: serviceRange } : {}),
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      code: true,
      startDate: true,
      qty: true,
      totalAmount: true,
      guestCount: true,
      notes: true,
      status: true,
      paymentStatus: true,
      listing: {
        select: {
          id: true,
          title: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const noteData = parseBookingNotes(row.notes);

    return {
      id: row.id,
      code: row.code,
      ownerId: row.listing.id,
      ownerName: row.listing.title,
      dateISO: row.startDate.toISOString(),
      guest: getBookingCustomerSnapshot(noteData)?.name ?? row.user.name,
      quantity: row.qty,
      guestCount: row.guestCount,
      notes: getBookingNoteText(noteData),
      revenue: row.totalAmount,
      status: row.status,
      paymentStatus: row.paymentStatus,
    };
  });
}

export async function listPartnerBookingsForExport(userId: string, range?: { from?: string; to?: string }) {
  const context = await getSellerContext(userId);
  const serviceRange = asDateRange(range?.from, range?.to);

  const rows = await prisma.booking.findMany({
    where: {
      sellerId: context.sellerId,
      ...(serviceRange ? { startDate: serviceRange } : {}),
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    select: {
      code: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      totalDays: true,
      qty: true,
      guestCount: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      paidAt: true,
      listing: {
        select: {
          title: true,
          type: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    bookingCode: row.code,
    listingTitle: row.listing.title,
    listingType: row.listing.type,
    guestName: row.user.name,
    guestEmail: row.user.email,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    totalDays: row.totalDays,
    quantity: row.qty,
    guestCount: row.guestCount,
    totalAmount: row.totalAmount,
    bookingStatus: row.status,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? "",
  }));
}

export async function getPartnerPerformanceExport(userId: string, range?: { from?: string; to?: string }) {
  const context = await getSellerContext(userId);
  const serviceRange = asDateRange(range?.from, range?.to);

  const rows = await prisma.booking.findMany({
    where: {
      sellerId: context.sellerId,
      ...(serviceRange ? { startDate: serviceRange } : {}),
    },
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    select: {
      startDate: true,
      totalAmount: true,
      status: true,
      paymentStatus: true,
      listingId: true,
    },
  });

  const grouped = new Map<
    string,
    {
      period: string;
      orders: number;
      paidOrders: number;
      pendingPayments: number;
      grossRevenue: number;
      paidRevenue: number;
      uniqueListings: Set<string>;
    }
  >();

  for (const row of rows) {
    const period = toDayKey(row.startDate);
    const current = grouped.get(period) ?? {
      period,
      orders: 0,
      paidOrders: 0,
      pendingPayments: 0,
      grossRevenue: 0,
      paidRevenue: 0,
      uniqueListings: new Set<string>(),
    };

    current.orders += 1;
    current.grossRevenue += row.totalAmount;
    current.uniqueListings.add(row.listingId);

    if (isPaidLike(row.status, row.paymentStatus)) {
      current.paidOrders += 1;
      current.paidRevenue += row.totalAmount;
    }

    if (row.paymentStatus === PaymentStatus.PENDING) {
      current.pendingPayments += 1;
    }

    grouped.set(period, current);
  }

  return Array.from(grouped.values()).map((row) => ({
    period: row.period,
    orders: row.orders,
    paidOrders: row.paidOrders,
    pendingPayments: row.pendingPayments,
    grossRevenue: row.grossRevenue,
    paidRevenue: row.paidRevenue,
    uniqueListings: row.uniqueListings.size,
  }));
}

export async function getPartnerProducts(userId: string) {
  const context = await getSellerContext(userId);
  const rows = await prisma.listing.findMany({
    where: {
      sellerId: context.sellerId,
      status: { not: ListingStatus.ARCHIVED },
    },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      type: true,
      basePrice: true,
      status: true,
      _count: { select: { bookings: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.title,
    category: row.type,
    price: row.basePrice,
    status: row.status,
    soldCount: row._count.bookings,
  }));
}
