import {
  BookingStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  WithdrawStatus,
} from "@prisma/client";
import prisma from "../lib/db.js";
import { parseBookingNotes } from "../utils/booking-notes.js";

const DEFAULT_COMMISSION_BPS = 500;
const AFFILIATE_WITHDRAW_MINIMUM_AMOUNT = 1_000_000;
const AFFILIATE_ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AFFILIATE_ATTRIBUTION_CLOCK_SKEW_MS = 5 * 60 * 1000;
const DEFAULT_LINK_PATHS = [
  { id: "home", label: "Homepage", path: "/" },
  { id: "villa", label: "Catalog Villa", path: "/villa" },
  { id: "catalog", label: "Catalog Semua Produk", path: "/catalog" },
  { id: "booking", label: "Booking Stepper", path: "/booking" },
] as const;

type AffiliateAttributedBooking = {
  id: string;
  code: string;
  totalAmount: number;
  discountAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  notes: string | null;
  buyerEmail: string | null;
  listing: {
    id: string;
    title: string;
    type: string;
  };
  user: {
    name: string;
    email: string;
  };
};

type DbClient = Prisma.TransactionClient | typeof prisma;

type AffiliateAttributionProof = {
  code?: string | null;
  capturedAt?: string | null;
  expiresAt?: string | null;
  visitorKey?: string | null;
  sessionKey?: string | null;
};

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function normalizeAffiliateCode(value?: string | null) {
  const normalized = value?.trim().toUpperCase() ?? "";
  return normalized || null;
}

function getCommissionAmount(amount: number, commissionRateBps = DEFAULT_COMMISSION_BPS) {
  return Math.max(0, Math.round((amount * commissionRateBps) / 10_000));
}

function parseIsoDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPaidLike(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.PAID ||
    status === BookingStatus.PAID ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  );
}

function isTerminalAffiliateBooking(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.FAILED ||
    paymentStatus === PaymentStatus.EXPIRED ||
    paymentStatus === PaymentStatus.REFUNDED ||
    status === BookingStatus.CANCELLED ||
    status === BookingStatus.EXPIRED ||
    status === BookingStatus.REFUNDED
  );
}

function mapAffiliateWithdrawStatus(status: WithdrawStatus) {
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

function nextCutoff() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 3, 17, 0, 0));
}

function resolvePublicAppUrl() {
  const candidates = [
    process.env.PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ];

  for (const value of candidates) {
    const normalized = value?.trim().replace(/\/+$/, "");
    if (normalized) {
      return normalized;
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw createHttpError(
      500,
      "PUBLIC_APP_URL belum dikonfigurasi untuk environment production."
    );
  }

  return "http://localhost:3000";
}

export function getAffiliateReference(notes?: string | null) {
  const snapshot = parseBookingNotes(notes);
  const raw =
    typeof snapshot.affiliateReference === "string"
      ? snapshot.affiliateReference
      : typeof snapshot.affiliateCode === "string"
        ? snapshot.affiliateCode
        : null;

  return normalizeAffiliateCode(raw);
}

async function getAffiliateContext(userId: string, client: DbClient = prisma) {
  const affiliate = await client.affiliateProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      code: true,
      displayName: true,
      legalName: true,
      bio: true,
      bankName: true,
      bankCode: true,
      accountNumber: true,
      accountName: true,
      commissionRateBps: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!affiliate) {
    throw createHttpError(404, "Affiliate profile not found");
  }

  return affiliate;
}

