import { prisma } from "../lib/db.js";
import { Prisma } from '@prisma/client';

export type ProductFilter = {
  q?: string;
  active?: boolean;
  minPrice?: number;
  maxPrice?: number;
};

export type ProductSort =
  | "name:asc" | "name:desc"
  | "price:asc" | "price:desc"
  | "createdAt:asc" | "createdAt:desc";

export async function listProducts(opts: {
  filter?: ProductFilter;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
}) {
  const filter = opts.filter || {};
  const where: any = {};
  if (filter.q) {
    where.OR = [
      { name: { contains: filter.q, mode: "insensitive" } },
      { slug: { contains: filter.q, mode: "insensitive" } }
    ];
  }
  if (typeof filter.active === "boolean") where.active = filter.active;
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.price = {};
    if (filter.minPrice !== undefined) where.price.gte = filter.minPrice;
    if (filter.maxPrice !== undefined) where.price.lte = filter.maxPrice;
  }

  const [field, dir] = (opts.sort || "createdAt:desc").split(":");
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 10));
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { [field]: dir },
      skip,
      take: pageSize,
      select: {
        id: true, slug: true, name: true, price: true, active: true,
        createdAt: true, updatedAt: true, metadata: true
      }
    })
  ]);

  return { total, page, pageSize, items };
}

export async function getProductByIdOrSlug(idOrSlug: string) {
  return prisma.product.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: {
      id: true, slug: true, name: true, price: true, active: true,
      createdAt: true, updatedAt: true, metadata: true
    }
  });
}

export async function createProduct(data: {
  slug: string; name: string; price: number; active: boolean; metadata?: Record<string, any>;
}) {
  return prisma.product.create({
    data: {
      slug: data.slug,
      name: data.name,
      price: data.price,
      active: data.active,
      metadata: data.metadata ?? {}
    },
    select: {
      id: true, slug: true, name: true, price: true, active: true,
      createdAt: true, updatedAt: true, metadata: true
    }
  });
}

export async function updateProduct(id: string, data: Partial<{
  slug: string; name: string; price: number; active: boolean; metadata: Record<string, any>;
}>) {
  return prisma.product.update({
    where: { id },
    data: {
      slug: data.slug ?? undefined,
      name: data.name ?? undefined,
      price: data.price ?? undefined,
      active: data.active ?? undefined,
      metadata: data.metadata ?? undefined
    },
    select: {
      id: true, slug: true, name: true, price: true, active: true,
      createdAt: true, updatedAt: true, metadata: true
    }
  });
}










