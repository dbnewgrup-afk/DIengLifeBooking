import type { Request, Response, NextFunction } from 'express';
// apps/api/src/controllers/auth.controller.ts

import * as Auth from "../services/auth.service.js";
import {
  LoginSchema,
  PasswordResetAccessRequestSchema,
  PasswordResetSchema,
  RefreshSchema,
  RegisterSellerSchema,
  RegisterUserSchema,
} from "../schemas/auth.schema.js";
import { validate } from "../lib/validate.js";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = validate(LoginSchema, req.body);
    const result = await Auth.login(email, password);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = validate(LoginSchema, req.body);
    const result = await Auth.loginForTarget("USER", email, password);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function loginAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = validate(LoginSchema, req.body);
    const result = await Auth.loginForTarget("ADMIN", email, password);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function loginSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = validate(LoginSchema, req.body);
    const result = await Auth.loginForTarget("SELLER", email, password);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(RegisterUserSchema, req.body);
    const result = await Auth.registerUser(payload);
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function registerSeller(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = validate(RegisterSellerSchema, req.body);
    const result = await Auth.registerSeller(payload);
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = validate(RefreshSchema, req.body);
    const result = await Auth.refresh(refreshToken);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const profile = await Auth.me(req.user.id);
    return res.json({ ok: true, user: profile });
  } catch (error) {
    return next(error);
  }
}

export async function myPasswordResetAccessState(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const state = await Auth.getMyPasswordResetAccessState(req.user.id);
    return res.json({ ok: true, ...state });
  } catch (error) {
    return next(error);
  }
}

export async function requestMyPasswordResetAccess(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const payload = validate(PasswordResetAccessRequestSchema, req.body ?? {});
    const item = await Auth.submitMyPasswordResetAccessRequest(req.user.id, payload.note);
    return res.status(201).json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
}

export async function resetMyPassword(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const payload = validate(PasswordResetSchema, req.body);
    const result = await Auth.resetMyPassword(req.user.id, payload.newPassword);
    return res.json({ ok: true, user: result });
  } catch (error) {
    return next(error);
  }
}










