import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import {
  DashboardNoticeBody,
  DashboardNoticeListQuery,
  DashboardNoticeParams,
  DashboardNoticeUpdateBody,
} from "../schemas/dashboard-control.schema.js";
import {
  createDashboardNotice,
  deleteDashboardNotice,
  getDashboardControlSnapshot,
  listDashboardNoticesAdmin,
  listDashboardNoticesForRole,
  updateDashboardNotice,
} from "../repositories/dashboard-control.repo.js";

const r = Router();

r.get("/notices/public", async (_req, res, next) => {
  try {
    const items = await listDashboardNoticesForRole();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.get("/notices/me", auth, async (req, res, next) => {
  try {
    const items = await listDashboardNoticesForRole(req.user?.role ?? null);
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.use(auth, requireRole("ADMIN", "SUPER_ADMIN"));

r.get("/notices", async (req, res, next) => {
  try {
    const { includeInactive } = DashboardNoticeListQuery.parse(req.query);
    const items = await listDashboardNoticesAdmin(includeInactive);
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.post("/notices", async (req, res, next) => {
  try {
    const payload = DashboardNoticeBody.parse(req.body);
    const item = await createDashboardNotice(
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      payload
    );
    return res.status(201).json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.patch("/notices/:id", async (req, res, next) => {
  try {
    const { id } = DashboardNoticeParams.parse(req.params);
    const payload = DashboardNoticeUpdateBody.parse(req.body);
    const item = await updateDashboardNotice(
      id,
      { id: req.user?.id ?? null, role: req.user?.role ?? null },
      payload
    );
    return res.json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.delete("/notices/:id", async (req, res, next) => {
  try {
    const { id } = DashboardNoticeParams.parse(req.params);
    const item = await deleteDashboardNotice(id, {
      id: req.user?.id ?? null,
      role: req.user?.role ?? null,
    });
    return res.json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.get("/monitoring", async (_req, res, next) => {
  try {
    const snapshot = await getDashboardControlSnapshot();
    return res.json({ ok: true, snapshot });
  } catch (error) {
    next(error);
  }
});

export default r;
