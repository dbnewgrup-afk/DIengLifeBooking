import type { Request, Response, NextFunction } from 'express';
// apps/api/src/middlewares/rbac.ts


type Role = "SUPER_ADMIN" | "ADMIN" | "KASIR" | "SELLER" | "AFFILIATE" | "USER";

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Kalau belum login / token invalid, balas 401
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}









