import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { z } from "zod";
import * as sellerDashboardRepo from "../repositories/partner-dashboard.repo.js";
import { SellerRangeQuery } from "../schemas/seller.schema.js";

const r = Router();

const Range = z.object({
  from: z.string().optional(),
  to: z.string().optional()
});

async function handleSellerSummary(req: { user?: { id?: string }; query: unknown }, res: any) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const range = SellerRangeQuery.parse(req.query);
  const result = await sellerDashboardRepo.getPartnerSummary(userId, range);
  return res.json(result);
}

r.get("/admin/overview", auth, requireRole("ADMIN", "SUPER_ADMIN"), (req, res, next) => {
  try {
    Range.parse(req.query);
    res.json({
      ok: true,
      kpis: { revenue: 0, orders: 0, avgOrderValue: 0, paidRate: 0 },
      byDay: [],
      methodSplit: [],
      topProducts: []
    });
  } catch (e) { next(e); }
});

r.get("/seller/me", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerSummary(req, res);
  } catch (e) {
    next(e);
  }
});

// LEGACY / COMPAT ONLY: keep /partner alive temporarily while clients migrate to /seller.
r.get("/partner/me", auth, requireRole("SELLER"), async (req, res, next) => {
  try {
    return await handleSellerSummary(req, res);
  } catch (e) {
    next(e);
  }
});

export default r;
