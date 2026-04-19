import bcrypt from "bcryptjs";
import {
  BookingStatus,
  ListingStatus,
  ListingType,
  ListingUnitType,
  PaymentStatus,
  PromoCategory,
  Role,
  SellerStatus,
  UserStatus,
} from "@prisma/client";
import prisma from "../lib/db.js";
import {
  getBookingCustomerSnapshot,
  parseBookingNotes,
} from "../utils/booking-notes.js";

// LEGACY DEV-ONLY SEED DATA
// These fixtures are intentionally kept out of the active admin flow and are
// only reachable through explicitly guarded seed endpoints.
const DEMO_PRODUCTS = [
  {
    slug: "villa-pinus-admin",
    title: "Villa Pinus Signature",
    type: ListingType.VILLA,
    unitType: ListingUnitType.PER_NIGHT,
    locationText: "Batu, Malang",
    basePrice: 1_850_000,
    maxGuest: 8,
    image: "/images/products/villa-aster.jpg",
    metadata: { rating: 4.8, trending: true },
  },
  {
    slug: "jeep-bromo-admin",
    title: "Jeep Bromo Sunrise Prime",
    type: ListingType.JEEP,
    unitType: ListingUnitType.PER_SESSION,
    locationText: "Bromo",
    basePrice: 650_000,
    maxGuest: 4,
    image: "/images/products/jeep-bromo-sunrise.jpg",
    metadata: { rating: 4.7, trending: true },
  },
  {
    slug: "rent-hiace-admin",
    title: "Hiace Dieng Private Trip",
    type: ListingType.TRANSPORT,
    unitType: ListingUnitType.PER_TRIP,
    locationText: "Dieng",
    basePrice: 1_250_000,
    maxGuest: 10,
    image: "/images/products/transport-sewa-elf.jpg",
    metadata: { rating: 4.6, trending: true },
  },
  {
    slug: "dokumentasi-couple-admin",
    title: "Dokumentasi Couple Outdoor",
    type: ListingType.PHOTOGRAPHER,
    unitType: ListingUnitType.PER_SESSION,
    locationText: "Dieng",
    basePrice: 950_000,
    maxGuest: 2,
    image: "/images/products/doc-prewedding-outdoor.jpg",
    metadata: { rating: 4.9, trending: true },
  },
] as const;

const DEMO_PROMOS = [
  {
    slug: "promo-villa-admin",
    title: "Promo Villa Admin 12%",
    code: "ADMNVILLA12",
    description: "Diskon 12% untuk testing transaksi villa di dashboard admin.",
    discount: "12%",
    imageUrl: "/images/products/villa-aster.jpg",
    terms: "Khusus booking villa tertentu. Tidak dapat digabung promo lain.",
    href: "/villa",
    category: PromoCategory.VILLA,
    sortOrder: 1,
  },
  {
    slug: "promo-jeep-admin",
    title: "Promo Jeep Admin 80K",
    code: "ADMNJEEP80",
    description: "Potongan Rp80.000 untuk testing transaksi jeep.",
    discount: "80000",
    imageUrl: "/images/products/jeep-bromo-sunrise.jpg",
    terms: "Khusus jeep sunrise. Kuota terbatas setiap hari.",
    href: "/jeep",
    category: PromoCategory.JEEP,
    sortOrder: 2,
  },
  {
    slug: "promo-rent-admin",
    title: "Promo Transport Admin 10%",
    code: "ADMNRENT10",
    description: "Diskon 10% untuk testing transaksi transport.",
    discount: "10%",
    imageUrl: "/images/products/transport-sewa-elf.jpg",
    terms: "Berlaku untuk rute transport yang dipilih admin.",
    href: "/rent",
    category: PromoCategory.RENT,
    sortOrder: 3,
  },
  {
    slug: "promo-doc-admin",
    title: "Promo Dokumentasi Admin 50K",
    code: "ADMNDOC50",
    description: "Potongan Rp50.000 untuk testing transaksi dokumentasi.",
    discount: "50000",
    imageUrl: "/images/products/doc-prewedding-outdoor.jpg",
    terms: "Khusus sesi dokumentasi dengan minimal durasi tertentu.",
    href: "/dokumentasi",
    category: PromoCategory.DOKUMENTASI,
    sortOrder: 4,
  },
] as const;

