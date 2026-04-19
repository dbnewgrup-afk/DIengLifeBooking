import { z } from "zod";

export const ProductSort = z.enum([
  "name:asc", "name:desc",
  "price:asc", "price:desc",
  "createdAt:asc", "createdAt:desc"
]).default("createdAt:desc");

export const ListProductsQuery = z.object({
  q: z.string().trim().optional(),
  active: z.union([z.literal("true"), z.literal("false")])
    .transform(v => (v === undefined ? undefined : v === "true"))
    .optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: ProductSort,
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const CreateProductBody = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  price: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

export const UpdateProductBody = CreateProductBody.partial().refine(
  d => Object.keys(d).length > 0,
  "At least one field is required"
);