async function listAffiliateAttributedBookings(code: string, client: DbClient = prisma) {
  const rows = await client.booking.findMany({
    where: {
      NOT: {
        notes: null,
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      totalAmount: true,
      discountAmount: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      updatedAt: true,
      notes: true,
      buyerEmail: true,
      listing: {
        select: {
          id: true,
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

  return rows.filter((row) => getAffiliateReference(row.notes) === code) satisfies AffiliateAttributedBooking[];
}

function summarizeAffiliateBookings(
  bookings: AffiliateAttributedBooking[],
  commissionRateBps: number
) {
  let leads = 0;
  let conversions = 0;
  let commissionPending = 0;
  let commissionPayable = 0;
  let attributedRevenue = 0;
  let totalDiscount = 0;

  for (const booking of bookings) {
    const commission = getCommissionAmount(booking.totalAmount, commissionRateBps);
    leads += 1;
    totalDiscount += booking.discountAmount;

    if (isPaidLike(booking.status, booking.paymentStatus)) {
      conversions += 1;
      commissionPayable += commission;
      attributedRevenue += booking.totalAmount;
      continue;
    }

    if (!isTerminalAffiliateBooking(booking.status, booking.paymentStatus)) {
      commissionPending += commission;
    }
  }

  return {
    leads,
    conversions,
    commissionPending,
    commissionPayable,
    attributedRevenue,
    totalDiscount,
  };
}

async function getAffiliateWithdrawTotals(affiliateId: string, client: DbClient = prisma) {
  const rows = await client.affiliateWithdraw.findMany({
    where: { affiliateId },
    select: {
      amount: true,
      status: true,
    },
  });

  let reserved = 0;
  let paidOut = 0;

  for (const row of rows) {
    if (row.status === WithdrawStatus.PAID) {
      paidOut += row.amount;
      continue;
    }

    if (
      row.status === WithdrawStatus.PENDING ||
      row.status === WithdrawStatus.APPROVED ||
      row.status === WithdrawStatus.PROCESSING
    ) {
      reserved += row.amount;
    }
  }

  return { reserved, paidOut };
}

function summarizeAffiliateBalanceFromData(input: {
  bookings: AffiliateAttributedBooking[];
  withdrawTotals: { reserved: number; paidOut: number };
  commissionRateBps: number;
}) {
  const bookingSummary = summarizeAffiliateBookings(input.bookings, input.commissionRateBps);
  const grossEarned = bookingSummary.commissionPayable;

  return {
    bookingSummary,
    balance: grossEarned,
    available: Math.max(
      0,
      grossEarned - input.withdrawTotals.reserved - input.withdrawTotals.paidOut
    ),
    pending: bookingSummary.commissionPending + input.withdrawTotals.reserved,
    paidOut: input.withdrawTotals.paidOut,
  };
}

export async function verifyAffiliateAttribution(
  input: {
    affiliateReference?: string | null;
    attribution?: AffiliateAttributionProof | null;
  },
  client: DbClient = prisma
) {
  const normalizedCode = normalizeAffiliateCode(
    input.attribution?.code ?? input.affiliateReference
  );
  if (!normalizedCode || !input.attribution) {
    return null;
  }

  const capturedAt = parseIsoDate(input.attribution.capturedAt);
  if (!capturedAt) {
    return null;
  }

  const visitorKey = input.attribution.visitorKey?.trim() || null;
  const sessionKey = input.attribution.sessionKey?.trim() || null;
  if (!visitorKey && !sessionKey) {
    return null;
  }

  const now = Date.now();
  const capturedAtMs = capturedAt.getTime();
  if (capturedAtMs > now + AFFILIATE_ATTRIBUTION_CLOCK_SKEW_MS) {
    return null;
  }

  const maxAllowedExpiresAt = capturedAtMs + AFFILIATE_ATTRIBUTION_TTL_MS;
  const rawExpiresAt = parseIsoDate(input.attribution.expiresAt)?.getTime() ?? maxAllowedExpiresAt;
  const effectiveExpiresAt = Math.min(rawExpiresAt, maxAllowedExpiresAt);
  if (effectiveExpiresAt <= now) {
    return null;
  }

  const click = await client.affiliateClick.findFirst({
    where: {
      code: normalizedCode,
      createdAt: {
        gte: new Date(Math.max(0, capturedAtMs - AFFILIATE_ATTRIBUTION_CLOCK_SKEW_MS)),
        lte: new Date(effectiveExpiresAt),
      },
      affiliate: {
        is: {
          code: normalizedCode,
          isActive: true,
        },
      },
      OR: [
        ...(visitorKey ? [{ visitorKey }] : []),
        ...(sessionKey ? [{ sessionKey }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      code: true,
    },
  });

  return click?.code ?? null;
}

export async function trackAffiliateClick(input: {
  code: string;
  landingPath?: string | null;
  referrer?: string | null;
  visitorKey?: string | null;
  sessionKey?: string | null;
  userAgent?: string | null;
}) {
  const code = normalizeAffiliateCode(input.code);
  if (!code) {
    throw createHttpError(400, "Affiliate code is required");
  }

  const affiliate = await prisma.affiliateProfile.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      isActive: true,
    },
  });

  if (!affiliate || !affiliate.isActive) {
    throw createHttpError(404, "Affiliate code not found");
  }

  const click = await prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      code: affiliate.code,
      landingPath: input.landingPath?.trim() || null,
      referrer: input.referrer?.trim() || null,
      visitorKey: input.visitorKey?.trim() || null,
      sessionKey: input.sessionKey?.trim() || null,
      userAgent: input.userAgent?.trim() || null,
    },
    select: {
      id: true,
      code: true,
      createdAt: true,
    },
  });

  return {
    ok: true,
    click: {
      id: click.id,
      code: click.code,
      createdAt: click.createdAt.toISOString(),
    },
  };
}

export async function getAffiliatePerformance(userId: string) {
  const affiliate = await getAffiliateContext(userId);
  const [clickRows, bookings, withdrawTotals] = await Promise.all([
    prisma.affiliateClick.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
      },
    }),
    listAffiliateAttributedBookings(affiliate.code),
    getAffiliateWithdrawTotals(affiliate.id),
  ]);

  const bookingSummary = summarizeAffiliateBookings(bookings, affiliate.commissionRateBps);
  const seriesMap = new Map<
    string,
    { date: string; clicks: number; leads: number; conversions: number; commission: number }
  >();

  for (const click of clickRows) {
    const date = click.createdAt.toISOString().slice(0, 10);
    const current = seriesMap.get(date) ?? {
      date,
      clicks: 0,
      leads: 0,
      conversions: 0,
      commission: 0,
    };
    current.clicks += 1;
    seriesMap.set(date, current);
  }

  for (const booking of bookings) {
    const date = booking.createdAt.toISOString().slice(0, 10);
    const current = seriesMap.get(date) ?? {
      date,
      clicks: 0,
      leads: 0,
      conversions: 0,
      commission: 0,
    };
    current.leads += 1;
    if (isPaidLike(booking.status, booking.paymentStatus)) {
      current.conversions += 1;
      current.commission += getCommissionAmount(booking.totalAmount, affiliate.commissionRateBps);
    }
    seriesMap.set(date, current);
  }

  const timeseries = Array.from(seriesMap.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-14);

  return {
    userId,
    profile: {
      id: affiliate.id,
      code: affiliate.code,
      name: affiliate.displayName,
      legalName: affiliate.legalName,
      bio: affiliate.bio,
      email: affiliate.user.email,
      phone: affiliate.user.phone,
      isActive: affiliate.isActive,
      commissionRatePercent: affiliate.commissionRateBps / 100,
      joinedAt: affiliate.createdAt.toISOString(),
    },
    summary: {
      clicks: clickRows.length,
      leads: bookingSummary.leads,
      conversions: bookingSummary.conversions,
      commissionPending: bookingSummary.commissionPending,
      commissionPayable: Math.max(
        0,
        bookingSummary.commissionPayable - withdrawTotals.reserved - withdrawTotals.paidOut
      ),
      attributedRevenue: bookingSummary.attributedRevenue,
      totalDiscount: bookingSummary.totalDiscount,
      reservedWithdrawAmount: withdrawTotals.reserved,
      paidOutAmount: withdrawTotals.paidOut,
    },
    timeseries,
  };
}

