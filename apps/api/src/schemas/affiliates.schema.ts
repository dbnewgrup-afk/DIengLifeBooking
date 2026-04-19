import { z } from "zod";

export const Paging = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
});

export const DateRange = z.object({
  from: z.string().optional(), // ISO date
  to: z.string().optional()    // ISO date
});

export const PerformanceQuery = Paging.merge(DateRange);

export const CreateLinkBody = z.object({
  code: z.string().min(3).regex(/^[a-z0-9-]+$/),
  target: z.string().url(),
  meta: z.record(z.any()).optional()
});









