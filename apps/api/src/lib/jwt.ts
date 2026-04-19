// apps/api/src/lib/jwt.ts
import jwt from "jsonwebtoken";
import type { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export type Role = "SUPER_ADMIN" | "ADMIN" | "KASIR" | "SELLER" | "AFFILIATE" | "USER";

export interface UserToken {
  id: string;
  email?: string;
  role: Role;
}

const JWT_SECRET: Secret = env.jwtSecret;
const REFRESH_SECRET: Secret = env.jwtRefreshSecret;

const ACCESS_TTL = env.jwtAccessTtl;
const REFRESH_TTL = env.jwtRefreshTtl;

// Kunci ke HS256 supaya TypeScript tidak mengira "algorithm: none"
const baseOpts: SignOptions = {
  algorithm: "HS256",
  issuer: "booking-villa",
} as const;

export function signAccessToken(payload: UserToken): string {
  // Hindari overload callback, paksa opsi bertipe SignOptions
  return jwt.sign(payload, JWT_SECRET, { ...baseOpts, expiresIn: ACCESS_TTL } as SignOptions);
}

export function signRefreshToken(
  payload: Pick<UserToken, "id" | "role"> & { email?: string }
): string {
  return jwt.sign(payload, REFRESH_SECRET, { ...baseOpts, expiresIn: REFRESH_TTL } as SignOptions);
}

export function verifyAccessToken(token: string): UserToken & JwtPayload {
  return jwt.verify(token, JWT_SECRET) as UserToken & JwtPayload;
}

export function verifyRefreshToken(token: string): UserToken & JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as UserToken & JwtPayload;
}









