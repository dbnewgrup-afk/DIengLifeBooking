import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
// apps/api/src/routes/approvals.routes.ts

import { z } from "zod";
import { ListingStatus, ReviewStatus, SellerStatus, WithdrawStatus } from "@prisma/client";
import prisma from "../lib/db.js";
import { approveBatch, completeBatch, listBatches, rejectBatch } from "../repositories/payouts.repo.js";

const r = Router();

const ApprovalActionParams = z.object({
  id: z.string().trim().min(1),
  action: z.enum(["approve", "reject", "complete"]),
});

const ApprovalActionBody = z.object({
  type: z.enum(["SELLER", "LISTING", "PAYOUT", "AFFILIATE_WITHDRAW", "REVIEW"]),
  note: z.string().trim().max(200).optional(),
});

// List approval inbox from real pending operational records
r.get("/", async (_req, res, next) => {
  try {
    const [pendingSellers, pendingListings, payoutBatches, pendingAffiliateWithdraws, pendingReviews] = await Promise.all([
      prisma.sellerProfile.findMany({
        where: { status: SellerStatus.PENDING_REVIEW },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.listing.findMany({
        where: { status: ListingStatus.PENDING_REVIEW },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
          seller: { select: { displayName: true } },
        },
      }),
      listBatches({ page: 1, pageSize: 50 }),
      prisma.affiliateWithdraw.findMany({
        where: { status: WithdrawStatus.PENDING },
        orderBy: { requestedAt: "desc" },
        select: {
          id: true,
          amount: true,
          requestedAt: true,
          accountName: true,
          bankName: true,
          bankCode: true,
          affiliate: {
            select: {
              displayName: true,
              code: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        where: { status: ReviewStatus.FLAGGED },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          listing: {
            select: {
              title: true,
            },
          },
          booking: {
            select: {
              code: true,
            },
          },
        },
      }),
    ]);

    const payoutItems = payoutBatches.items
      .filter((batch) => batch.status === "DRAFT" || batch.status === "APPROVED" || batch.status === "PROCESSING")
      .map((batch) => ({
        id: batch.id,
        code: batch.code,
        type: "PAYOUT",
        reason: batch.note || "Menunggu review payout batch",
        by: "Sistem payout",
        createdAt: batch.createdAt,
        status: batch.status === "DRAFT" ? "PENDING" : batch.status,
      }));

    const affiliateWithdrawItems = pendingAffiliateWithdraws.map((withdraw) => ({
      id: withdraw.id,
      code: `AFF-WD-${withdraw.id.slice(0, 8).toUpperCase()}`,
      type: "AFFILIATE_WITHDRAW",
      reason: `Withdraw ${withdraw.affiliate.code} ke ${withdraw.bankName ?? withdraw.bankCode} a/n ${withdraw.accountName} sebesar Rp${withdraw.amount.toLocaleString("id-ID")}`,
      by: withdraw.affiliate.displayName,
      createdAt: withdraw.requestedAt.toISOString(),
      status: "PENDING",
    }));

    const reviewItems = pendingReviews.map((review) => ({
      id: review.id,
      code: `REV-${review.booking.code}`,
      type: "REVIEW",
      reason: `${review.listing.title} • rating ${review.rating}/5 • ${review.comment.slice(0, 72)}${review.comment.length > 72 ? "..." : ""}`,
      by: review.user.name || review.user.email,
      createdAt: review.createdAt.toISOString(),
      status: "PENDING",
    }));

    const items = [
      ...pendingSellers.map((seller) => ({
        id: seller.id,
        code: seller.user.email,
        type: "SELLER",
        reason: `Verifikasi seller ${seller.displayName}`,
        by: seller.user.name || seller.user.email,
        createdAt: seller.createdAt.toISOString(),
        status: "PENDING",
      })),
      ...pendingListings.map((listing) => ({
        id: listing.id,
        code: listing.id.slice(0, 8).toUpperCase(),
        type: "LISTING",
        reason: `${listing.title} (${listing.type})`,
        by: listing.seller.displayName,
        createdAt: listing.createdAt.toISOString(),
        status: "PENDING",
      })),
      ...payoutItems,
      ...affiliateWithdrawItems,
      ...reviewItems,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      ok: true,
      items,
      page: 1,
      pageSize: items.length || 10,
      total: items.length,
    });
  } catch (error) {
    next(error);
  }
});

r.post("/", (_req, res) => {
  return res.status(405).json({
    error:
      "Membuat approval manual lewat endpoint ini tidak didukung. Gunakan resource approval nyata yang otomatis muncul dari seller, listing, payout, atau affiliate withdraw.",
  });
});

r.post("/:id/:action", async (req, res, next) => {
  try {
    const { id, action } = ApprovalActionParams.parse(req.params);
    const { type, note } = ApprovalActionBody.parse(req.body);
    const actorId = req.user?.id ?? null;
    const actorRole = req.user?.role ?? null;

    if (type === "SELLER") {
      const seller = await prisma.sellerProfile.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!seller) {
        return res.status(404).json({ error: "Seller approval tidak ditemukan." });
      }

      const nextStatus =
        action === "approve" ? SellerStatus.ACTIVE : SellerStatus.REJECTED;

      await prisma.$transaction(async (tx) => {
        await tx.sellerProfile.update({
          where: { id },
          data: { status: nextStatus },
        });

        await tx.audit.create({
          data: {
            actorId,
            actorRole,
            action: action === "approve" ? "APPROVAL_APPROVE" : "APPROVAL_REJECT",
            targetType: "SELLER",
            targetId: id,
            meta: {
              type,
              previousStatus: seller.status,
              nextStatus,
              note: note ?? null,
            },
          },
        });
      });

      return res.json({ ok: true, item: { id, type, status: nextStatus } });
    }

    if (type === "LISTING") {
      const listing = await prisma.listing.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!listing) {
        return res.status(404).json({ error: "Listing approval tidak ditemukan." });
      }

      const nextStatus =
        action === "approve" ? ListingStatus.APPROVED : ListingStatus.REJECTED;

      await prisma.$transaction(async (tx) => {
        await tx.listing.update({
          where: { id },
          data: {
            status: nextStatus,
            publishedAt: action === "approve" ? new Date() : null,
          },
        });

        await tx.audit.create({
          data: {
            actorId,
            actorRole,
            action: action === "approve" ? "APPROVAL_APPROVE" : "APPROVAL_REJECT",
            targetType: "LISTING",
            targetId: id,
            meta: {
              type,
              previousStatus: listing.status,
              nextStatus,
              note: note ?? null,
            },
          },
        });
      });

      return res.json({ ok: true, item: { id, type, status: nextStatus } });
    }

    if (type === "PAYOUT") {
      const batch =
        action === "approve"
          ? await approveBatch(id, { actorId: actorId || "SYSTEM" })
          : action === "complete"
            ? await completeBatch(id, { actorId: actorId || "SYSTEM", note })
            : await rejectBatch(id, { actorId: actorId || "SYSTEM", note });

      if (!batch) {
        return res.status(404).json({ error: "Payout approval tidak ditemukan." });
      }

      await prisma.audit.create({
        data: {
          actorId,
          actorRole,
          action:
            action === "approve"
              ? "APPROVAL_APPROVE"
              : action === "complete"
                ? "APPROVAL_COMPLETE"
                : "APPROVAL_REJECT",
          targetType: "PAYOUT",
          targetId: id,
          meta: {
            type,
            note: note ?? null,
            batchCode: batch.code,
            batchStatus: batch.status,
          },
        },
      });

      return res.json({ ok: true, item: { id, type, status: batch.status } });
    }

    if (type === "AFFILIATE_WITHDRAW") {
      const withdraw = await prisma.affiliateWithdraw.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          amount: true,
          affiliate: {
            select: {
              code: true,
              displayName: true,
            },
          },
        },
      });

      if (!withdraw) {
        return res.status(404).json({ error: "Withdraw affiliate tidak ditemukan." });
      }

      if (withdraw.status !== WithdrawStatus.PENDING) {
        return res.status(409).json({ error: "Withdraw affiliate ini sudah diproses sebelumnya." });
      }

      const nextStatus =
        action === "approve" ? WithdrawStatus.APPROVED : WithdrawStatus.REJECTED;

      await prisma.$transaction(async (tx) => {
        await tx.affiliateWithdraw.update({
          where: { id },
          data: {
            status: nextStatus,
            approvedAt: action === "approve" ? new Date() : null,
            rejectedAt: action === "reject" ? new Date() : null,
            failureReason: action === "reject" ? note ?? "Rejected by admin" : null,
          },
        });

        await tx.audit.create({
          data: {
            actorId,
            actorRole,
            action: action === "approve" ? "APPROVAL_APPROVE" : "APPROVAL_REJECT",
            targetType: "AFFILIATE_WITHDRAW",
            targetId: id,
            meta: {
              type,
              affiliateCode: withdraw.affiliate.code,
              affiliateName: withdraw.affiliate.displayName,
              amount: withdraw.amount,
              previousStatus: withdraw.status,
              nextStatus,
              note: note ?? null,
            },
          },
        });
      });

      return res.json({ ok: true, item: { id, type, status: nextStatus } });
    }

    if (type === "REVIEW") {
      const review = await prisma.review.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          bookingId: true,
          listingId: true,
          rating: true,
        },
      });

      if (!review) {
        return res.status(404).json({ error: "Review tidak ditemukan." });
      }

      if (action === "complete") {
        return res.status(409).json({ error: "Review tidak punya aksi complete." });
      }

      const nextStatus = action === "approve" ? ReviewStatus.VISIBLE : ReviewStatus.HIDDEN;

      await prisma.$transaction(async (tx) => {
        await tx.review.update({
          where: { id },
          data: {
            status: nextStatus,
          },
        });

        await tx.audit.create({
          data: {
            actorId,
            actorRole,
            action: action === "approve" ? "APPROVAL_APPROVE" : "APPROVAL_REJECT",
            targetType: "REVIEW",
            targetId: id,
            meta: {
              type,
              previousStatus: review.status,
              nextStatus,
              bookingId: review.bookingId,
              listingId: review.listingId,
              rating: review.rating,
              note: note ?? null,
            },
          },
        });
      });

      return res.json({ ok: true, item: { id, type, status: nextStatus } });
    }

    return res.status(400).json({ error: "Tipe approval tidak dikenali." });
  } catch (error) {
    next(error);
  }
});

export default r;










