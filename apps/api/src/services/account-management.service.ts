import bcrypt from "bcryptjs";
import { PasswordResetAccessRequestStatus, Role, UserStatus } from "@prisma/client";
import { httpError } from "../lib/errors.js";
import * as auditsRepo from "../repositories/audits.repo.js";
import {
  completeOwnPasswordReset,
  countUsersByRole,
  createManagedAccount,
  createPasswordResetAccessRequest,
  deleteManagedAccount,
  getAccountManagementActorCapabilities,
  findManagedAccountIdentityById,
  findPasswordResetAccessRequestById,
  findPendingPasswordResetAccessRequestForUser,
  getLatestPasswordResetAccessState,
  listManagedAccounts,
  listPasswordResetAccessRequests,
  reviewPasswordResetAccessRequest,
  setManagedAccountAdminPermissions,
  setManagedAccountPassword,
  setManagedAccountPasswordResetEnabled,
} from "../repositories/account-management.repo.js";

type Actor = {
  id: string | null;
  role: Role | null;
};

type ActorCapabilities = {
  userId: string;
  role: Role;
  status: UserStatus;
  archivedAt: string | null;
  canManageAccounts: boolean;
  canReviewPasswordResets: boolean;
};

type CreatableRole = "USER" | "ADMIN" | "KASIR" | "SUPER_ADMIN";

const ADMIN_CREATABLE_ROLES = new Set<CreatableRole>(["USER", "ADMIN", "KASIR"]);
const SUPER_ADMIN_CREATABLE_ROLES = new Set<CreatableRole>(["USER", "ADMIN", "KASIR", "SUPER_ADMIN"]);

async function requireAdminActor(actor: Actor): Promise<ActorCapabilities> {
  if (!actor.id || !actor.role || (actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN")) {
    throw httpError(403, "Akses account management hanya untuk admin atau super admin.");
  }

  const capabilities = await getAccountManagementActorCapabilities(actor.id);

  if (capabilities.archivedAt || capabilities.status === "BANNED") {
    throw httpError(403, "Akun admin ini sudah dinonaktifkan.", {
      actorId: actor.id,
    });
  }

  return capabilities;
}

function ensureActorCanManageAccounts(actor: ActorCapabilities) {
  if (actor.role === "SUPER_ADMIN") {
    return;
  }

  if (!actor.canManageAccounts) {
    throw httpError(
      403,
      "Admin ini belum diberi izin untuk membuka halaman dan aksi account management."
    );
  }
}

function ensureActorCanOpenAccountManagement(actor: ActorCapabilities) {
  if (actor.role === "SUPER_ADMIN") {
    return;
  }

  if (!actor.canManageAccounts && !actor.canReviewPasswordResets) {
    throw httpError(
      403,
      "Admin ini belum diberi izin untuk membuka halaman account management."
    );
  }
}

function ensureActorCanReviewPasswordResets(actor: ActorCapabilities) {
  if (actor.role === "SUPER_ADMIN") {
    return;
  }

  if (!actor.canReviewPasswordResets) {
    throw httpError(
      403,
      "Admin ini belum diberi izin untuk mereview dan membuka akses reset password."
    );
  }
}

function ensureActorCanManageTargetRole(actorRole: Role, targetRole: Role) {
  if (actorRole === "SUPER_ADMIN") {
    return;
  }

  if (targetRole === "SUPER_ADMIN") {
    throw httpError(403, "Admin tidak boleh mengelola akun super admin.");
  }
}

function ensureActorCanCreateRole(actorRole: Role, targetRole: CreatableRole) {
  const allowedRoles =
    actorRole === "SUPER_ADMIN" ? SUPER_ADMIN_CREATABLE_ROLES : ADMIN_CREATABLE_ROLES;

  if (!allowedRoles.has(targetRole)) {
    throw httpError(403, "Role akun ini tidak boleh dibuat oleh aktor saat ini.", {
      targetRole,
      actorRole,
    });
  }
}

function buildAuditActor(actor: Pick<ActorCapabilities, "userId" | "role">) {
  return {
    actorId: actor.userId,
    actorRole: actor.role,
  };
}

export async function getAccountManagementAccessForActor(actor: Actor) {
  const capabilities = await requireAdminActor(actor);

  return {
    userId: capabilities.userId,
    role: capabilities.role,
    permissions: {
      canManageAccounts: capabilities.role === "SUPER_ADMIN" ? true : capabilities.canManageAccounts,
      canReviewPasswordResets:
        capabilities.role === "SUPER_ADMIN" ? true : capabilities.canReviewPasswordResets,
    },
  };
}

export async function listAccountsForActor(
  actor: Actor,
  filters: { search?: string; role?: Role; status?: UserStatus }
) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanOpenAccountManagement(actorCapabilities);
  const items = await listManagedAccounts(filters);

  if (actorCapabilities.role === "SUPER_ADMIN") {
    return items;
  }

  return items.filter((item) => item.role !== "SUPER_ADMIN");
}