export async function getAffiliateLinks(userId: string) {
  const affiliate = await getAffiliateContext(userId);
  const baseUrl = resolvePublicAppUrl();
  const items = DEFAULT_LINK_PATHS.map((entry) => {
    const url = new URL(entry.path, `${baseUrl}/`);
    url.searchParams.set("aff", affiliate.code);
    return {
      id: entry.id,
      label: entry.label,
      description: `Link referral ${entry.label.toLowerCase()} untuk kode ${affiliate.code}.`,
      url: url.toString(),
      code: affiliate.code,
    };
  });

  return {
    userId,
    code: affiliate.code,
    items,
  };
}

export async function getAffiliateActivity(userId: string, limit = 30) {
  const affiliate = await getAffiliateContext(userId);
  const [clicks, bookings] = await Promise.all([
    prisma.affiliateClick.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        landingPath: true,
        referrer: true,
      },
    }),
    listAffiliateAttributedBookings(affiliate.code),
  ]);

  const activities = [
    ...clicks.map((click) => ({
      id: `click:${click.id}`,
      kind: "CLICK" as const,
      createdAt: click.createdAt.toISOString(),
      title: click.landingPath ? `Klik ke ${click.landingPath}` : "Klik referral baru",
      detail: click.referrer || "Referrer tidak tersedia",
      amount: 0,
      status: "TRACKED",
    })),
    ...bookings.map((booking) => ({
      id: `booking:${booking.id}`,
      kind: isPaidLike(booking.status, booking.paymentStatus) ? ("CONVERSION" as const) : ("LEAD" as const),
      createdAt: booking.updatedAt.toISOString(),
      title: `${booking.code} - ${booking.listing.title}`,
      detail: `${booking.user.name} - ${booking.paymentStatus}`,
      amount: getCommissionAmount(booking.totalAmount, affiliate.commissionRateBps),
      status: booking.paymentStatus,
    })),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);

  return {
    items: activities,
    userId,
  };
}

export async function getAffiliateBalance(userId: string) {
  const affiliate = await getAffiliateContext(userId);
  const [bookings, withdrawTotals] = await Promise.all([
    listAffiliateAttributedBookings(affiliate.code),
    getAffiliateWithdrawTotals(affiliate.id),
  ]);

  const balanceSummary = summarizeAffiliateBalanceFromData({
    bookings,
    withdrawTotals,
    commissionRateBps: affiliate.commissionRateBps,
  });

  return {
    balance: balanceSummary.balance,
    available: balanceSummary.available,
    pending: balanceSummary.pending,
    paidOut: balanceSummary.paidOut,
    nextCutoff: nextCutoff().toISOString(),
  };
}

