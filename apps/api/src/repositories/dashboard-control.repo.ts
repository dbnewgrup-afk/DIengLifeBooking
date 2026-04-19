import {
  DashboardAudience,
  PaymentStatus,
  Role,
  SellerStatus,
  WithdrawStatus,
  type Prisma,
} from "@prisma/client";
import prisma from "../lib/db.js";
import { getAffiliateReference } from "./affiliates.repo.js";

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function parseDateInput(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createHttpError(400, `Tanggal tidak valid: ${value}`);
  }
  return parsed;
}

function normalizeNoticeInput(input: {
  title?: string;
  body?: string;
  audience?: DashboardAudience;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder?: number;
}) {
  return {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.body !== undefined ? { body: input.body.trim() } : {}),
    ...(input.audience !== undefined ? { audience: input.audience } : {}),
    ...(input.ctaLabel !== undefined
      ? { ctaLabel: input.ctaLabel?.trim() || null }
      : {}),
    ...(input.ctaHref !== undefined ? { ctaHref: input.ctaHref?.trim() || null } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(input.startsAt !== undefined ? { startsAt: parseDateInput(input.startsAt) } : {}),
    ...(input.endsAt !== undefined ? { endsAt: parseDateInput(input.endsAt) } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
  };
}

function buildActiveNoticeWhere(audiences: DashboardAudience[]): Prisma.DashboardNoticeWhereInput {
  const now = new Date();
  return {
    audience: { in: audiences },
    isActive: true,
    AND: [
      {
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      },
      {
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
    ],
  };
}

function serializeNotice(
  notice: {
    id: string;
    title: string;
    body: string;
    audience: DashboardAudience;
    ctaLabel: string | null;
    ctaHref: string | null;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: { name: string } | null;
  }
) {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    audience: notice.audience,
    ctaLabel: notice.ctaLabel,
    ctaHref: notice.ctaHref,
    isActive: notice.isActive,
    startsAt: notice.startsAt?.toISOString() ?? null,
    endsAt: notice.endsAt?.toISOString() ?? null,
    sortOrder: notice.sortOrder,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    createdByName: notice.createdBy?.name ?? null,
  };
}

function resolveAudiencesForRole(role?: Role | null) {
  if (role === Role.SELLER) {
    return [DashboardAudience.SELLER, DashboardAudience.ALL_USERS];
  }
  if (role === Role.AFFILIATE) {
    return [DashboardAudience.AFFILIATE, DashboardAudience.ALL_USERS];
  }
  return [DashboardAudience.ALL_USERS];
}

export async function listDashboardNoticesAdmin(includeInactive = true) {
  const items = await prisma.dashboardNotice.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return items.map(serializeNotice);
}

export async function listDashboardNoticesForRole(role?: Role | null) {
  const items = await prisma.dashboardNotice.findMany({
    where: buildActiveNoticeWhere(resolveAudiencesForRole(role)),
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  return items.map(serializeNotice);
}

export async function createDashboardNotice(
  actor: { id?: string | null; role?: Role | null },
  input: {
    title: string;
    body: string;
    audience: DashboardAudience;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
  }
) {
  const normalized = normalizeNoticeInput(input);
  const created = await prisma.$transaction(async (tx) => {
    const notice = await tx.dashboardNotice.create({
      data: {
        title: normalized.title!,
        body: normalized.body!,
        audience: normalized.audience!,
        ctaLabel: normalized.ctaLabel ?? null,
        ctaHref: normalized.ctaHref ?? null,
        isActive: normalized.isActive ?? true,
        startsAt: normalized.startsAt ?? null,
        endsAt: normalized.endsAt ?? null,
        sortOrder: normalized.sortOrder ?? 0,
        createdById: actor.id ?? null,
      },
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.audit.create({
      data: {
        actorId: actor.id ?? null,
        actorRole: actor.role ?? null,
        action: "DASHBOARD_NOTICE_CREATE",
        targetType: "DASHBOARD_NOTICE",
        targetId: notice.id,
        meta: {
          audience: notice.audience,
          isActive: notice.isActive,
          sortOrder: notice.sortOrder,
        },
      },
    });

    return notice;
  });

  return serializeNotice(created);
}

export async function updateDashboardNotice(
  id: string,
  actor: { id?: string | null; role?: Role | null },
  input: {
    title?: string;
    body?: string;
    audience?: DashboardAudience;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    isActive?: boolean;
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
  }
) {
  const existing = await prisma.dashboardNotice.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existing) {
    throw createHttpError(404, "Control notice tidak ditemukan.");
  }

  const normalized = normalizeNoticeInput(input);
  const updated = await prisma.$transaction(async (tx) => {
    const notice = await tx.dashboardNotice.update({
      where: { id },
      data: normalized,
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    await tx.audit.create({
      data: {
        actorId: actor.id ?? null,
        actorRole: actor.role ?? null,
        action: "DASHBOARD_NOTICE_UPDATE",
        targetType: "DASHBOARD_NOTICE",
        targetId: notice.id,
        meta: {
          before: {
            audience: existing.audience,
            isActive: existing.isActive,
            startsAt: existing.startsAt?.toISOString() ?? null,
            endsAt: existing.endsAt?.toISOString() ?? null,
            sortOrder: existing.sortOrder,
          },
          after: {
            audience: notice.audience,
            isActive: notice.isActive,
            startsAt: notice.startsAt?.toISOString() ?? null,
            endsAt: notice.endsAt?.toISOString() ?? null,
            sortOrder: notice.sortOrder,
          },
        },
      },
    });

    return notice;
  });

  return serializeNotice(updated);
}

export async function deleteDashboardNotice(
  id: string,
  actor: { id?: string | null; role?: Role | null }
) {
  const existing = await prisma.dashboardNotice.findUnique({
    where: { id },
    select: {
      id: true,
      audience: true,
      title: true,
    },
  });

  if (!existing) {
    throw createHttpError(404, "Control notice tidak ditemukan.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.dashboardNotice.delete({
      where: { id },
    });

    await tx.audit.create({
      data: {
        actorId: actor.id ?? null,
        actorRole: actor.role ?? null,
        action: "DASHBOARD_NOTICE_DELETE",
        targetType: "DASHBOARD_NOTICE",
        targetId: id,
        meta: {
          title: existing.title,
          audience: existing.audience,
        },
      },
    });
  });

  return { id };
}

type MonitoringActivity = {
  id: string;
  actorType: "SELLER" | "AFFILIATE";
  actorName: string;
  activityType: string;
  title: string;
  detail: string;
  status: string;
  amount: number | null;
  createdAt: string;
};

export async function getDashboardControlSnapshot() {
  const [
    sellerCounts,
    affiliateProfiles,
    latestSellerBookings,
    latestSellerWithdraws,
    latestSellerListings,
    latestAffiliateClicks,
    latestAffiliateWithdraws,
    latestAffiliateBookings,
    activeNotices,
  ] = await Promise.all([
    prisma.sellerProfile.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.affiliateProfile.findMany({
      select: {
        id: true,
        code: true,
        displayName: true,
        isActive: true,
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        code: true,
        totalAmount: true,
        paymentStatus: true,
        createdAt: true,
        seller: {
          select: {
            displayName: true,
          },
        },
        listing: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.withdraw.findMany({
      orderBy: { requestedAt: "desc" },
      take: 12,
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
        seller: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    prisma.listing.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        seller: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    prisma.affiliateClick.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        landingPath: true,
        createdAt: true,
        affiliate: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    prisma.affiliateWithdraw.findMany({
      orderBy: { requestedAt: "desc" },
      take: 12,
      select: {
        id: true,
        amount: true,
        status: true,
        requestedAt: true,
        affiliate: {
          select: {
            displayName: true,
          },
        },
      },
    }),
    prisma.booking.findMany({
      where: {
        NOT: {
          notes: null,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
      select: {
        id: true,
        code: true,
        totalAmount: true,
        paymentStatus: true,
        updatedAt: true,
        notes: true,
        listing: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.dashboardNotice.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const affiliateMap = new Map(
    affiliateProfiles.map((profile) => [profile.code, profile.displayName] as const)
  );

  const sellerSummary = {
    total: sellerCounts.reduce((sum, item) => sum + item._count._all, 0),
    active:
      sellerCounts.find((item) => item.status === SellerStatus.ACTIVE)?._count._all ?? 0,
    pendingReview:
      sellerCounts.find((item) => item.status === SellerStatus.PENDING_REVIEW)?._count._all ?? 0,
    suspended:
      sellerCounts.find((item) => item.status === SellerStatus.SUSPENDED)?._count._all ?? 0,
    rejected:
      sellerCounts.find((item) => item.status === SellerStatus.REJECTED)?._count._all ?? 0,
  };

  const affiliateSummary = {
    total: affiliateProfiles.length,
    active: affiliateProfiles.filter((item) => item.isActive).length,
    inactive: affiliateProfiles.filter((item) => !item.isActive).length,
  };

  const sellerActivities: MonitoringActivity[] = [
    ...latestSellerBookings.map((booking) => ({
      id: `seller-booking:${booking.id}`,
      actorType: "SELLER" as const,
      actorName: booking.seller.displayName,
      activityType: "BOOKING",
      title: `${booking.code} • ${booking.listing.title}`,
      detail: "Booking seller baru masuk ke sistem.",
      status: booking.paymentStatus,
      amount: booking.totalAmount,
      createdAt: booking.createdAt.toISOString(),
    })),
    ...latestSellerWithdraws.map((withdraw) => ({
      id: `seller-withdraw:${withdraw.id}`,
      actorType: "SELLER" as const,
      actorName: withdraw.seller.displayName,
      activityType: "WITHDRAW",
      title: "Permintaan withdraw seller",
      detail: "Seller mengajukan penarikan saldo ke admin.",
      status: withdraw.status,
      amount: withdraw.amount,
      createdAt: withdraw.requestedAt.toISOString(),
    })),
    ...latestSellerListings.map((listing) => ({
      id: `seller-listing:${listing.id}`,
      actorType: "SELLER" as const,
      actorName: listing.seller.displayName,
      activityType: "LISTING",
      title: listing.title,
      detail: "Produk seller diperbarui atau berubah status.",
      status: listing.status,
      amount: null,
      createdAt: listing.updatedAt.toISOString(),
    })),
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 16);

  const affiliateBookingActivities = latestAffiliateBookings
    .map((booking) => {
      const code = getAffiliateReference(booking.notes);
      if (!code) {
        return null;
      }

      return {
        id: `affiliate-booking:${booking.id}`,
        actorType: "AFFILIATE" as const,
        actorName: affiliateMap.get(code) ?? code,
        activityType:
          booking.paymentStatus === PaymentStatus.PAID ? "CONVERSION" : "LEAD",
        title: `${booking.code} • ${booking.listing.title}`,
        detail: "Booking teratribusi ke affiliate.",
        status: booking.paymentStatus,
        amount: booking.totalAmount,
        createdAt: booking.updatedAt.toISOString(),
      };
    })
    .filter(
      (
        item
      ): item is {
        id: string;
        actorType: "AFFILIATE";
        actorName: string;
        activityType: string;
        title: string;
        detail: string;
        status: PaymentStatus;
        amount: number;
        createdAt: string;
      } => item !== null
    );

  const affiliateActivities: MonitoringActivity[] = [
    ...latestAffiliateClicks.map((click) => ({
      id: `affiliate-click:${click.id}`,
      actorType: "AFFILIATE" as const,
      actorName: click.affiliate.displayName,
      activityType: "CLICK",
      title: click.landingPath || "Klik referral baru",
      detail: "Traffic referral affiliate tercatat.",
      status: "TRACKED",
      amount: null,
      createdAt: click.createdAt.toISOString(),
    })),
    ...latestAffiliateWithdraws.map((withdraw) => ({
      id: `affiliate-withdraw:${withdraw.id}`,
      actorType: "AFFILIATE" as const,
      actorName: withdraw.affiliate.displayName,
      activityType: "WITHDRAW",
      title: "Permintaan withdraw affiliate",
      detail: "Affiliate menunggu approval admin.",
      status: withdraw.status,
      amount: withdraw.amount,
      createdAt: withdraw.requestedAt.toISOString(),
    })),
    ...affiliateBookingActivities,
  ]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 16);

  return {
    notices: {
      active: activeNotices,
    },
    sellers: sellerSummary,
    affiliates: affiliateSummary,
    sellerActivities,
    affiliateActivities,
  };
}
