import { z } from "zod";

export const AffiliatePagingQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const AffiliateTrackClickBody = z.object({
  code: z.string().trim().min(2).max(64),
  landingPath: z.string().trim().max(500).optional().nullable(),
  referrer: z.string().trim().max(1000).optional().nullable(),
  visitorKey: z.string().trim().max(120).optional().nullable(),
  sessionKey: z.string().trim().max(120).optional().nullable(),
});

export const CreateAffiliateWithdrawRequestBody = z.object({
  amount: z.coerce.number().int().min(1_000_000, "Minimal withdraw affiliate adalah Rp1.000.000."),
  target: z.object({
    bank: z.string().trim().min(2),
    accNo: z.string().trim().min(4),
    accName: z.string().trim().min(2),
  }),
});
