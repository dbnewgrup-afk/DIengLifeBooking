
import * as repo from "../repositories/payouts.repo.js";
import { z } from "zod";
import type { Request, Response, NextFunction } from 'express';
const CreateBatchBody = z.object({
  note: z.string().trim().max(255).optional(),
  items: z.array(
    z.object({
      partnerId: z.string().trim().min(1),
      amount: z.coerce.number().int().positive(),
    })
  ).min(1),
});

// GET /api/payouts/batch
export async function listBatches(_req: Request, res: Response) {
  const data = await repo.listBatches({ page: 1, pageSize: 10 });
  res.json({ ok: true, ...data });
}

// POST /api/payouts/batch
export async function createBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateBatchBody.parse(req.body);
    const batch = await repo.createBatch({
      note: body.note,
      items: body.items,
      actorId: req.user?.id || "SYSTEM",
    });
    res.status(201).json({ ok: true, data: batch, code: batch.code });
  } catch (e) {
    next(e);
  }
}

// POST /api/payouts/batch/:id/approve
export async function approveBatch(req: Request, res: Response) {
  const id = req.params.id;
  const batch = await repo.approveBatch(id, { actorId: req.user?.id || "SYSTEM" });
  res.json({ ok: true, batch });
}

// GET /api/payouts/batch/:id
export async function getBatch(req: Request, res: Response) {
  const id = req.params.id;
  const batch = await repo.getBatch(id);
  if (!batch) return res.status(404).json({ error: "Batch not found" });
  res.json({ ok: true, ...batch });
}










