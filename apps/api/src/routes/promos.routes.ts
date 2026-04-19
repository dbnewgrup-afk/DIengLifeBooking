import { PromoCategory } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import { prisma } from "../lib/db.js";
import * as auditsRepo from "../repositories/audits.repo.js";

const r = Router();
let promoMediaColumnsCache: { imageUrl: boolean; terms: boolean } | null = null;

const promoBody = z.object({
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(2),
  code: z.string().trim().min(3).max(50),
  description: z.string().trim().min(4),
  discount: z.string().trim().min(2),
  badge: z.string().trim().max(40).optional(),
  imageUrl: z.string().trim().min(1).optional(),
  terms: z.string().trim().min(4).max(1500).optional(),
  href: z.string().trim().min(1),
  category: z.nativeEnum(PromoCategory),
  expiresAt: z.string().datetime(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const promoPatchBody = promoBody.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

function serializePromo(item: {
  id: string;
  slug: string;
  title: string;
  code: string;
  description: string;
  discount: string;
  badge: string | null;
  imageUrl: string | null;
  terms: string | null;
  href: string;
  category: PromoCategory;
  expiresAt: Date;
  isActive?: boolean;
  sortOrder?: number;
  updatedAt?: Date;
}) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    code: item.code,
    description: item.description,
    discount: item.discount,
    badge: item.badge ?? undefined,
    imageUrl: item.imageUrl ?? undefined,
    terms: item.terms ?? undefined,
    href: item.href,
    category:
      item.category === PromoCategory.VILLA
        ? "villa"
        : item.category === PromoCategory.JEEP
          ? "jeep"
          : item.category === PromoCategory.RENT
            ? "rent"
            : item.category === PromoCategory.DOKUMENTASI
              ? "dokumentasi"
              : "semua",
    categoryKey: item.category,
    until: item.expiresAt.toISOString(),
    isActive: item.isActive ?? true,
    sortOrder: item.sortOrder ?? 0,
    updatedAt: item.updatedAt?.toISOString(),
  };
}

async function getPromoMediaColumns() {
  if (promoMediaColumnsCache) return promoMediaColumnsCache;

  const [imageUrlRows, termsRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ Field: string }>>("SHOW COLUMNS FROM `PromoPackage` LIKE 'imageUrl'"),
    prisma.$queryRawUnsafe<Array<{ Field: string }>>("SHOW COLUMNS FROM `PromoPackage` LIKE 'terms'"),
  ]);

  promoMediaColumnsCache = {
    imageUrl: imageUrlRows.length > 0,
    terms: termsRows.length > 0,
  };

  return promoMediaColumnsCache;
}

r.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const promoMediaColumns = await getPromoMediaColumns();
    const items = await prisma.promoPackage.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { expiresAt: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        code: true,
        description: true,
        discount: true,
        badge: true,
        href: true,
        category: true,
        expiresAt: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
        ...(promoMediaColumns.imageUrl ? { imageUrl: true } : {}),
        ...(promoMediaColumns.terms ? { terms: true } : {}),
      },
    });

    return res.json({
      ok: true,
      items: items.map((item) =>
        serializePromo({
          ...item,
          imageUrl: "imageUrl" in item ? item.imageUrl ?? null : null,
          terms: "terms" in item ? item.terms ?? null : null,
        })
      ),
    });
  } catch (err) {
    next(err);
  }
});

