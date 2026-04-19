import { z } from "zod";

export const Range = z.object({
  from: z.string().optional(), // ISO
  to: z.string().optional()
});

export const AdminOverviewQuery = Range;

export const PartnerReportParams = z.object({
  partnerId: z.string().min(1)
});

export const AffiliateReportParams = z.object({
  affiliateId: z.string().min(1)
});









