import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
// apps/api/src/routes/payouts.routes.ts

import auth, { requireRole } from "../middlewares/auth.js";
import { Role } from "@prisma/client";
import * as payoutsRepo from "../repositories/payouts.repo.js";
import * as auditsRepo from "../repositories/audits.repo.js";
import {
  ApproveBatchParams,
  CompleteBatchBody,
  CreateBatchBody,
  GetBatchParams,
  Paging,
} from "../schemas/payouts.schema.js";

const r = Router();

// List payout batches
r.get(
  "/batches",
  auth,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const paging = Paging.parse(req.query);
      const data = await payoutsRepo.listBatches({
        page: paging.page,
        pageSize: paging.pageSize,
      });
      res.json({ ok: true, ...data });
    } catch (err) {
      next(err);
    }
  }
);

// Create payout batch
r.post(
  "/batches",
  auth,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const body = CreateBatchBody.parse(req.body);
      const batch = await payoutsRepo.createBatch({
        note: body.note,
        items: body.items,
        actorId: req.user?.id || "SYSTEM",
      });

      await auditsRepo.write({
        action: "PAYOUT_BATCH_CREATED",
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        targetType: "PAYOUT_BATCH",
        targetId: batch.code,
        meta: {
          itemCount: body.items.length,
          totalAmount: batch.totalAmount,
          status: batch.status,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.status(201).json({ ok: true, data: batch, code: batch.code });
    } catch (err) {
      next(err);
    }
  }
);

// Get payout batch detail
r.get(
  "/batches/:id",
  auth,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { id } = GetBatchParams.parse(req.params);
      const batch = await payoutsRepo.getBatch(id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      res.json({ ok: true, ...batch });
    } catch (err) {
      next(err);
    }
  }
);

// Approve payout batch
r.post(
  "/batches/:id/approve",
  auth,
  requireRole(Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { id } = ApproveBatchParams.parse(req.params);
      const batch = await payoutsRepo.approveBatch(id, {
        actorId: req.user?.id || "SYSTEM",
      });
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      await auditsRepo.write({
        action: "PAYOUT_BATCH_APPROVED",
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        targetType: "PAYOUT_BATCH",
        targetId: id,
        meta: {
          status: batch.status,
          totalAmount: batch.totalAmount,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.json({ ok: true, data: batch });
    } catch (err) {
      next(err);
    }
  }
);

r.post(
  "/batches/:id/reject",
  auth,
  requireRole(Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { id } = ApproveBatchParams.parse(req.params);
      const batch = await payoutsRepo.rejectBatch(id, {
        actorId: req.user?.id || "SYSTEM",
      });
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      await auditsRepo.write({
        action: "PAYOUT_BATCH_REJECTED",
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        targetType: "PAYOUT_BATCH",
        targetId: id,
        meta: {
          status: batch.status,
          totalAmount: batch.totalAmount,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.json({ ok: true, data: batch });
    } catch (err) {
      next(err);
    }
  }
);

r.post(
  "/batches/:id/complete",
  auth,
  requireRole(Role.SUPER_ADMIN),
  async (req, res, next) => {
    try {
      const { id } = ApproveBatchParams.parse(req.params);
      const body = CompleteBatchBody.parse(req.body ?? {});
      const batch = await payoutsRepo.completeBatch(id, {
        actorId: req.user?.id || "SYSTEM",
        note: body.note,
        disbursementReference: body.disbursementReference,
      });
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      await auditsRepo.write({
        action: "PAYOUT_BATCH_COMPLETED",
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? null,
        targetType: "PAYOUT_BATCH",
        targetId: id,
        meta: {
          status: batch.status,
          totalAmount: batch.totalAmount,
          note: body.note ?? null,
          disbursementReference: body.disbursementReference ?? null,
        },
        ipAddress: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      res.json({ ok: true, data: batch });
    } catch (err) {
      next(err);
    }
  }
);

export default r;











