import { z } from "zod";

export const CloseOpenRequestBody = z.object({
  action: z.enum(["CLOSE", "OPEN"]),
  period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  note: z.string().max(200).optional()
});

export const ApproveQuery = z.object({
  id: z.string().min(1)
});









