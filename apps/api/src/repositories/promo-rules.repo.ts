import { ListingType, PromoCategory } from "@prisma/client";
import prisma from "../lib/db.js";

const categoryMap: Record<ListingType, PromoCategory> = {
  VILLA: PromoCategory.VILLA,
  JEEP: PromoCategory.JEEP,
  TRANSPORT: PromoCategory.RENT,
  PHOTOGRAPHER: PromoCategory.DOKUMENTASI,
};

function parseDiscountValue(discount: string, amount: number) {
  const normalized = discount.trim().toUpperCase().replace(/\s+/g, "");

  if (normalized.endsWith("%")) {
    const value = Number(normalized.replace("%", ""));
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.min(amount, Math.round((amount * value) / 100));
  }

  const numeric = Number(normalized.replace(/[^\d]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.min(amount, numeric);
}

export async function resolvePromoForListing(input: {
  code: string;
  listingType: ListingType;
  subtotal: number;
}) {
  const promo = await prisma.promoPackage.findFirst({
    where: {
      code: input.code.trim().toUpperCase(),
      isActive: true,
      expiresAt: { gt: new Date() },
      category: { in: [PromoCategory.SEMUA, categoryMap[input.listingType]] },
    },
    select: {
      id: true,
      code: true,
      title: true,
      discount: true,
      category: true,
      expiresAt: true,
    },
  });

  if (!promo) {
    return null;
  }

  const discountAmount = parseDiscountValue(promo.discount, input.subtotal);

  return {
    id: promo.id,
    code: promo.code,
    title: promo.title,
    discountLabel: promo.discount,
    discountAmount,
    expiresAt: promo.expiresAt,
    category: promo.category,
  };
}