function isPaidLike(status: BookingStatus, paymentStatus: PaymentStatus) {
  return (
    paymentStatus === PaymentStatus.PAID ||
    status === BookingStatus.PAID ||
    status === BookingStatus.CONFIRMED ||
    status === BookingStatus.COMPLETED
  );
}

function resolveCanonicalPaymentStatus(
  bookingPaymentStatus: PaymentStatus,
  payments: Array<{
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
  }>
) {
  if (payments.length === 0) {
    return bookingPaymentStatus;
  }

  if (payments.some((payment) => payment.status === PaymentStatus.REFUNDED)) {
    return PaymentStatus.REFUNDED;
  }

  if (payments.some((payment) => payment.status === PaymentStatus.PAID)) {
    return PaymentStatus.PAID;
  }

  const latestPayment = [...payments].sort((left, right) => {
    const updatedDiff = right.updatedAt.getTime() - left.updatedAt.getTime();
    if (updatedDiff !== 0) {
      return updatedDiff;
    }
    return right.createdAt.getTime() - left.createdAt.getTime();
  })[0];

  return latestPayment?.status ?? bookingPaymentStatus;
}

async function ensureSeedSeller(index: number) {
  const email = `marketplace-seller-${index + 1}@system.local`;
  const phone = `0819900000${index + 1}`;
  const password = await bcrypt.hash("admin12345", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: Role.SELLER,
      phone,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    create: {
      email,
      name: `Marketplace Seller ${index + 1}`,
      password,
      role: Role.SELLER,
      phone,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    select: { id: true },
  });

  return prisma.sellerProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: `Marketplace Seller ${index + 1}`,
      status: SellerStatus.ACTIVE,
      bankName: "BCA",
      bankCode: "014",
      accountNumber: `123450000${index + 1}`,
      accountName: `Marketplace Seller ${index + 1}`,
    },
    create: {
      userId: user.id,
      displayName: `Marketplace Seller ${index + 1}`,
      status: SellerStatus.ACTIVE,
      bankName: "BCA",
      bankCode: "014",
      accountNumber: `123450000${index + 1}`,
      accountName: `Marketplace Seller ${index + 1}`,
    },
    select: { id: true, displayName: true },
  });
}

export async function getAdminMarketplaceOverview() {
  const [paidBookings, products, promos, wallets, paidWithdraws] = await Promise.all([
    prisma.booking.findMany({
      select: { totalAmount: true, status: true, paymentStatus: true },
    }),
    prisma.listing.count({ where: { status: { not: ListingStatus.ARCHIVED } } }),
    prisma.promoPackage.count(),
    prisma.wallet.aggregate({
      _sum: { balanceAvailable: true, balancePending: true },
    }),
    prisma.withdraw.aggregate({
      where: { status: { in: ["PAID", "PROCESSING", "APPROVED"] } },
      _sum: { amount: true },
    }),
  ]);

  const grossReceipts = paidBookings
    .filter((booking) => isPaidLike(booking.status, booking.paymentStatus))
    .reduce((sum, booking) => sum + booking.totalAmount, 0);
  const sellerLiability =
    (wallets._sum.balanceAvailable ?? 0) + (wallets._sum.balancePending ?? 0);
  const adminBalance = Math.max(0, grossReceipts - (paidWithdraws._sum.amount ?? 0));

  return {
    grossReceipts,
    adminBalance,
    sellerLiability,
    totalProducts: products,
    totalPromos: promos,
  };
}

export async function listMarketplaceSellerOptions() {
  const sellers = await prisma.sellerProfile.findMany({
    where: { status: SellerStatus.ACTIVE },
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      user: { select: { email: true } },
    },
  });

  return sellers.map((seller) => ({
    id: seller.id,
    label: seller.displayName,
    email: seller.user.email,
  }));
}

function serializeMarketplaceSellerSummary(seller: {
  id: string;
  displayName: string;
  status: SellerStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    email: string;
  };
  wallet: {
    balanceAvailable: number;
    balancePending: number;
  } | null;
  _count: {
    listings: number;
    bookings: number;
  };
}) {
  return {
    id: seller.id,
    name: seller.displayName,
    ownerName: seller.user.name,
    email: seller.user.email,
    status: seller.status,
    productCount: seller._count.listings,
    bookingCount: seller._count.bookings,
    balanceAvailable: seller.wallet?.balanceAvailable ?? 0,
    balancePending: seller.wallet?.balancePending ?? 0,
    createdAt: seller.createdAt.toISOString(),
    updatedAt: seller.updatedAt.toISOString(),
  };
}

