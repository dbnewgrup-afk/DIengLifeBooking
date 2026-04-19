import { DashboardAudience } from "@prisma/client";
import { z } from "zod";

const optionalDateTime = z
  .string()
  .trim()
  .datetime({ offset: true })
  .optional()
  .nullable();

export const DashboardNoticeParams = z.object({
  id: z.string().trim().min(1),
});

const dashboardNoticeBase = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(5000),
  audience: z.nativeEnum(DashboardAudience),
  ctaLabel: z.string().trim().max(80).optional().nullable(),
  ctaHref: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: optionalDateTime,
  endsAt: optionalDateTime,
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

function addDashboardNoticeRefinements<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) {
  return schema.superRefine((value, ctx) => {
    if ((value.ctaLabel && !value.ctaHref) || (!value.ctaLabel && value.ctaHref)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: value.ctaLabel ? ["ctaHref"] : ["ctaLabel"],
        message: "CTA label dan CTA href harus diisi berpasangan.",
      });
    }

    if (value.startsAt && value.endsAt) {
      const startsAt = new Date(value.startsAt);
      const endsAt = new Date(value.endsAt);
      if (startsAt.getTime() > endsAt.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endsAt"],
          message: "Waktu selesai harus lebih besar dari waktu mulai.",
        });
      }
    }
  });
}

export const DashboardNoticeBody = addDashboardNoticeRefinements(dashboardNoticeBase);

export const DashboardNoticeUpdateBody = addDashboardNoticeRefinements(
  dashboardNoticeBase.partial()
).refine(
  (value) => Object.keys(value).length > 0,
  { message: "Minimal satu field control notice harus dikirim." }
);

export const DashboardNoticeListQuery = z.object({
  includeInactive: z.coerce.boolean().optional().default(true),
});
