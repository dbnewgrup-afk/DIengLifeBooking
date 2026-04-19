import { z } from "zod";
export const ProductTypeSchema = z.enum(["villa","jeep","transport","dokumentasi"]);
export const ProductListItemSchema = z.object({
  id: z.string(),
  type: ProductTypeSchema,
  slug: z.string(),
  name: z.string(),
  location: z.string().optional(),
  price: z.number(),
  unit: z.enum(["malam","jam","rute"]).optional(),
  rating: z.number().optional(),
  cover: z.string().url().optional(),
});
export const ProductListSchema = z.array(ProductListItemSchema);
export const PromoItemSchema = z.object({
  id: z.string(), title: z.string(), description: z.string(), href: z.string(), badge: z.string().optional()
});
export const PromoListSchema = z.array(PromoItemSchema);
