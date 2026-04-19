import { z } from "zod";

export const Paging = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
  })
  .transform((value) => ({
    page: value.page,
    pageSize: value.limit ?? value.pageSize ?? 10,
  }));

export const CreateBatchItem = z.object({
  partnerId: z.string().trim().min(1),
  amount: z.coerce.number().int().positive(),
});

export const CreateBatchBody = z.object({
  note: z.string().trim().max(255).optional(),
  items: z.array(CreateBatchItem).min(1),
});

export const ApproveBatchParams = z.object({
  id: z.string().trim().min(1),
});

export const GetBatchParams = ApproveBatchParams;

export const CompleteBatchBody = z.object({
  note: z.string().trim().max(255).optional(),
  disbursementReference: z.string().trim().max(100).optional(),
});









