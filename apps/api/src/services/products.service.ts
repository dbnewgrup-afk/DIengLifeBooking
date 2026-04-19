import { z } from "zod";
import { AppError } from "../lib/errors.js";
import {
  listProducts, getProductByIdOrSlug, createProduct, updateProduct
} from "../repositories/products.repo.js";

export const ProductSort = z.enum([
  "name:asc","name:desc","price:asc","price:desc","createdAt:asc","createdAt:desc"
]).default("createdAt:desc");

export const ListProductsQuery = z.object({
  q: z.string().trim().optional(),
  active: z.union([z.literal("true"), z.literal("false")])
    .transform(v => (v === undefined ? undefined : v === "true"))
    .optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: ProductSort.optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
});

export const CreateProductBody = z.object({
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  price: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  metadata: z.record(z.any()).optional()
});

export const UpdateProductBody = CreateProductBody.partial().refine(
  d => Object.keys(d).length > 0,
  "At least one field is required"
);

export async function svcListProducts(qs: unknown) {
  const q = ListProductsQuery.parse(qs);
  return listProducts({
    filter: { q: q.q, active: q.active, minPrice: q.minPrice, maxPrice: q.maxPrice },
    sort: (q.sort || "createdAt:desc") as any,
    page: q.page, pageSize: q.pageSize
  });
}

export async function svcGetProduct(idOrSlug: string) {
  const item = await getProductByIdOrSlug(idOrSlug);
  if (!item) throw new AppError(404, "Product not found");
  return item;
}

export async function svcCreateProduct(body: unknown) {
  const data = CreateProductBody.parse(body);
  const exists = await getProductByIdOrSlug(data.slug);
  if (exists) throw new AppError(409, "Slug already exists");
  return createProduct(data);
}

export async function svcUpdateProduct(idOrSlug: string, body: unknown) {
  const data = UpdateProductBody.parse(body);
  const current = await getProductByIdOrSlug(idOrSlug);
  if (!current) throw new AppError(404, "Product not found");
  if (data.slug && data.slug !== current.slug) {
    const dupe = await getProductByIdOrSlug(data.slug);
    if (dupe) throw new AppError(409, "Slug already exists");
  }
  return updateProduct(current.id, data);
}

export async function svcSoftDeleteProduct(idOrSlug: string) {
  const current = await getProductByIdOrSlug(idOrSlug);
  if (!current) throw new AppError(404, "Product not found");
  return updateProduct(current.id, { active: false });
}









