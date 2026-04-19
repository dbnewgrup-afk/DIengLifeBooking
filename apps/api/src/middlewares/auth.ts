// apps/api/src/middlewares/auth.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../lib/env.js";

type AppRole = Role;

type RequestUser = {
  id: string;
  email?: string;
  role: AppRole;
};

// Augment Express Request supaya req.user dikenali TS
declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

interface AccessPayload extends JwtPayload {
  id: string;
  email?: string;
  role: AppRole;
}

const JWT_SECRET = env.jwtSecret;

// Middleware auth: attach req.user jika token valid; jika tidak ada token → anonymous
export default function auth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;

  if (!h || !h.startsWith("Bearer ")) {
    req.user = undefined;
    return next();
  }

  const token = h.slice(7).trim();
  if (!token) {
    req.user = undefined;
    return res.status(401).json({ error: "Invalid Authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AccessPayload;
    if (!payload?.id || !payload?.role) {
      req.user = undefined;
      return res.status(401).json({ error: "Invalid token payload" });
    }
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch (err: any) {
    req.user = undefined;
    return res
      .status(401)
      .json({ error: "Unauthorized", detail: err?.message || "jwt_error" });
  }
}

// Harus login
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.sendStatus(401);
  next();
}

// Harus punya salah satu role (variadik, bukan array)
export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return res.sendStatus(401);
    if (!roles.includes(role)) return res.sendStatus(403);
    next();
  };
}
