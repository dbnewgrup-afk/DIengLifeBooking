import { PasswordResetAccessRequestStatus, Prisma, Role, UserStatus } from "@prisma/client";
import db from "../lib/db.js";
import logger from "../lib/logger.js";
import { httpError } from "../lib/errors.js";

type ManagedAccountRecord = Prisma.UserGetPayload<{
  select: typeof managedAccountSelect;
}>;

type PasswordResetRequestRecord = Prisma.PasswordResetAccessRequestGetPayload<{
  select: typeof passwordResetRequestSelect;
}>;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const managedAccountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  status: true,
  adminCanManageAccounts: true,
  adminCanReviewPasswordResets: true,
  passwordResetEnabled: true,
  passwordResetEnabledAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  sellerProfile: {
    select: {
      displayName: true,
      status: true,
    },
  },
  affiliateProfile: {
    select: {
      displayName: true,
      code: true,
      isActive: true,
    },
  },
  passwordResetRequests: {
    orderBy: {
      requestedAt: "desc" as const,
    },
    take: 1,
    select: {
      id: true,
      status: true,
      note: true,
      requestedAt: true,
      reviewedAt: true,
    },
  },
} satisfies Prisma.UserSelect;

const passwordResetRequestSelect = {
  id: true,
  status: true,
  note: true,
  requestedAt: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      passwordResetEnabled: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.PasswordResetAccessRequestSelect;

function serializeManagedAccount(record: ManagedAccountRecord) {
  const latestRequest = record.passwordResetRequests[0] ?? null;
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    phone: record.phone,
    status: record.status,
    adminPermissions: {
      canManageAccounts: record.role === "SUPER_ADMIN" ? true : record.adminCanManageAccounts,
      canReviewPasswordResets:
        record.role === "SUPER_ADMIN" ? true : record.adminCanReviewPasswordResets,
    },
    passwordResetEnabled: record.passwordResetEnabled,
    passwordResetEnabledAt: record.passwordResetEnabledAt?.toISOString() ?? null,
    archivedAt: record.archivedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    sellerProfile: record.sellerProfile
      ? {
          displayName: record.sellerProfile.displayName,
          status: record.sellerProfile.status,
        }
      : null,
    affiliateProfile: record.affiliateProfile
      ? {
          displayName: record.affiliateProfile.displayName,
          code: record.affiliateProfile.code,
          isActive: record.affiliateProfile.isActive,
        }
      : null,
    latestPasswordResetRequest: latestRequest
      ? {
          id: latestRequest.id,
          status: latestRequest.status,
          note: latestRequest.note,
          requestedAt: latestRequest.requestedAt.toISOString(),
          reviewedAt: latestRequest.reviewedAt?.toISOString() ?? null,
        }
      : null,
  };
}

function serializePasswordResetRequest(record: PasswordResetRequestRecord) {
  return {
    id: record.id,
    status: record.status,
    note: record.note,
    requestedAt: record.requestedAt.toISOString(),
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    user: {
      id: record.user.id,
      name: record.user.name,
      email: record.user.email,
      role: record.user.role,
      status: record.user.status,
      passwordResetEnabled: record.user.passwordResetEnabled,
    },
    reviewedBy: record.reviewedBy
      ? {
          id: record.reviewedBy.id,
          name: record.reviewedBy.name,
          email: record.reviewedBy.email,
          role: record.reviewedBy.role,
        }
      : null,
  };
}

export async function listManagedAccounts(filters: {
  search?: string;
  role?: Role;
  status?: UserStatus;
}) {
  const where: Prisma.UserWhereInput = {};

  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;

  if (filters.search) {
    const search = filters.search.trim();
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { sellerProfile: { is: { displayName: { contains: search } } } },
        { affiliateProfile: { is: { displayName: { contains: search } } } },
        { affiliateProfile: { is: { code: { contains: search } } } },
      ];
    }
  }

  const rows = await db.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: managedAccountSelect,
  });

  return rows.map(serializeManagedAccount);
}

export async function findManagedAccountById(id: string) {
  const row = await db.user.findUnique({
    where: { id },
    select: managedAccountSelect,
  });

  return row ? serializeManagedAccount(row) : null;
}

export async function findManagedAccountIdentityById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      adminCanManageAccounts: true,
      adminCanReviewPasswordResets: true,
      passwordResetEnabled: true,
      archivedAt: true,
    },
  });
}

