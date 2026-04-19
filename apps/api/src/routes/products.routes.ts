
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { ListingStatus, ListingType, ListingUnitType, Role } from "@prisma/client";
import { Router } from "express";
import auth from "../middlewares/auth.js";
import { requireRole } from "../middlewares/rbac.js";
import * as auditsRepo from "../repositories/audits.repo.js";
import { syncExpiredBookings } from "../repositories/booking-expiry.repo.js";
// Schema query untuk list
const ListQuery = z.object({
  type: z.nativeEnum(ListingType).optional(),
  sellerId: z.string().optional(),
  assignedOnly: z.union([z.literal("true"), z.literal("false")]).optional(),
  q: z.string().trim().optional(),
  active: z
    .union([z.literal("true"), z.literal("false")])
    .transform(v => (v === undefined ? undefined : v === "true"))
    .optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z
    .enum(["name:asc", "name:desc", "price:asc", "price:desc", "createdAt:desc", "createdAt:asc"])
    .default("createdAt:desc"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10)
});

// Schema body create/update
const CreateBody = z.object({
  sellerId: z.string().optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2),
  description: z.string().min(2).optional(),
  price: z.number().int().nonnegative(),
  active: z.boolean().default(true),
  type: z.nativeEnum(ListingType).default(ListingType.VILLA),
  unitType: z.nativeEnum(ListingUnitType).default(ListingUnitType.PER_NIGHT),
  locationText: z.string().min(2).default("Location TBD"),
  maxGuest: z.number().int().positive().default(1),
  imageUrl: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional()
});

const UpdateBody = CreateBody.omit({ sellerId: true }).partial().refine(
  data => Object.keys(data).length > 0,
  "At least one field is required"
);

const AvailabilityQuery = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const AvailabilityUpsertBody = z.object({
  items: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        stock: z.coerce.number().int().min(0),
        isAvailable: z.boolean(),
        priceOverride: z.coerce.number().int().nonnegative().nullable().optional(),
      })
    )
    .min(1),
});

const r = Router();
r.use(auth);

const listingSelect = {
  id: true,
  sellerId: true,
  slug: true,
  title: true,
  description: true,
  basePrice: true,
  type: true,
  unitType: true,
  status: true,
  locationText: true,
  maxGuest: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, url: true, altText: true, isPrimary: true, sortOrder: true }
  }
} as const;

