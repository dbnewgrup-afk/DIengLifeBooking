import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import {
  AffiliatePagingQuery,
  AffiliateTrackClickBody,
  CreateAffiliateWithdrawRequestBody,
} from "../schemas/affiliate.schema.js";
import {
  createAffiliateWithdrawRequest,
  getAffiliateActivity,
  getAffiliateBalance,
  getAffiliateLinks,
  getAffiliatePerformance,
  listAdminAffiliateSummary,
  listAffiliateWithdrawRequests,
  trackAffiliateClick,
} from "../repositories/affiliates.repo.js";

const r = Router();

function requireAffiliateUserId(req: { user?: { id?: string } }, res: any) {
  const userId = req.user?.id ?? null;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}

r.post("/track/click", async (req, res, next) => {
  try {
    const payload = AffiliateTrackClickBody.parse(req.body);
    const result = await trackAffiliateClick({
      ...payload,
      userAgent: req.get("user-agent") ?? null,
    });
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

r.get("/admin-summary", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (_req, res, next) => {
  try {
    const items = await listAdminAffiliateSummary();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.get("/me/overview", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const result = await getAffiliatePerformance(userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

r.get("/me/links", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const result = await getAffiliateLinks(userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

r.get("/me/activity", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const { limit } = AffiliatePagingQuery.parse(req.query);
    const result = await getAffiliateActivity(userId, limit);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

r.get("/me/balance", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const result = await getAffiliateBalance(userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

r.get("/me/withdraws", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const { limit } = AffiliatePagingQuery.parse(req.query);
    const result = await listAffiliateWithdrawRequests(userId, limit);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

r.post("/me/withdraws", auth, requireRole("AFFILIATE"), async (req, res, next) => {
  try {
    const userId = requireAffiliateUserId(req, res);
    if (!userId) return;
    const payload = CreateAffiliateWithdrawRequestBody.parse(req.body);
    const result = await createAffiliateWithdrawRequest(userId, payload);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default r;