export async function getAccountManagementActorCapabilities(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
      archivedAt: true,
      adminCanManageAccounts: true,
      adminCanReviewPasswordResets: true,
    },
  });

  if (!user) {
    throw httpError(404, "Akun admin tidak ditemukan.", { userId });
  }

  return {
    userId: user.id,
    role: user.role,
    status: user.status,
    archivedAt: user.archivedAt?.toISOString() ?? null,
    canManageAccounts: user.role === "SUPER_ADMIN" ? true : user.adminCanManageAccounts,
    canReviewPasswordResets:
      user.role === "SUPER_ADMIN" ? true : user.adminCanReviewPasswordResets,
  };
}

export async function createManagedAccount(input: {
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  passwordHash: string;
  status?: UserStatus;
  adminCanManageAccounts?: boolean;
  adminCanReviewPasswordResets?: boolean;
}) {
  const email = normalizeEmail(input.email);

  try {
    const created = await db.user.create({
      data: {
        name: input.name.trim(),
        email,
        phone: input.phone?.trim() || null,
        role: input.role,
        status: input.status ?? "ACTIVE",
        password: input.passwordHash,
        adminCanManageAccounts:
          input.role === "ADMIN" ? Boolean(input.adminCanManageAccounts) : input.role === "SUPER_ADMIN",
        adminCanReviewPasswordResets:
          input.role === "ADMIN"
            ? Boolean(input.adminCanReviewPasswordResets)
            : input.role === "SUPER_ADMIN",
      },
      select: managedAccountSelect,
    });

    return serializeManagedAccount(created);
  } catch (error) {
    logger.error({ err: error, email, role: input.role }, "createManagedAccount failed");
    throw httpError(409, "Akun dengan email ini sudah ada.", { email });
  }
}

export async function setManagedAccountPassword(userId: string, passwordHash: string) {
  try {
    return await db.user.update({
      where: { id: userId },
      data: { password: passwordHash },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
  } catch (error) {
    logger.error({ err: error, userId }, "setManagedAccountPassword failed");
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }
}

export async function setManagedAccountAdminPermissions(
  userId: string,
  input: {
    canManageAccounts: boolean;
    canReviewPasswordResets: boolean;
  }
) {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        adminCanManageAccounts: input.canManageAccounts,
        adminCanReviewPasswordResets: input.canReviewPasswordResets,
      },
      select: managedAccountSelect,
    });

    return serializeManagedAccount(updated);
  } catch (error) {
    logger.error({ err: error, userId, input }, "setManagedAccountAdminPermissions failed");
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }
}

export async function setManagedAccountPasswordResetEnabled(
  userId: string,
  enabled: boolean
) {
  try {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        passwordResetEnabled: enabled,
        passwordResetEnabledAt: enabled ? new Date() : null,
      },
      select: managedAccountSelect,
    });

    return serializeManagedAccount(updated);
  } catch (error) {
    logger.error({ err: error, userId, enabled }, "setManagedAccountPasswordResetEnabled failed");
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }
}

export async function deleteManagedAccount(userId: string) {
  try {
    const deleted = await db.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return {
      ...deleted,
      mode: "DELETED" as const,
    };
  } catch (error) {
    logger.error({ err: error, userId }, "deleteManagedAccount failed");

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2003" || error.code === "P2014")
    ) {
      const archived = await db.$transaction(async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.BANNED,
            archivedAt: new Date(),
            password: null,
            phone: null,
            passwordResetEnabled: false,
            passwordResetEnabledAt: null,
            adminCanManageAccounts: false,
            adminCanReviewPasswordResets: false,
          },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        await tx.sellerProfile.updateMany({
          where: { userId },
          data: {
            status: "SUSPENDED",
          },
        });

        await tx.affiliateProfile.updateMany({
          where: { userId },
          data: {
            isActive: false,
          },
        });

        return user;
      });

      return {
        ...archived,
        mode: "ARCHIVED" as const,
      };
    }

    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }
}

export async function countUsersByRole(role: Role) {
  return db.user.count({ where: { role } });
}

export async function listPasswordResetAccessRequests(
  status?: PasswordResetAccessRequestStatus | PasswordResetAccessRequestStatus[]
) {
  const rows = await db.passwordResetAccessRequest.findMany({
    where: Array.isArray(status)
      ? {
          status: {
            in: status,
          },
        }
      : status
        ? { status }
        : undefined,
    orderBy: [{ requestedAt: "desc" }],
    select: passwordResetRequestSelect,
  });

  return rows.map(serializePasswordResetRequest);
}

