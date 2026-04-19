import type { Request, Response, NextFunction } from 'express';
// apps/api/src/types/index.d.ts
export {};

declare global {
  namespace Express {
    type Role = "SUPER_ADMIN" | "ADMIN" | "KASIR" | "SELLER" | "USER";

    interface AuthUser {
      id: string;
      email?: string;
      role: Role;
    }

    interface Request {
      user?: AuthUser;
    }
  }
}









