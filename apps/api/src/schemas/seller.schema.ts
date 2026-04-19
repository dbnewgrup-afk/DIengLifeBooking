import { z } from "zod";

export const SellerPagingQuery = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const SellerRangeQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const SellerBookingsQuery = SellerRangeQuery.extend({
  limit: z.coerce.number().int().positive().max(500).default(200),
});

export const CreateSellerWithdrawRequestBody = z.object({
  amount: z.coerce.number().int().positive(),
  target: z.object({
    bank: z.string().trim().min(2),
    accNo: z.string().trim().min(4),
    accName: z.string().trim().min(2),
  }),
});