export async function findPasswordResetAccessRequestById(id: string) {
  const row = await db.passwordResetAccessRequest.findUnique({
    where: { id },
    select: passwordResetRequestSelect,
  });

  return row ? serializePasswordResetRequest(row) : null;
}

export async function getLatestPasswordResetAccessState(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      passwordResetEnabled: true,
      passwordResetEnabledAt: true,
      passwordResetRequests: {
        orderBy: [{ requestedAt: "desc" }],
        take: 1,
        select: {
          id: true,
          status: true,
          note: true,
          requestedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }

  const latestRequest = user.passwordResetRequests[0] ?? null;

  return {
    userId: user.id,
    role: user.role,
    passwordResetEnabled: user.passwordResetEnabled,
    passwordResetEnabledAt: user.passwordResetEnabledAt?.toISOString() ?? null,
    latestRequest: latestRequest
      ? {
          id: latestRequest.id,
          status: latestRequest.status,
          note: latestRequest.note,
          requestedAt: latestRequest.requestedAt.toISOString(),
          reviewedAt: latestRequest.reviewedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export async function createPasswordResetAccessRequest(userId: string, note?: string | null) {
  const created = await db.passwordResetAccessRequest.create({
    data: {
      userId,
      note: note?.trim() || null,
    },
    select: passwordResetRequestSelect,
  });

  return serializePasswordResetRequest(created);
}

export async function findPendingPasswordResetAccessRequestForUser(userId: string) {
  const row = await db.passwordResetAccessRequest.findFirst({
    where: {
      userId,
      status: PasswordResetAccessRequestStatus.PENDING,
    },
    orderBy: [{ requestedAt: "desc" }],
    select: passwordResetRequestSelect,
  });

  return row ? serializePasswordResetRequest(row) : null;
}

export async function reviewPasswordResetAccessRequest(input: {
  requestId: string;
  status: "APPROVED" | "REJECTED";
  note?: string | null;
  reviewedById: string | null;
}) {
  return db.$transaction(async (tx) => {
    const existing = await tx.passwordResetAccessRequest.findUnique({
      where: { id: input.requestId },
      select: {
        id: true,
        status: true,
        note: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existing) {
      throw httpError(404, "Request reset password tidak ditemukan.", {
        requestId: input.requestId,
      });
    }

    if (existing.status !== PasswordResetAccessRequestStatus.PENDING) {
      throw httpError(409, "Request reset password ini sudah diproses sebelumnya.", {
        requestId: input.requestId,
        status: existing.status,
      });
    }

    const reviewedAt = new Date();

    await tx.passwordResetAccessRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        note: input.note?.trim() || existing.note || null,
        reviewedAt,
        reviewedById: input.reviewedById,
      },
    });

    if (input.status === PasswordResetAccessRequestStatus.APPROVED) {
      await tx.user.update({
        where: { id: existing.user.id },
        data: {
          passwordResetEnabled: true,
          passwordResetEnabledAt: reviewedAt,
        },
      });
    }

    const refreshed = await tx.passwordResetAccessRequest.findUnique({
      where: { id: input.requestId },
      select: passwordResetRequestSelect,
    });

    if (!refreshed) {
      throw httpError(404, "Request reset password tidak ditemukan setelah diproses.", {
        requestId: input.requestId,
      });
    }

    return serializePasswordResetRequest(refreshed);
  });
}

export async function completeOwnPasswordReset(userId: string, passwordHash: string) {
  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        passwordResetEnabled: true,
      },
    });

    if (!user) {
      throw httpError(404, "Akun tidak ditemukan.", { userId });
    }

    if (!user.passwordResetEnabled) {
      throw httpError(403, "Akses reset password belum dibuka oleh admin.", { userId });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        passwordResetEnabled: false,
        passwordResetEnabledAt: null,
      },
    });

    await tx.passwordResetAccessRequest.updateMany({
      where: {
        userId,
        status: PasswordResetAccessRequestStatus.APPROVED,
      },
      data: {
        status: PasswordResetAccessRequestStatus.COMPLETED,
        reviewedAt: new Date(),
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  });
}
