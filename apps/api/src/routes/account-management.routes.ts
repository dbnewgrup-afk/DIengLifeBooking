import { PasswordResetAccessRequestStatus } from "@prisma/client";
import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import {
  CreateManagedAccountSchema,
  ManagedAccountAdminPermissionsSchema,
  ManagedAccountListQuerySchema,
  ManagedAccountParamsSchema,
  ManagedAccountPasswordSchema,
  ManagedAccountResetAccessSchema,
  PasswordResetRequestListQuerySchema,
  PasswordResetRequestParamsSchema,
  ReviewPasswordResetRequestSchema,
} from "../schemas/account-management.schema.js";
import {
  createAccountForActor,
  deleteAccountForActor,
  getAccountManagementAccessForActor,
  listAccountsForActor,
  listPasswordResetRequestsForActor,
  reviewPasswordResetRequestForActor,
  setAccountAdminPermissionsForActor,
  setAccountPasswordForActor,
  setAccountPasswordResetAccessForActor,
} from "../services/account-management.service.js";

const r = Router();

r.use(auth, requireRole("ADMIN", "SUPER_ADMIN"));

r.get("/me", async (req, res, next) => {
  try {
    const item = await getAccountManagementAccessForActor({
      id: req.user?.id ?? null,
      role: req.user?.role ?? null,
    });
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.get("/accounts", async (req, res, next) => {
  try {
    const filters = ManagedAccountListQuerySchema.parse(req.query);
    const items = await listAccountsForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      filters
    );
    return res.json({ ok: true, items });
  } catch (error) {
    return next(error);
  }
});

r.post("/accounts", async (req, res, next) => {
  try {
    const payload = CreateManagedAccountSchema.parse(req.body);
    const item = await createAccountForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      payload
    );
    return res.status(201).json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.delete("/accounts/:id", async (req, res, next) => {
  try {
    const { id } = ManagedAccountParamsSchema.parse(req.params);
    const item = await deleteAccountForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      id
    );
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.patch("/accounts/:id/reset-access", async (req, res, next) => {
  try {
    const { id } = ManagedAccountParamsSchema.parse(req.params);
    const payload = ManagedAccountResetAccessSchema.parse(req.body);
    const item = await setAccountPasswordResetAccessForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      id,
      payload.enabled,
      payload.note
    );
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.patch("/accounts/:id/password", async (req, res, next) => {
  try {
    const { id } = ManagedAccountParamsSchema.parse(req.params);
    const payload = ManagedAccountPasswordSchema.parse(req.body);
    const item = await setAccountPasswordForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      id,
      payload.password
    );
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.patch("/accounts/:id/admin-permissions", async (req, res, next) => {
  try {
    const { id } = ManagedAccountParamsSchema.parse(req.params);
    const payload = ManagedAccountAdminPermissionsSchema.parse(req.body);
    const item = await setAccountAdminPermissionsForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      id,
      payload
    );
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

r.get("/password-reset-requests", async (req, res, next) => {
  try {
    const query = PasswordResetRequestListQuerySchema.parse(req.query);
    const items = await listPasswordResetRequestsForActor({
      id: req.user?.id ?? null,
      role: req.user?.role ?? null,
    }, query.status);
    return res.json({
      ok: true,
      items,
      status: query.status ?? null,
    });
  } catch (error) {
    return next(error);
  }
});

r.patch("/password-reset-requests/:id", async (req, res, next) => {
  try {
    const { id } = PasswordResetRequestParamsSchema.parse(req.params);
    const payload = ReviewPasswordResetRequestSchema.parse(req.body);
    const item = await reviewPasswordResetRequestForActor(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      id,
      payload.status,
      payload.note
    );
    return res.json({ ok: true, item });
  } catch (error) {
    return next(error);
  }
});

export default r;
