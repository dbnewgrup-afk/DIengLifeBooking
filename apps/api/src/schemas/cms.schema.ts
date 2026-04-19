import { z } from "zod";

export const HomepageSectionKeySchema = z.enum([
  "hero",
  "promo",
  "recommendations",
  "howTo",
  "reviews",
  "contact",
]);

export const HeroContentSchema = z.object({
  eyebrow: z.string().trim().min(2).max(60),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(300),
});

export const PromoContentSchema = z.object({
  title: z.string().trim().min(3).max(80),
  ctaLabel: z.string().trim().min(1).max(40),
  ctaHref: z.string().trim().min(1).max(120),
});

export const RecommendationSectionSchema = z.object({
  key: z.enum(["villa", "jeep", "transport", "dokumentasi"]),
  title: z.string().trim().min(2).max(80),
  enabled: z.boolean(),
});

export const RecommendationsContentSchema = z.object({
  title: z.string().trim().min(3).max(80),
  sections: z.array(RecommendationSectionSchema).length(4),
});

export const HowToContentSchema = z.object({
  title: z.string().trim().min(3).max(80),
  steps: z.array(z.string().trim().min(2).max(140)).min(3).max(6),
});

export const ReviewItemSchema = z.object({
  name: z.string().trim().min(2).max(40),
  text: z.string().trim().min(3).max(180),
  stars: z.number().int().min(1).max(5),
});

export const ReviewsContentSchema = z.object({
  title: z.string().trim().min(3).max(80),
  items: z.array(ReviewItemSchema).min(1).max(6),
});

export const ContactContentSchema = z.object({
  title: z.string().trim().min(3).max(80),
  supportTitle: z.string().trim().min(2).max(60),
  whatsappLabel: z.string().trim().min(3).max(40),
  whatsappHref: z.string().trim().min(8).max(160),
  emailLabel: z.string().trim().email(),
  hoursTitle: z.string().trim().min(2).max(60),
  hoursText: z.string().trim().min(2).max(120),
  officeTitle: z.string().trim().min(2).max(60),
  officeText: z.string().trim().min(2).max(180),
});

export const HomepageSectionContentSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("hero"), content: HeroContentSchema }),
  z.object({ key: z.literal("promo"), content: PromoContentSchema }),
  z.object({ key: z.literal("recommendations"), content: RecommendationsContentSchema }),
  z.object({ key: z.literal("howTo"), content: HowToContentSchema }),
  z.object({ key: z.literal("reviews"), content: ReviewsContentSchema }),
  z.object({ key: z.literal("contact"), content: ContactContentSchema }),
]);

export const UpdateHomepageSectionBody = z.object({
  draftContent: z.record(z.any()).optional(),
  isVisible: z.boolean().optional(),
});

export const HomepageSectionParams = z.object({
  key: HomepageSectionKeySchema,
});

export type HomepageSectionKey = z.infer<typeof HomepageSectionKeySchema>;