export async function listAffiliateWithdrawRequests(userId: string, limit: number) {
  const affiliate = await getAffiliateContext(userId);
  const rows = await prisma.affiliateWithdraw.findMany({
    where: { affiliateId: affiliate.id },
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
    status: mapAffiliateWithdrawStatus(row.status),
  }));
}

export async function createAffiliateWithdrawRequest(
  userId: string,
  payload: { amount: number; target: { bank: string; accNo: string; accName: string } }
) {
  if (payload.amount < AFFILIATE_WITHDRAW_MINIMUM_AMOUNT) {
    throw createHttpError(
      400,
      "Minimal withdraw affiliate adalah Rp1.000.000 dan tetap menunggu approval admin."
    );
  }

  const created = await prisma.$transaction(
    async (tx) => {
      const affiliate = await getAffiliateContext(userId, tx);
      const [bookings, withdrawTotals] = await Promise.all([
        listAffiliateAttributedBookings(affiliate.code, tx),
        getAffiliateWithdrawTotals(affiliate.id, tx),
      ]);

      const balance = summarizeAffiliateBalanceFromData({
        bookings,
        withdrawTotals,
        commissionRateBps: affiliate.commissionRateBps,
      });

      if (payload.amount > balance.available) {
        throw createHttpError(400, "Insufficient available affiliate balance");
      }

      return tx.affiliateWithdraw.create({
        data: {
          affiliateId: affiliate.id,
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
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  return {
    id: created.id,
    createdAt: created.requestedAt.toISOString(),
    amount: created.amount,
    target: {
      bank: created.bankName ?? created.bankCode,
      accNo: created.accountNumber,
      accName: created.accountName,
    },
    status: mapAffiliateWithdrawStatus(created.status),
  };
}

export async function listAdminAffiliateSummary() {
  const [profiles, bookings] = await Promise.all([
    prisma.affiliateProfile.findMany({
      orderBy: [{ updatedAt: "desc" }, { displayName: "asc" }],
      select: {
        id: true,
        code: true,
        displayName: true,
        isActive: true,
        commissionRateBps: true,
        updatedAt: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        NOT: {
          notes: null,
        },
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        totalAmount: true,
        discountAmount: true,
        status: true,
        paymentStatus: true,
        notes: true,
        updatedAt: true,
      },
    }),
  ]);

  const grouped = new Map<
    string,
    {
      bookings: number;
      paidOrders: number;
      attributedRevenue: number;
      totalDiscount: number;
      updatedAt: string;
    }
  >();

  for (const booking of bookings) {
    const code = getAffiliateReference(booking.notes);
    if (!code) continue;

    const current = grouped.get(code) ?? {
      bookings: 0,
      paidOrders: 0,
      attributedRevenue: 0,
      totalDiscount: 0,
      updatedAt: booking.updatedAt.toISOString(),
    };

    current.bookings += 1;
    current.totalDiscount += booking.discountAmount;
    if (isPaidLike(booking.status, booking.paymentStatus)) {
      current.paidOrders += 1;
      current.attributedRevenue += booking.totalAmount;
    }
    if (booking.updatedAt.toISOString() > current.updatedAt) {
      current.updatedAt = booking.updatedAt.toISOString();
    }

    grouped.set(code, current);
  }

  const rows = profiles.map((profile) => {
    const stats = grouped.get(profile.code);
    return {
      id: profile.id,
      name: profile.displayName,
      code: profile.code,
      category: "AFFILIATE",
      bookings: stats?.bookings ?? 0,
      paidOrders: stats?.paidOrders ?? 0,
      attributedRevenue: stats?.attributedRevenue ?? 0,
      totalDiscount: stats?.totalDiscount ?? 0,
      isActive: profile.isActive,
      updatedAt: stats?.updatedAt ?? profile.updatedAt.toISOString(),
    };
  });

  const knownCodes = new Set(profiles.map((profile) => profile.code));
  for (const [code, stats] of grouped.entries()) {
    if (knownCodes.has(code)) continue;
    rows.push({
      id: code,
      name: code,
      code,
      category: "AFFILIATE",
      bookings: stats.bookings,
      paidOrders: stats.paidOrders,
      attributedRevenue: stats.attributedRevenue,
      totalDiscount: stats.totalDiscount,
      isActive: false,
      updatedAt: stats.updatedAt,
    });
  }

  return rows.sort(
    (left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.code.localeCompare(right.code)
  );
}