export async function listPasswordResetRequestsForActor(
  actor: Actor,
  status?: PasswordResetAccessRequestStatus
) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanReviewPasswordResets(actorCapabilities);
  const items = await listPasswordResetAccessRequests(status);

  if (actorCapabilities.role === "SUPER_ADMIN") {
    return items;
  }

  return items.filter((item) => item.user.role !== "SUPER_ADMIN");
}

export async function createAccountForActor(
  actor: Actor,
  input: {
    name: string;
    email: string;
    phone?: string | null;
    role: CreatableRole;
    password: string;
    status?: UserStatus;
    adminPermissions?: {
      canManageAccounts: boolean;
      canReviewPasswordResets: boolean;
    };
  }
) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanManageAccounts(actorCapabilities);
  ensureActorCanCreateRole(actorCapabilities.role, input.role);

  const passwordHash = await bcrypt.hash(input.password, 10);
  const item = await createManagedAccount({
    name: input.name,
    email: input.email,
    phone: input.phone,
    role: input.role,
    passwordHash,
    status: input.status,
    adminCanManageAccounts:
      actorCapabilities.role === "SUPER_ADMIN" && input.role === "ADMIN"
        ? input.adminPermissions?.canManageAccounts
        : false,
    adminCanReviewPasswordResets:
      actorCapabilities.role === "SUPER_ADMIN" && input.role === "ADMIN"
        ? input.adminPermissions?.canReviewPasswordResets
        : false,
  });

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action: "ACCOUNT_CREATED",
    targetType: "USER_ACCOUNT",
    targetId: item.id,
    meta: {
      email: item.email,
      role: item.role,
      status: item.status,
      adminPermissions: item.adminPermissions,
    },
  });

  return item;
}

export async function deleteAccountForActor(actor: Actor, userId: string) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanManageAccounts(actorCapabilities);

  if (actorCapabilities.userId === userId) {
    throw httpError(409, "Akun yang sedang login tidak boleh dihapus sendiri.");
  }

  const existing = await findManagedAccountIdentityById(userId);
  if (!existing) {
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }

  ensureActorCanManageTargetRole(actorCapabilities.role, existing.role);

  if (existing.role === "SUPER_ADMIN") {
    const totalSuperAdmins = await countUsersByRole("SUPER_ADMIN");
    if (totalSuperAdmins <= 1) {
      throw httpError(409, "Super admin terakhir tidak boleh dihapus.");
    }
  }

  const deleted = await deleteManagedAccount(userId);

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action: deleted.mode === "ARCHIVED" ? "ACCOUNT_ARCHIVED" : "ACCOUNT_DELETED",
    targetType: "USER_ACCOUNT",
    targetId: deleted.id,
    meta: {
      email: deleted.email,
      role: deleted.role,
      mode: deleted.mode,
    },
  });

  return deleted;
}

export async function setAccountPasswordResetAccessForActor(
  actor: Actor,
  userId: string,
  enabled: boolean,
  note?: string | null
) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanReviewPasswordResets(actorCapabilities);

  const existing = await findManagedAccountIdentityById(userId);
  if (!existing) {
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }

  ensureActorCanManageTargetRole(actorCapabilities.role, existing.role);

  const updated = await setManagedAccountPasswordResetEnabled(userId, enabled);
  const pendingRequest = await findPendingPasswordResetAccessRequestForUser(userId);

  if (pendingRequest) {
    await reviewPasswordResetAccessRequest({
      requestId: pendingRequest.id,
      status: enabled
        ? PasswordResetAccessRequestStatus.APPROVED
        : PasswordResetAccessRequestStatus.REJECTED,
      note,
      reviewedById: actorCapabilities.userId,
    });
  }

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action: enabled ? "ACCOUNT_PASSWORD_RESET_ACCESS_GRANTED" : "ACCOUNT_PASSWORD_RESET_ACCESS_REVOKED",
    targetType: "USER_ACCOUNT",
    targetId: updated.id,
    meta: {
      email: updated.email,
      role: updated.role,
      note: note?.trim() || null,
    },
  });

  return updated;
}

