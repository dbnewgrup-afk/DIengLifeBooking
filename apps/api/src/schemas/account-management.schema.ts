import { PasswordResetAccessRequestStatus, Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import { PasswordSchema } from "./auth.schema.js";

const manageableCreateRoleSchema = z.enum(["USER", "ADMIN", "KASIR", "SUPER_ADMIN"]);

export const ManagedAccountListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const ManagedAccountParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const PasswordResetRequestParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const PasswordResetRequestListQuerySchema = z.object({
  status: z.nativeEnum(PasswordResetAccessRequestStatus).optional(),
});

export const CreateManagedAccountSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20).optional().nullable(),
  role: manageableCreateRoleSchema,
  password: PasswordSchema,
  status: z.nativeEnum(UserStatus).optional(),
  adminPermissions: z
    .object({
      canManageAccounts: z.boolean(),
      canReviewPasswordResets: z.boolean(),
    })
    .optional(),
});

export const ManagedAccountResetAccessSchema = z.object({
  enabled: z.boolean(),
  note: z.string().trim().max(300).optional().nullable(),
});

export const ManagedAccountPasswordSchema = z.object({
  password: PasswordSchema,
});

export const ManagedAccountAdminPermissionsSchema = z.object({
  canManageAccounts: z.boolean(),
  canReviewPasswordResets: z.boolean(),
});

export const ReviewPasswordResetRequestSchema = z.object({
  status: z.enum([
    PasswordResetAccessRequestStatus.APPROVED,
    PasswordResetAccessRequestStatus.REJECTED,
  ]),
  note: z.string().trim().max(300).optional().nullable(),
});
