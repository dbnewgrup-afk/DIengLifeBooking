import { Router } from "express";
import { Role } from "@prisma/client";
import auth, { requireRole } from "../middlewares/auth.js";
import * as sellerDashboardRepo from "../repositories/partner-dashboard.repo.js";
import {
  CreateSellerWithdrawRequestBody,
  SellerBookingsQuery,
  SellerPagingQuery,
} from "../schemas/seller.schema.js";

const r = Router();

function requireSellerUserId(req: { user?: { id?: string } }, res: any) {
  const userId = req.user?.id ?? null;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return userId;
}

r.use(auth, requireRole(Role.SELLER));

r.get("/balance", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const result = await sellerDashboardRepo.getPartnerBalance(userId);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

r.get("/payouts", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const { limit } = SellerPagingQuery.parse(req.query);
    const result = await sellerDashboardRepo.listPartnerPayouts(userId, limit);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

r.get("/wallet-transactions", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const { limit } = SellerPagingQuery.parse(req.query);
    const result = await sellerDashboardRepo.listPartnerWalletTransactions(userId, limit);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

r.get("/requests", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const { limit } = SellerPagingQuery.parse(req.query);
    const result = await sellerDashboardRepo.listPartnerWithdrawRequests(userId, limit);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

r.get("/bookings", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const query = SellerBookingsQuery.parse(req.query);
    const result = await sellerDashboardRepo.listPartnerBookings(userId, query, query.limit);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

r.get("/products", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const seller = await sellerDashboardRepo.getPartnerBalance(userId);
    const sellerProfile = await sellerDashboardRepo.getPartnerProducts(userId);
    return res.json({
      ok: true,
      balance: seller,
      items: sellerProfile,
    });
  } catch (err) {
    next(err);
  }
});

r.post("/requests", async (req, res, next) => {
  try {
    const userId = requireSellerUserId(req, res);
    if (!userId) {
      return;
    }

    const payload = CreateSellerWithdrawRequestBody.parse(req.body);
    const result = await sellerDashboardRepo.createPartnerWithdrawRequest(userId, payload);
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

export default r;
