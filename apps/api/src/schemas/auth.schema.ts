// apps/api/src/schemas/auth.schema.ts
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(3)
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export const PasswordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(72, "Password maksimal 72 karakter");

export const RegisterUserSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: PasswordSchema,
});

export const RegisterSellerSchema = z.object({
  name: z.string().trim().min(2, "Nama PIC minimal 2 karakter").max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8, "Nomor WhatsApp wajib diisi").max(20),
  password: PasswordSchema,
  businessName: z.string().trim().min(2, "Nama usaha minimal 2 karakter").max(120),
  legalName: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

export const PasswordResetAccessRequestSchema = z.object({
  note: z.string().trim().max(300).optional().nullable(),
});

export const PasswordResetSchema = z.object({
  newPassword: PasswordSchema,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type RegisterSellerInput = z.infer<typeof RegisterSellerSchema>;