function serializeListing(item: {
  id: string;
  sellerId: string;
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  type: ListingType;
  unitType: ListingUnitType;
  status: ListingStatus;
  locationText: string;
  maxGuest: number;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  images: Array<{ id: string; url: string; altText: string | null; isPrimary: boolean; sortOrder: number }>;
}) {
  const meta =
    item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {};

  const normalizedType =
    item.type === ListingType.VILLA
      ? "villa"
      : item.type === ListingType.JEEP
        ? "jeep"
        : item.type === ListingType.TRANSPORT
          ? "transport"
          : "dokumentasi";

  const normalizedUnit =
    item.unitType === ListingUnitType.PER_NIGHT
      ? "malam"
      : item.unitType === ListingUnitType.PER_DAY
        ? "rute"
        : item.unitType === ListingUnitType.PER_TRIP
          ? "rute"
          : "jam";

  return {
    id: item.id,
    sellerId: item.sellerId,
    slug: item.slug,
    name: item.title,
    description: item.description,
    price: item.basePrice,
    published: item.status === ListingStatus.APPROVED,
    active: item.status === ListingStatus.APPROVED,
    status: item.status,
    type: normalizedType,
    unit: normalizedUnit,
    unitType: item.unitType,
    location: item.locationText,
    locationText: item.locationText,
    maxGuest: item.maxGuest,
    maxOccupancy: item.maxGuest,
    trending: Boolean(meta.trending),
    rating: typeof meta.rating === "number" ? meta.rating : undefined,
    metadata: item.metadata,
    images: item.images.map((image) => image.url),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function parseDateOnlyInput(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Tanggal availability tidak valid.") as Error & { status?: number };
    error.status = 400;
    throw error;
  }
  return date;
}

function getMonthRange(monthValue: string | undefined) {
  const now = new Date();
  const [year, month] = (monthValue ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`)
    .split("-")
    .map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function serializeAvailabilityItem(item: {
  id: string;
  date: Date;
  stock: number;
  reservedCount: number;
  isAvailable: boolean;
  priceOverride: number | null;
  updatedAt: Date;
}) {
  const remainingStock = Math.max(0, item.stock - item.reservedCount);
  const soldOut = remainingStock <= 0;

  return {
    id: item.id,
    date: item.date.toISOString().slice(0, 10),
    stock: item.stock,
    reservedCount: item.reservedCount,
    remainingStock,
    isAvailable: item.isAvailable && !soldOut,
    soldOut,
    priceOverride: item.priceOverride,
    updatedAt: item.updatedAt,
  };
}

async function findListingId(idOrSlug: string) {
  const listing = await prisma.listing.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  return listing?.id ?? null;
}

async function resolveSellerId(requestedSellerId: string | undefined, userId: string | undefined) {
  if (requestedSellerId) {
    const seller = await prisma.sellerProfile.findUnique({ where: { id: requestedSellerId }, select: { id: true } });
    return seller?.id ?? null;
  }
  if (!userId) return null;
  const seller = await prisma.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
  return seller?.id ?? null;
}

/**
 * GET /api/products
 * Query: q, active, minPrice, maxPrice, sort, page, pageSize
 * Response: pagination standar + items
 */
r.get("/", async (req, res, next) => {
  try {
    const q = ListQuery.parse(req.query);
    const isPrivileged =
      req.user?.role === Role.ADMIN ||
      req.user?.role === Role.SUPER_ADMIN ||
      req.user?.role === Role.SELLER;
    const ownSellerId =
      req.user?.role === Role.SELLER ? await resolveSellerId(undefined, req.user.id) : null;
    const sellerScope =
      q.assignedOnly === "true" && ownSellerId
        ? ownSellerId
        : q.sellerId ?? undefined;

    const where = {
      ...(q.q
        ? {
            OR: [
              { title: { contains: q.q, mode: "insensitive" as const } },
              { slug: { contains: q.q, mode: "insensitive" as const } },
              { description: { contains: q.q, mode: "insensitive" as const } },
              { locationText: { contains: q.q, mode: "insensitive" as const } }
            ]
          }
        : {}),
      ...(sellerScope ? { sellerId: sellerScope } : {}),
      ...(q.type !== undefined ? { type: q.type } : {}),
      ...(typeof q.active === "boolean"
        ? q.active
          ? { status: ListingStatus.APPROVED }
          : { status: { not: ListingStatus.APPROVED } }
        : isPrivileged
          ? {}
          : { status: { not: ListingStatus.ARCHIVED } }),
      ...(q.minPrice !== undefined || q.maxPrice !== undefined
        ? {
            basePrice: {
              ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
              ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {})
            }
          }
        : {})
    };

    const [sortFieldRaw, sortDir] = q.sort.split(":") as ["name" | "price" | "createdAt", "asc" | "desc"];
    const sortField = sortFieldRaw === "name" ? "title" : sortFieldRaw === "price" ? "basePrice" : "createdAt";
    const skip = (q.page - 1) * q.pageSize;
    const take = q.pageSize;

    const [total, items] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take,
        select: listingSelect
      })
    ]);

    res.setHeader("Cache-Control", "public, max-age=15");
    return res.json({
      ok: true,
      page: q.page,
      pageSize: q.pageSize,
      total,
      items: items.map(serializeListing)
    });
  } catch (err) {
    next(err);
  }
});

r.get("/:idOrSlug/availability/public", async (req, res, next) => {
  try {
    await syncExpiredBookings();

    const listingId = await findListingId(req.params.idOrSlug);
    if (!listingId) return res.status(404).json({ error: "Product not found" });

    const query = AvailabilityQuery.parse(req.query);
    const { start, end } = getMonthRange(query.month);
    const items = await prisma.listingAvailability.findMany({
      where: {
        listingId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        stock: true,
        reservedCount: true,
        isAvailable: true,
        priceOverride: true,
        updatedAt: true,
      },
    });

    return res.json({
      ok: true,
      month: query.month ?? start.toISOString().slice(0, 7),
      items: items.map(serializeAvailabilityItem),
    });
  } catch (err) {
    next(err);
  }
});

r.get("/:idOrSlug/availability", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const listingId = await findListingId(req.params.idOrSlug);
    if (!listingId) return res.status(404).json({ error: "Product not found" });

    const query = AvailabilityQuery.parse(req.query);
    const { start, end } = getMonthRange(query.month);
    const items = await prisma.listingAvailability.findMany({
      where: {
        listingId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        stock: true,
        reservedCount: true,
        isAvailable: true,
        priceOverride: true,
        updatedAt: true,
      },
    });

    return res.json({
      ok: true,
      month: query.month ?? start.toISOString().slice(0, 7),
      items: items.map(serializeAvailabilityItem),
    });
  } catch (err) {
    next(err);
  }
});

r.put("/:idOrSlug/availability", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const listingId = await findListingId(req.params.idOrSlug);
    if (!listingId) return res.status(404).json({ error: "Product not found" });

    const body = AvailabilityUpsertBody.parse(req.body);
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { basePrice: true },
    });
    if (!listing) return res.status(404).json({ error: "Product not found" });

    const existingItems = await prisma.listingAvailability.findMany({
      where: {
        listingId,
        date: {
          in: body.items.map((item) => parseDateOnlyInput(item.date)),
        },
      },
      select: {
        date: true,
        reservedCount: true,
      },
    });
    const existingByDate = new Map(existingItems.map((item) => [item.date.toISOString().slice(0, 10), item.reservedCount]));

    for (const item of body.items) {
      const reservedCount = existingByDate.get(item.date) ?? 0;
      if (item.stock < reservedCount) {
        return res.status(409).json({
          error: `Stock ${item.date} tidak boleh lebih kecil dari reserved ${reservedCount}.`,
        });
      }
    }

    await prisma.$transaction(
      body.items.map((item) => {
        if (item.stock < 0) {
          throw new Error("Stock tidak boleh negatif.");
        }

        const date = parseDateOnlyInput(item.date);
        return prisma.listingAvailability.upsert({
          where: {
            listingId_date: {
              listingId,
              date,
            },
          },
          create: {
            listingId,
            date,
            stock: item.stock,
            reservedCount: 0,
            isAvailable: item.isAvailable,
            basePrice: listing.basePrice,
            priceOverride: item.priceOverride ?? null,
          },
          update: {
            stock: item.stock,
            isAvailable: item.isAvailable,
            priceOverride: item.priceOverride ?? null,
            basePrice: listing.basePrice,
          },
        });
      })
    );

    return res.json({ ok: true, updatedCount: body.items.length });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/products/:idOrSlug
 */
r.get("/:idOrSlug", async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;
    const item = await prisma.listing.findFirst({
      where: {
        OR: [{ id: key }, { slug: key }]
      },
      select: listingSelect
    });
    if (!item) return res.status(404).json({ error: "Product not found" });
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.json({ ok: true, item: serializeListing(item) });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/products
 */
r.post("/", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const body = CreateBody.parse(req.body);
    const sellerId = await resolveSellerId(body.sellerId, req.user?.id);

    if (!sellerId) {
      return res.status(400).json({ error: "Seller profile is required to create a product" });
    }

    // Cegah slug duplikat
    const exists = await prisma.listing.findUnique({ where: { slug: body.slug } });
    if (exists) return res.status(409).json({ error: "Slug already exists" });

    const created = await prisma.listing.create({
      data: {
        sellerId,
        slug: body.slug,
        title: body.name,
        description: body.description ?? body.name,
        basePrice: body.price,
        status: body.active ? ListingStatus.APPROVED : ListingStatus.DRAFT,
        type: body.type,
        unitType: body.unitType,
        locationText: body.locationText,
        maxGuest: body.maxGuest,
        metadata: body.metadata ?? {},
        images: body.imageUrl
          ? {
              create: [
                {
                  url: body.imageUrl,
                  altText: body.name,
                  isPrimary: true,
                  sortOrder: 0,
                },
              ],
            }
          : undefined,
      },
      select: listingSelect
    });

    await auditsRepo.write({
      action: "LISTING_CREATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "LISTING",
      targetId: created.id,
      meta: {
        sellerId,
        slug: created.slug,
        status: created.status,
        type: created.type,
        unitType: created.unitType,
        price: created.basePrice,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.status(201).json({ ok: true, item: serializeListing(created) });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/products/:idOrSlug
 */
r.patch("/:idOrSlug", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;
    const body = UpdateBody.parse(req.body);

    const target = await prisma.listing.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      select: { id: true, slug: true }
    });
    if (!target) return res.status(404).json({ error: "Product not found" });

    if (body.slug && body.slug !== target.slug) {
      const slugExists = await prisma.listing.findUnique({ where: { slug: body.slug } });
      if (slugExists) return res.status(409).json({ error: "Slug already exists" });
    }

    const updated = await prisma.listing.update({
      where: { id: target.id },
      data: {
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.name !== undefined ? { title: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.price !== undefined ? { basePrice: body.price } : {}),
        ...(body.active !== undefined ? { status: body.active ? ListingStatus.APPROVED : ListingStatus.DRAFT } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.unitType !== undefined ? { unitType: body.unitType } : {}),
        ...(body.locationText !== undefined ? { locationText: body.locationText } : {}),
        ...(body.maxGuest !== undefined ? { maxGuest: body.maxGuest } : {}),
        ...(body.metadata !== undefined ? { metadata: body.metadata } : {})
      },
      select: listingSelect
    });

    if (body.imageUrl) {
      await prisma.listingImage.deleteMany({ where: { listingId: target.id } });
      await prisma.listingImage.create({
        data: {
          listingId: target.id,
          url: body.imageUrl,
          altText: body.name ?? updated.title,
          isPrimary: true,
          sortOrder: 0,
        },
      });
    }

    const hydrated = await prisma.listing.findUnique({
      where: { id: target.id },
      select: listingSelect,
    });

    await auditsRepo.write({
      action: "LISTING_UPDATED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "LISTING",
      targetId: target.id,
      meta: {
        slugBefore: target.slug,
        changedFields: Object.keys(body),
        nextStatus: hydrated?.status ?? updated.status,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item: serializeListing(hydrated ?? updated) });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/products/:idOrSlug
 * Soft-delete ala â€œactive=falseâ€ biar historis aman.
 */
r.delete("/:idOrSlug", requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const key = req.params.idOrSlug;
    const target = await prisma.listing.findFirst({
      where: { OR: [{ id: key }, { slug: key }] },
      select: { id: true }
    });
    if (!target) return res.status(404).json({ error: "Product not found" });

    const updated = await prisma.listing.update({
      where: { id: target.id },
      data: { status: ListingStatus.ARCHIVED },
      select: listingSelect
    });

    await auditsRepo.write({
      action: "LISTING_ARCHIVED",
      actorId: req.user?.id ?? null,
      actorRole: req.user?.role ?? null,
      targetType: "LISTING",
      targetId: updated.id,
      meta: {
        slug: updated.slug,
        status: updated.status,
      },
      ipAddress: req.ip ?? null,
      userAgent: req.get("user-agent") ?? null,
    });

    return res.json({ ok: true, item: serializeListing(updated) });
  } catch (err) {
    next(err);
  }
});

export default r;











