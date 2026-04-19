import { BookingStatus, PaymentStatus, ReviewStatus, Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/db.js";
import auth, { requireRole } from "../middlewares/auth.js";
import * as auditsRepo from "../repositories/audits.repo.js";

const r = Router();

const reviewListQuery = z.object({
  limit: z.coerce.number().int().positive().max(50).default(12),
});

const createReviewBody = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(12).max(800),
});

const moderateReviewBody = z.object({
  status: z.nativeEnum(ReviewStatus),
  note: z.string().trim().max(255).optional(),
});

function serializePublicReview(item: {
  id: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: Date;
  user: { name: string };
  booking: { code: string; startDate: Date; endDate: Date };
}) {
  return {
    id: item.id,
    rating: item.rating,
    comment: item.comment,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    authorName: item.user.name,
    bookingCode: item.booking.code,
    stayStart: item.booking.startDate.toISOString().slice(0, 10),
    stayEnd: item.booking.endDate.toISOString().slice(0, 10),
  };
}

r.use(auth);

r.get("/listings/:listingId", async (req, res, next) => {
  try {
    const { limit } = reviewListQuery.parse(req.query);
    const listing = await prisma.listing.findFirst({
      where: {
        OR: [{ id: req.params.listingId }, { slug: req.params.listingId }],
      },
      select: { id: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing review tidak ditemukan." });
    }

    const [items, aggregate] = await Promise.all([
      prisma.review.findMany({
        where: {
          listingId: listing.id,
          status: ReviewStatus.VISIBLE,
        },
        orderBy: [{ createdAt: "desc" }],
        take: limit,
        select: {
          id: true,
          rating: true,
          comment: true,
          status: true,
          createdAt: true,
          user: { select: { name: true } },
          booking: {
            select: {
              code: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.review.aggregate({
        where: {
          listingId: listing.id,
          status: ReviewStatus.VISIBLE,
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return res.json({
      ok: true,
      summary: {
        averageRating: Number((aggregate._avg.rating ?? 0).toFixed(1)),
        totalReviews: aggregate._count._all,
      },
      items: items.map(serializePublicReview),
    });
  } catch (error) {
    next(error);
  }
});

r.post("/bookings/:bookingCode", requireRole(Role.USER), async (req, res, next) => {
  try {
    const body = createReviewBody.parse(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const booking = await prisma.booking.findUnique({
      where: { code: req.params.bookingCode },
      select: {
        id: true,
        code: true,
        userId: true,
        listingId: true,
        status: true,
        paymentStatus: true,
        review: {
          select: {
            id: true,
            status: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking untuk review tidak ditemukan." });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: "Booking ini bukan milik akun kamu." });
    }

    if (booking.status !== BookingStatus.COMPLETED || booking.paymentStatus !== PaymentStatus.PAID) {
      return res.status(409).json({ error: "Review hanya bisa dibuat untuk booking yang sudah selesai." });
    }

    if (booking.review) {
      return res.status(409).json({ error: "Booking ini sudah punya review." });
    }

    const created = await prisma.review.create({
      data: {
        bookingId: booking.id,
        userId,
        listingId: booking.listingId,
        rating: body.rating,
        comment: body.comment,
        status: ReviewStatus.FLAGGED,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        status: true,
        createdAt: true,
      },
    });

    await auditsRepo.write({
      action: "REVIEW_CREATED",
      actorId: userId,
      actorRole: req.user?.role ?? null,
      targetType: "REVIEW",
      targetId: created.id,
      meta: {
        bookingCode: booking.code,
        listingId: booking.listingId,
        status: created.status,
        rating: created.rating,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.status(201).json({
      ok: true,
      item: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
      message: "Review berhasil dikirim dan menunggu moderasi admin.",
    });
  } catch (error) {
    next(error);
  }
});

r.patch("/:id/moderate", requireRole(Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
  try {
    const body = moderateReviewBody.parse(req.body);
    const existing = await prisma.review.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        bookingId: true,
        listingId: true,
        rating: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Review tidak ditemukan." });
    }

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: { status: body.status },
      select: {
        id: true,
        status: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    await auditsRepo.write({
      action: "REVIEW_MODERATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "REVIEW",
      targetId: existing.id,
      meta: {
        bookingId: existing.bookingId,
        listingId: existing.listingId,
        rating: existing.rating,
        previousStatus: existing.status,
        nextStatus: body.status,
        note: body.note ?? null,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({
      ok: true,
      item: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default r;
