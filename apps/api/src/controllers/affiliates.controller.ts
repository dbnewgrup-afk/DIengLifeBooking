
import * as repo from "../repositories/affiliates.repo.js";
import type { Request, Response, NextFunction } from 'express';
// GET /api/affiliates/performance
export async function performance(req: Request, res: Response) {
  const userId = req.user?.id || "ANON";
  const data = await repo.getAffiliatePerformance(userId);
  res.json({ ok: true, ...data });
}

// GET /api/affiliates/links
export async function links(req: Request, res: Response) {
  const userId = req.user?.id || "ANON";
  const data = await repo.getAffiliateLinks(userId);
  res.json({ ok: true, items: data.items });
}










