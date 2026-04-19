import { WebsiteReviewStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";

const r = Router();

const createBody = z.object({
  name: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(60).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(8).max(600),
  imageUrl: z.string().trim().min(1).optional(),
});

const patchBody = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    city: z.string().trim().min(2).max(60).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().trim().min(8).max(600).optional(),
    imageUrl: z.string().trim().min(1).optional().nullable(),
    status: z.nativeEnum(WebsiteReviewStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

function serializeReview(item: {
  id: string;
  userId: string | null;
  name: string;
  city: string | null;
  rating: number;
  comment: string;
  imageUrl: string | null;
  status: WebsiteReviewStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    userId: item.userId ?? undefined,
    name: item.name,
    city: item.city ?? undefined,
    rating: item.rating,
    comment: item.comment,
    imageUrl: item.imageUrl ?? undefined,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

r.get("/", async (req, res, next) => {
  try {
    const includePending = req.query.includePending === "true";
    const items = await prisma.websiteReview.findMany({
      where: includePending ? undefined : { status: WebsiteReviewStatus.APPROVED },
      orderBy: [{ createdAt: "desc" }],
      take: includePending ? 100 : 40,
    });

    return res.json({ ok: true, items: items.map(serializeReview) });
  } catch (err) {
    next(err);
  }
});

r.post("/", async (req, res, next) => {
  try {
    const body = createBody.parse(req.body);
    const created = await prisma.websiteReview.create({
      data: {
        userId: req.user?.id ?? null,
        name: body.name,
        city: body.city ?? null,
        rating: body.rating,
        comment: body.comment,
        imageUrl: body.imageUrl ?? null,
        status: WebsiteReviewStatus.PENDING,
      },
    });

    return res.status(201).json({
      ok: true,
      item: serializeReview(created),
      message: "Review berhasil dikirim dan menunggu persetujuan admin.",
    });
  } catch (err) {
    next(err);
  }
});

r.patch("/:id", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const body = patchBody.parse(req.body);
    const existing = await prisma.websiteReview.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Review tidak ditemukan" });
    }

    const updated = await prisma.websiteReview.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.rating !== undefined ? { rating: body.rating } : {}),
        ...(body.comment !== undefined ? { comment: body.comment } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
    });

    return res.json({ ok: true, item: serializeReview(updated) });
  } catch (err) {
    next(err);
  }
});

r.delete("/:id", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const existing = await prisma.websiteReview.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "Review tidak ditemukan" });
    }

    await prisma.websiteReview.delete({ where: { id: req.params.id } });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default r;