export async function listMarketplaceSellersSummary() {
  const sellers = await prisma.sellerProfile.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      displayName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      wallet: {
        select: {
          balanceAvailable: true,
          balancePending: true,
        },
      },
      _count: {
        select: {
          listings: true,
          bookings: true,
        },
      },
    },
  });

  return sellers.map(serializeMarketplaceSellerSummary);
}

async function getMarketplaceSellerSummaryById(id: string) {
  const seller = await prisma.sellerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      wallet: {
        select: {
          balanceAvailable: true,
          balancePending: true,
        },
      },
      _count: {
        select: {
          listings: true,
          bookings: true,
        },
      },
    },
  });

  if (!seller) {
    return null;
  }

  return serializeMarketplaceSellerSummary(seller);
}

export async function updateMarketplaceSeller(
  id: string,
  input: {
    displayName?: string;
    ownerName?: string;
    email?: string;
    status?: SellerStatus;
  }
) {
  const current = await prisma.sellerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
    },
  });

  if (!current) {
    const error = new Error("Seller tidak ditemukan") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  if (input.email) {
    const emailOwner = await prisma.user.findFirst({
      where: {
        email: input.email,
        id: { not: current.userId },
      },
      select: { id: true },
    });

    if (emailOwner) {
      const error = new Error("Email seller sudah dipakai akun lain") as Error & { status?: number };
      error.status = 409;
      throw error;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (input.displayName !== undefined || input.status !== undefined) {
      await tx.sellerProfile.update({
        where: { id: current.id },
        data: {
          ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });
    }

    if (input.ownerName !== undefined || input.email !== undefined) {
      await tx.user.update({
        where: { id: current.userId },
        data: {
          ...(input.ownerName !== undefined ? { name: input.ownerName } : {}),
          ...(input.email !== undefined ? { email: input.email } : {}),
        },
      });
    }
  });

  return getMarketplaceSellerSummaryById(id);
}

export async function deleteMarketplaceSeller(id: string) {
  const current = await prisma.sellerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
    },
  });

  if (!current) {
    const error = new Error("Seller tidak ditemukan") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  await prisma.sellerProfile.update({
    where: { id },
    data: {
      status:
        current.status === SellerStatus.PENDING_REVIEW
          ? SellerStatus.REJECTED
          : SellerStatus.SUSPENDED,
    },
  });

  return getMarketplaceSellerSummaryById(id);
}