r.post("/", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const body = promoBody.parse(req.body);
    const code = body.code.trim().toUpperCase();
    const promoMediaColumns = await getPromoMediaColumns();
    const exists = await prisma.promoPackage.findFirst({
      where: {
        OR: [{ code }, { slug: body.slug }],
      },
      select: { id: true },
    });

    if (exists) {
      return res.status(409).json({ error: "Promo code atau slug sudah dipakai" });
    }

    const created = await prisma.promoPackage.create({
      data: {
        slug: body.slug,
        title: body.title,
        code,
        description: body.description,
        discount: body.discount,
        badge: body.badge ?? null,
        href: body.href,
        category: body.category,
        expiresAt: new Date(body.expiresAt),
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        ...(promoMediaColumns.imageUrl ? { imageUrl: body.imageUrl ?? null } : {}),
        ...(promoMediaColumns.terms ? { terms: body.terms ?? null } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        code: true,
        description: true,
        discount: true,
        badge: true,
        href: true,
        category: true,
        expiresAt: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
        ...(promoMediaColumns.imageUrl ? { imageUrl: true } : {}),
        ...(promoMediaColumns.terms ? { terms: true } : {}),
      },
    });

    await auditsRepo.write({
      action: "PROMO_CREATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "PROMO",
      targetId: created.id,
      meta: {
        code: created.code,
        slug: created.slug,
        category: created.category,
        isActive: created.isActive,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.status(201).json({
      ok: true,
      item: serializePromo({
        ...created,
        imageUrl: "imageUrl" in created ? created.imageUrl ?? null : null,
        terms: "terms" in created ? created.terms ?? null : null,
      }),
    });
  } catch (err) {
    next(err);
  }
});

r.patch("/:id", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const body = promoPatchBody.parse(req.body);
    const promoMediaColumns = await getPromoMediaColumns();
    const existing = await prisma.promoPackage.findUnique({
      where: { id: req.params.id },
      select: { id: true, code: true, slug: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Promo tidak ditemukan" });
    }

    const nextCode = body.code?.trim().toUpperCase();
    if (nextCode || body.slug) {
      const duplicate = await prisma.promoPackage.findFirst({
        where: {
          id: { not: existing.id },
          OR: [
            ...(nextCode ? [{ code: nextCode }] : []),
            ...(body.slug ? [{ slug: body.slug }] : []),
          ],
        },
        select: { id: true },
      });

      if (duplicate) {
        return res.status(409).json({ error: "Promo code atau slug sudah dipakai" });
      }
    }

    const updated = await prisma.promoPackage.update({
      where: { id: existing.id },
      data: {
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(nextCode !== undefined ? { code: nextCode } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.discount !== undefined ? { discount: body.discount } : {}),
        ...(body.badge !== undefined ? { badge: body.badge ?? null } : {}),
        ...(body.href !== undefined ? { href: body.href } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.expiresAt !== undefined ? { expiresAt: new Date(body.expiresAt) } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(promoMediaColumns.imageUrl && body.imageUrl !== undefined ? { imageUrl: body.imageUrl ?? null } : {}),
        ...(promoMediaColumns.terms && body.terms !== undefined ? { terms: body.terms ?? null } : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        code: true,
        description: true,
        discount: true,
        badge: true,
        href: true,
        category: true,
        expiresAt: true,
        isActive: true,
        sortOrder: true,
        updatedAt: true,
        ...(promoMediaColumns.imageUrl ? { imageUrl: true } : {}),
        ...(promoMediaColumns.terms ? { terms: true } : {}),
      },
    });

    await auditsRepo.write({
      action: "PROMO_UPDATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "PROMO",
      targetId: updated.id,
      meta: {
        previousCode: existing.code,
        previousSlug: existing.slug,
        changedFields: Object.keys(body),
        nextIsActive: updated.isActive,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({
      ok: true,
      item: serializePromo({
        ...updated,
        imageUrl: "imageUrl" in updated ? updated.imageUrl ?? null : null,
        terms: "terms" in updated ? updated.terms ?? null : null,
      }),
    });
  } catch (err) {
    next(err);
  }
});

r.delete("/:id", auth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const existing = await prisma.promoPackage.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Promo tidak ditemukan" });
    }

    await prisma.promoPackage.update({
      where: { id: existing.id },
      data: { isActive: false },
    });

    await auditsRepo.write({
      action: "PROMO_DEACTIVATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "PROMO",
      targetId: existing.id,
      meta: {},
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default r;
