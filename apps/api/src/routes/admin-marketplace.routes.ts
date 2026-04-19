import { Router } from "express";
import { SellerStatus } from "@prisma/client";
import { z } from "zod";
import { env } from "../lib/env.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import * as auditsRepo from "../repositories/audits.repo.js";
import {
  deleteMarketplaceSeller,
  getAdminMarketplaceOverview,
  listMarketplaceProducts,
  listMarketplaceSellerOptions,
  listMarketplaceSellersSummary,
  listMarketplaceTransactions,
  seedMarketplaceDemoData,
  seedMarketplaceDemoProducts,
  seedMarketplaceDemoPromos,
  updateMarketplaceSeller,
} from "../repositories/marketplace-admin.repo.js";

const r = Router();
const sellerPatchBody = z
  .object({
    displayName: z.string().trim().min(2).max(120).optional(),
    ownerName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().optional(),
    status: z.nativeEnum(SellerStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Minimal satu field seller harus dikirim",
  });

const legacySeedEndpointsEnabled =
  env.nodeEnv !== "production" &&
  process.env.ENABLE_ADMIN_MARKETPLACE_SEED === "true";

r.use(auth, requireRole("ADMIN", "SUPER_ADMIN"));

r.get("/overview", async (_req, res, next) => {
  try {
    const overview = await getAdminMarketplaceOverview();
    return res.json({ ok: true, overview });
  } catch (error) {
    next(error);
  }
});

r.get("/products", async (_req, res, next) => {
  try {
    const items = await listMarketplaceProducts();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.get("/sellers", async (_req, res, next) => {
  try {
    const items = await listMarketplaceSellerOptions();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.get("/sellers-summary", async (_req, res, next) => {
  try {
    const items = await listMarketplaceSellersSummary();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.patch("/sellers/:id", async (req, res, next) => {
  try {
    const payload = sellerPatchBody.parse(req.body);
    const item = await updateMarketplaceSeller(req.params.id, payload);

    await auditsRepo.write({
      action: "SELLER_SUMMARY_UPDATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "SELLER",
      targetId: req.params.id,
      meta: {
        changedFields: Object.keys(payload),
        nextStatus: item?.status ?? null,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.delete("/sellers/:id", async (req, res, next) => {
  try {
    const item = await deleteMarketplaceSeller(req.params.id);

    await auditsRepo.write({
      action: "SELLER_SUMMARY_DEACTIVATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "SELLER",
      targetId: req.params.id,
      meta: {
        nextStatus: item?.status ?? null,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item });
  } catch (error) {
    next(error);
  }
});

r.get("/transactions", async (_req, res, next) => {
  try {
    const items = await listMarketplaceTransactions();
    return res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

r.post("/seed-demo", async (_req, res, next) => {
  try {
    if (!legacySeedEndpointsEnabled) {
      return res.status(404).json({ error: "Legacy seed endpoint is disabled" });
    }
    const result = await seedMarketplaceDemoData();
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

r.post("/seed-products", async (_req, res, next) => {
  try {
    if (!legacySeedEndpointsEnabled) {
      return res.status(404).json({ error: "Legacy seed endpoint is disabled" });
    }
    const result = await seedMarketplaceDemoProducts();
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

r.post("/seed-promos", async (_req, res, next) => {
  try {
    if (!legacySeedEndpointsEnabled) {
      return res.status(404).json({ error: "Legacy seed endpoint is disabled" });
    }
    const result = await seedMarketplaceDemoPromos();
    return res.status(201).json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default r;
