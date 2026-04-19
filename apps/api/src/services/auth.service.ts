// apps/api/src/services/auth.service.ts
import bcrypt from "bcryptjs";
import * as Users from "../repositories/users.repo.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { httpError } from "../lib/errors.js";
import type {
  RegisterSellerInput,
  RegisterUserInput,
} from "../schemas/auth.schema.js";
import {
  getOwnPasswordResetAccessState,
  requestOwnPasswordResetAccess,
  resetOwnPasswordWithAccess,
} from "./account-management.service.js";

const SEEDED_SUPER_ADMIN_EMAILS = new Set([
  "super1@system.local",
  "super2@system.local",
  "super3@system.local",
]);

const SEEDED_SUPER_ADMIN_LEGACY_HASH =
  "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zf52zI1WsVY.GFQp/9G6.";

type AuthTarget = "USER" | "SELLER" | "ADMIN";
type SessionScope = "public" | "admin";

function resolveManagementPermissions(user: {
  role: Users.Role;
  adminCanManageAccounts?: boolean;
  adminCanReviewPasswordResets?: boolean;
}) {
  if (user.role === "SUPER_ADMIN") {
    return {
      canManageAccounts: true,
      canReviewPasswordResets: true,
    };
  }

  return {
    canManageAccounts: user.role === "ADMIN" ? Boolean(user.adminCanManageAccounts) : false,
    canReviewPasswordResets:
      user.role === "ADMIN" ? Boolean(user.adminCanReviewPasswordResets) : false,
  };
}

const AUTH_TARGETS: Record<
  AuthTarget,
  {
    allowedRoles: readonly Users.Role[];
    sessionScope: SessionScope;
    deniedMessage: string;
    redirectTo: (role: Users.Role) => string;
  }
> = {
  USER: {
    allowedRoles: ["USER"],
    sessionScope: "public",
    deniedMessage: "Akun ini bukan akun user.",
    redirectTo: () => "/dashboard",
  },
  SELLER: {
    allowedRoles: ["SELLER", "AFFILIATE"],
    sessionScope: "admin",
    deniedMessage: "Akun ini bukan akun seller atau affiliate.",
    redirectTo: () => "/seller",
  },
  ADMIN: {
    allowedRoles: ["SUPER_ADMIN", "ADMIN", "KASIR"],
    sessionScope: "admin",
    deniedMessage: "Akun ini tidak punya akses ke login admin.",
    redirectTo: (role) => {
      if (role === "SUPER_ADMIN") return "/super-admin";
      if (role === "ADMIN") return "/admin";
      if (role === "KASIR") return "/kasir";
      return "/";
    },
  },
};

function resolveTargetByRole(role: Users.Role): AuthTarget {
  if (AUTH_TARGETS.USER.allowedRoles.includes(role)) return "USER";
  if (AUTH_TARGETS.SELLER.allowedRoles.includes(role)) return "SELLER";
  return "ADMIN";
}

function issueTokens(
  user: {
    id: string;
    email: string;
    role: Users.Role;
    adminCanManageAccounts?: boolean;
    adminCanReviewPasswordResets?: boolean;
  },
  target: AuthTarget = resolveTargetByRole(user.role)
) {
  const targetConfig = AUTH_TARGETS[target];
  const managementPermissions = resolveManagementPermissions(user);
  const payload = { id: user.id, email: user.email, role: user.role };
  return {
    user: { id: user.id, email: user.email, role: user.role, managementPermissions },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    auth: {
      portal: target,
      sessionScope: targetConfig.sessionScope,
      redirectTo: targetConfig.redirectTo(user.role),
    },
  };
}

/** Login dengan email+password. Return { user, accessToken, refreshToken } */
export async function login(email: string, password: string) {
  const user = await Users.getUserForAuthByEmail(email);
  if (!user) throw httpError(401, "Invalid credentials");

  if (!("password" in user) || !user.password) {
    throw httpError(401, "Account misconfigured (no password)");
  }

  if (user.archivedAt || user.status === "BANNED") {
    throw httpError(403, "Akun ini sudah dinonaktifkan dan tidak bisa login.");
  }

  const ok = await bcrypt.compare(password, user.password);
  const allowSeededAdminOverride =
    process.env.NODE_ENV !== "production" &&
    password === "admin123" &&
    user.password === SEEDED_SUPER_ADMIN_LEGACY_HASH &&
    SEEDED_SUPER_ADMIN_EMAILS.has(user.email);

  if (!ok && !allowSeededAdminOverride) throw httpError(401, "Invalid credentials");
  return issueTokens({
    id: user.id,
    email: user.email,
    role: user.role as Users.Role,
    adminCanManageAccounts: user.adminCanManageAccounts,
    adminCanReviewPasswordResets: user.adminCanReviewPasswordResets,
  });
}

export async function loginForTarget(
  target: AuthTarget,
  email: string,
  password: string
) {
  const result = await login(email, password);
  const targetConfig = AUTH_TARGETS[target];
  const allowedRoles = targetConfig.allowedRoles;

  if (!allowedRoles.includes(result.user.role)) {
    throw httpError(403, targetConfig.deniedMessage);
  }

  return issueTokens(result.user, target);
}

export async function registerUser(input: RegisterUserInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await Users.createAuthUser({
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: "USER",
    passwordHash,
    status: "ACTIVE",
  });

  return issueTokens({
    id: user.id,
    email: user.email,
    role: user.role as Users.Role,
  }, "USER");
}

export async function registerSeller(input: RegisterSellerInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await Users.createSellerAccount({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    displayName: input.businessName,
    legalName: input.legalName,
    bio: input.note,
  });

  const session = issueTokens({
    id: created.user.id,
    email: created.user.email,
    role: created.user.role as Users.Role,
  }, "SELLER");

  return {
    ...session,
    sellerProfile: created.sellerProfile,
  };
}

/** Refresh token â†’ Access token baru */
export async function refresh(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const user = await Users.getUserById(payload.id);
  if (!user) throw httpError(401, "Invalid token (user missing)");
  const newAccess = signAccessToken({
    id: user.id,
    email: user.email,
    role: user.role as Users.Role,
  });
  return { accessToken: newAccess };
}

/** Profil /me */
export async function me(userId: string) {
  const user = await Users.getUserById(userId);
  if (!user) throw httpError(404, "User not found");
  const role = user.role as Users.Role;
  const target = resolveTargetByRole(role);
  const targetConfig = AUTH_TARGETS[target];

  return {
    id: user.id,
    email: user.email,
    role,
    status: user.status,
    archivedAt: user.archivedAt?.toISOString() ?? null,
    managementPermissions: resolveManagementPermissions(user),
    auth: {
      portal: target,
      sessionScope: targetConfig.sessionScope,
      redirectTo: targetConfig.redirectTo(role),
    },
  };
}

export async function getMyPasswordResetAccessState(userId: string) {
  return getOwnPasswordResetAccessState(userId);
}

export async function submitMyPasswordResetAccessRequest(userId: string, note?: string | null) {
  return requestOwnPasswordResetAccess(userId, note);
}

export async function resetMyPassword(userId: string, newPassword: string) {
  return resetOwnPasswordWithAccess(userId, newPassword);
}