export async function reviewPasswordResetRequestForActor(
  actor: Actor,
  requestId: string,
  status: "APPROVED" | "REJECTED",
  note?: string | null
) {
  const actorCapabilities = await requireAdminActor(actor);
  ensureActorCanReviewPasswordResets(actorCapabilities);

  const existing = await findPasswordResetAccessRequestById(requestId);
  if (!existing) {
    throw httpError(404, "Request reset password tidak ditemukan.", { requestId });
  }

  ensureActorCanManageTargetRole(actorCapabilities.role, existing.user.role);

  const reviewed = await reviewPasswordResetAccessRequest({
    requestId,
    status,
    note,
      reviewedById: actorCapabilities.userId,
  });

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action:
      status === PasswordResetAccessRequestStatus.APPROVED
        ? "ACCOUNT_PASSWORD_RESET_REQUEST_APPROVED"
        : "ACCOUNT_PASSWORD_RESET_REQUEST_REJECTED",
    targetType: "PASSWORD_RESET_ACCESS_REQUEST",
    targetId: reviewed.id,
    meta: {
      userId: reviewed.user.id,
      userEmail: reviewed.user.email,
      userRole: reviewed.user.role,
      note: reviewed.note,
    },
  });

  return reviewed;
}

export async function setAccountAdminPermissionsForActor(
  actor: Actor,
  userId: string,
  input: {
    canManageAccounts: boolean;
    canReviewPasswordResets: boolean;
  }
) {
  const actorCapabilities = await requireAdminActor(actor);

  if (actorCapabilities.role !== "SUPER_ADMIN") {
    throw httpError(403, "Hanya super admin yang boleh mengatur permission admin.");
  }

  if (actorCapabilities.userId === userId) {
    throw httpError(409, "Permission akun yang sedang login tidak boleh diubah dari halaman ini.");
  }

  const existing = await findManagedAccountIdentityById(userId);
  if (!existing) {
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }

  if (existing.role !== "ADMIN") {
    throw httpError(409, "Permission granular ini hanya berlaku untuk akun admin.");
  }

  const updated = await setManagedAccountAdminPermissions(userId, input);

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action: "ACCOUNT_ADMIN_PERMISSIONS_UPDATED",
    targetType: "USER_ACCOUNT",
    targetId: updated.id,
    meta: {
      email: updated.email,
      role: updated.role,
      adminPermissions: updated.adminPermissions,
    },
  });

  return updated;
}

export async function setAccountPasswordForActor(actor: Actor, userId: string, password: string) {
  const actorCapabilities = await requireAdminActor(actor);

  if (actorCapabilities.role !== "SUPER_ADMIN") {
    throw httpError(403, "Hanya super admin yang boleh mengatur password langsung.");
  }

  const existing = await findManagedAccountIdentityById(userId);
  if (!existing) {
    throw httpError(404, "Akun tidak ditemukan.", { userId });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const updated = await setManagedAccountPassword(userId, passwordHash);

  await auditsRepo.write({
    ...buildAuditActor(actorCapabilities),
    action: "ACCOUNT_PASSWORD_SET_DIRECTLY",
    targetType: "USER_ACCOUNT",
    targetId: updated.id,
    meta: {
      email: updated.email,
      role: updated.role,
    },
  });

  return updated;
}

export async function getOwnPasswordResetAccessState(userId: string) {
  return getLatestPasswordResetAccessState(userId);
}

export async function requestOwnPasswordResetAccess(userId: string, note?: string | null) {
  const currentState = await getLatestPasswordResetAccessState(userId);

  if (currentState.passwordResetEnabled) {
    throw httpError(409, "Akses reset password sudah dibuka. Kamu bisa langsung ganti password.");
  }

  if (currentState.latestRequest?.status === PasswordResetAccessRequestStatus.PENDING) {
    throw httpError(409, "Pengajuan reset password masih menunggu review admin.");
  }

  const created = await createPasswordResetAccessRequest(userId, note);

  await auditsRepo.write({
    action: "ACCOUNT_PASSWORD_RESET_REQUEST_SUBMITTED",
    actorId: userId,
    actorRole: currentState.role,
    targetType: "PASSWORD_RESET_ACCESS_REQUEST",
    targetId: created.id,
    meta: {
      note: created.note,
    },
  });

  return created;
}

export async function resetOwnPasswordWithAccess(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await completeOwnPasswordReset(userId, passwordHash);

  await auditsRepo.write({
    action: "ACCOUNT_PASSWORD_RESET_COMPLETED",
    actorId: updated.id,
    actorRole: updated.role,
    targetType: "USER_ACCOUNT",
    targetId: updated.id,
    meta: {
      email: updated.email,
    },
  });

  return updated;
}
