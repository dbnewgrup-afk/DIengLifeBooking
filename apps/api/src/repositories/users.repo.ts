// apps/api/src/repositories/users.repo.ts
import db from "../lib/db.js";
import logger from "../lib/logger.js";
import { httpError } from "../lib/errors.js";

export type Role = "SUPER_ADMIN" | "ADMIN" | "KASIR" | "SELLER" | "AFFILIATE" | "USER";
export type UserStatus = "ACTIVE" | "BANNED" | "PENDING_VERIFICATION";

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      adminCanManageAccounts: true,
      adminCanReviewPasswordResets: true,
      archivedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email: normEmail(email) },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
}

/** Khusus auth: butuh password hash */
export async function getUserForAuthByEmail(email: string) {
  return db.user.findUnique({
    where: { email: normEmail(email) },
    select: {
      id: true,
      email: true,
      role: true,
      password: true,
      status: true,
      archivedAt: true,
      adminCanManageAccounts: true,
      adminCanReviewPasswordResets: true,
    },
  });
}

export async function listUsersByRole(role: Role) {
  return db.user.findMany({
    where: { role },
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(email: string, role: Role, passwordHash?: string) {
  const e = normEmail(email);
  const defaultName = e.split("@")[0] || "user";
  try {
    return await db.user.create({
      data: {
        email: e,
        name: defaultName,
        role,
        ...(passwordHash ? { password: passwordHash } : {}),
      },
      select: { id: true, email: true, role: true, name: true, createdAt: true },
    });
  } catch (err: any) {
    logger.error({ err, email: e }, "createUser failed");
    throw httpError(409, "User already exists", { email: e });
  }
}

type CreateAuthUserInput = {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  phone?: string;
  status?: UserStatus;
};

export async function createAuthUser(input: CreateAuthUserInput) {
  const email = normEmail(input.email);
  try {
    return await db.user.create({
      data: {
        email,
        name: input.name.trim(),
        role: input.role,
        password: input.passwordHash,
        phone: input.phone?.trim() || null,
        status: input.status ?? "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
      },
    });
  } catch (err: any) {
    logger.error({ err, email, role: input.role }, "createAuthUser failed");
    throw httpError(409, "User already exists", { email });
  }
}

type CreateSellerAccountInput = {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  displayName: string;
  legalName?: string;
  bio?: string;
};

export async function createSellerAccount(input: CreateSellerAccountInput) {
  const email = normEmail(input.email);

  try {
    return await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          password: input.passwordHash,
          phone: input.phone.trim(),
          role: "SELLER",
          status: "ACTIVE",
        },
        select: {
          id: true,
          email: true,
          role: true,
          name: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      });

      const sellerProfile = await tx.sellerProfile.create({
        data: {
          userId: user.id,
          displayName: input.displayName.trim(),
          legalName: input.legalName?.trim() || null,
          bio: input.bio?.trim() || null,
          status: "PENDING_REVIEW",
        },
        select: {
          id: true,
          displayName: true,
          legalName: true,
          status: true,
          createdAt: true,
        },
      });

      return { user, sellerProfile };
    });
  } catch (err: any) {
    logger.error({ err, email }, "createSellerAccount failed");
    throw httpError(409, "User already exists", { email });
  }
}

export async function updateUserRole(userId: string, role: Role) {
  try {
    return await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  } catch (err: any) {
    logger.error({ err, userId, role }, "updateUserRole failed");
    throw httpError(404, "User not found", { userId });
  }
}

export async function ensureSuperAdmins(emails: string[]) {
  const targets = emails.map(normEmail);
  const results: Array<{ email: string; created: boolean }> = [];
  for (const email of targets) {
    const defaultName = email.split("@")[0] || "admin";
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (existing) {
      if (existing.role !== "SUPER_ADMIN") {
        await db.user.update({ where: { email }, data: { role: "SUPER_ADMIN" } });
      }
      results.push({ email, created: false });
      continue;
    }
    await db.user.create({ data: { email, name: defaultName, role: "SUPER_ADMIN" } });
    results.push({ email, created: true });
  }
  return results;
}