export async function listMarketplaceProducts() {
  const listings = await prisma.listing.findMany({
    where: { status: { not: ListingStatus.ARCHIVED } },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      unitType: true,
      basePrice: true,
      status: true,
      locationText: true,
      maxGuest: true,
      sellerId: true,
      seller: { select: { displayName: true } },
      _count: { select: { bookings: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return listings.map((listing) => ({
    id: listing.id,
    slug: listing.slug,
    name: listing.title,
    category: listing.type,
    unitType: listing.unitType,
    price: listing.basePrice,
    status: listing.status,
    locationText: listing.locationText,
    maxGuest: listing.maxGuest,
    sellerId: listing.sellerId,
    sellerName: listing.seller.displayName,
    soldCount: listing._count.bookings,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  }));
}

export async function listMarketplaceTransactions() {
  const rows = await prisma.booking.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      code: true,
      totalAmount: true,
      qty: true,
      createdAt: true,
      paymentStatus: true,
      promoCode: true,
      buyerEmail: true,
      buyerPhone: true,
      notes: true,
      payments: {
        select: {
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      listing: { select: { title: true } },
      seller: { select: { displayName: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return rows.map((row) => {
    const noteData = parseBookingNotes(row.notes);
    const customer = getBookingCustomerSnapshot(noteData);

    return {
      id: row.id,
      code: row.code,
      productName: row.listing.title,
      sellerName: row.seller.displayName,
      buyerName: customer?.name ?? row.user.name,
      buyerEmail: row.buyerEmail ?? customer?.email ?? row.user.email,
      buyerPhone: row.buyerPhone ?? customer?.phone ?? "-",
      quantity: row.qty,
      totalAmount: row.totalAmount,
      paymentStatus: resolveCanonicalPaymentStatus(
        row.paymentStatus,
        row.payments
      ),
      promoCode: row.promoCode,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function listPromoPerformance() {
  const promos = await prisma.promoPackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      code: true,
      category: true,
      isActive: true,
      updatedAt: true,
      bookings: {
        select: {
          id: true,
          totalAmount: true,
          discountAmount: true,
          status: true,
          paymentStatus: true,
        },
      },
    },
  });

  return promos.map((promo) => {
    const paidOrders = promo.bookings.filter((booking) =>
      isPaidLike(booking.status, booking.paymentStatus)
    );
    return {
      id: promo.id,
      name: promo.title,
      code: promo.code,
      category: promo.category,
      isActive: promo.isActive,
      bookings: promo.bookings.length,
      paidOrders: paidOrders.length,
      attributedRevenue: paidOrders.reduce((sum, booking) => sum + booking.totalAmount, 0),
      totalDiscount: promo.bookings.reduce((sum, booking) => sum + booking.discountAmount, 0),
      updatedAt: promo.updatedAt.toISOString(),
    };
  });
}

// LEGACY DEV-ONLY seed helper
export async function seedMarketplaceDemoProducts() {
  const sellers = await Promise.all(DEMO_PRODUCTS.map((_, index) => ensureSeedSeller(index)));

  for (const [index, demo] of DEMO_PRODUCTS.entries()) {
    const seller = sellers[index];
    const listing = await prisma.listing.upsert({
      where: { slug: demo.slug },
      update: {
        sellerId: seller.id,
        title: demo.title,
        description: `${demo.title} untuk testing flow marketplace modular.`,
        locationText: demo.locationText,
        basePrice: demo.basePrice,
        maxGuest: demo.maxGuest,
        unitType: demo.unitType,
        type: demo.type,
        status: ListingStatus.APPROVED,
        publishedAt: new Date(),
        metadata: demo.metadata,
      },
      create: {
        sellerId: seller.id,
        slug: demo.slug,
        title: demo.title,
        description: `${demo.title} untuk testing flow marketplace modular.`,
        locationText: demo.locationText,
        basePrice: demo.basePrice,
        maxGuest: demo.maxGuest,
        unitType: demo.unitType,
        type: demo.type,
        status: ListingStatus.APPROVED,
        publishedAt: new Date(),
        metadata: demo.metadata,
      },
      select: { id: true },
    });

    await prisma.listingImage.deleteMany({ where: { listingId: listing.id } });
    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        url: demo.image,
        altText: demo.title,
        sortOrder: 0,
        isPrimary: true,
      },
      });
  }

  return {
    products: DEMO_PRODUCTS.length,
    sellers: sellers.length,
  };
}

// LEGACY DEV-ONLY seed helper
export async function seedMarketplaceDemoPromos() {
  for (const promo of DEMO_PROMOS) {
    await prisma.promoPackage.upsert({
      where: { code: promo.code },
      update: {
        slug: promo.slug,
        title: promo.title,
        description: promo.description,
        discount: promo.discount,
        imageUrl: promo.imageUrl,
        terms: promo.terms,
        href: promo.href,
        category: promo.category,
        expiresAt: new Date("2026-12-31T23:59:59.000Z"),
        isActive: true,
        sortOrder: promo.sortOrder,
      },
      create: {
        slug: promo.slug,
        title: promo.title,
        code: promo.code,
        description: promo.description,
        discount: promo.discount,
        imageUrl: promo.imageUrl,
        terms: promo.terms,
        href: promo.href,
        category: promo.category,
        expiresAt: new Date("2026-12-31T23:59:59.000Z"),
        isActive: true,
        sortOrder: promo.sortOrder,
      },
    });
  }

  return {
    promos: DEMO_PROMOS.length,
  };
}

// LEGACY DEV-ONLY seed helper
export async function seedMarketplaceDemoData() {
  const productResult = await seedMarketplaceDemoProducts();

  const promoResult = await seedMarketplaceDemoPromos();

  return {
    products: productResult.products,
    promos: promoResult.promos,
    sellers: productResult.sellers,
  };
}
