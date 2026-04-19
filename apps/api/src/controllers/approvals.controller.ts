
import { z } from "zod";
import type { Request, Response, NextFunction } from 'express';
const CloseOpenRequestBody = z.object({
  action: z.enum(["CLOSE", "OPEN"]),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  note: z.string().max(200).optional()
});

// GET /api/approvals
export async function list(_req: Request, res: Response) {
  // placeholder struktur tabel FE
  res.json({ ok: true, items: [], page: 1, pageSize: 10, total: 0 });
}

// POST /api/approvals
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CloseOpenRequestBody.parse(req.body);
    // TODO: simpan ke tabel approvals setelah schema dibuat
    res.status(201).json({ ok: true, request: body, status: "PENDING" });
  } catch (e) {
    next(e);
  }
}










