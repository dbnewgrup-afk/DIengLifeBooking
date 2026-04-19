import {
  ListingStatus,
  ListingType,
  ListingUnitType,
  Role,
  SellerStatus,
  UserStatus,
} from "@prisma/client";
import prisma from "../src/lib/db.js";
import { ensureHomepageSectionsSeeded } from "../src/repositories/cms.repo.js";

const sellerUserId = "seed-seller-user";
const sellerProfileId = "seed-seller-profile";

const listings = [
  {
    id: "v1",
    type: ListingType.VILLA,
    slug: "villa-aster",
    title: "Villa Aster",
    locationText: "Batu",
    basePrice: 1_500_000,
    unitType: ListingUnitType.PER_NIGHT,
    maxGuest: 8,
    rating: 4.8,
    trending: true,
    images: ["/images/products/villa-aster.jpg"],
  },
  {
    id: "v2",
    type: ListingType.VILLA,
    slug: "villa-eden",
    title: "Villa Eden",
    locationText: "Ubud",
    basePrice: 2_200_000,
    unitType: ListingUnitType.PER_NIGHT,
    maxGuest: 10,
    rating: 4.9,
    trending: true,
    images: ["/images/products/villa-eden.jpg"],
  },
  {
    id: "v3",
    type: ListingType.VILLA,
    slug: "villa-luna",
    title: "Villa Luna",
    locationText: "Lembang",
    basePrice: 1_800_000,
    unitType: ListingUnitType.PER_NIGHT,
    maxGuest: 6,
    rating: 4.7,
    trending: false,
    images: ["/images/products/villa-luna.jpg"],
  },
  {
    id: "v4",
    type: ListingType.VILLA,
    slug: "villa-senja",
    title: "Villa Senja",
    locationText: "Bogor",
    basePrice: 1_300_000,
    unitType: ListingUnitType.PER_NIGHT,
    maxGuest: 5,
    rating: 4.6,
    trending: false,
    images: ["/images/products/villa-senja.jpg"],
  },
  {
    id: "j1",
    type: ListingType.JEEP,
    slug: "jeep-bromo-basic",
    title: "Jeep Bromo Basic",
    locationText: "Bromo",
    basePrice: 450_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 4,
    rating: 4.7,
    trending: true,
    images: ["/images/products/jeep-bromo-basic.jpg"],
  },
  {
    id: "j2",
    type: ListingType.JEEP,
    slug: "jeep-bromo-sunrise",
    title: "Jeep Sunrise",
    locationText: "Bromo",
    basePrice: 650_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 4,
    rating: 4.8,
    trending: true,
    images: ["/images/products/jeep-bromo-sunrise.jpg"],
  },
  {
    id: "j3",
    type: ListingType.JEEP,
    slug: "jeep-merapi",
    title: "Jeep Merapi",
    locationText: "Merapi",
    basePrice: 500_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 4,
    rating: 4.6,
    trending: false,
    images: ["/images/products/jeep-merapi.jpg"],
  },
  {
    id: "j4",
    type: ListingType.JEEP,
    slug: "jeep-ijen",
    title: "Jeep Kawah Ijen",
    locationText: "Ijen",
    basePrice: 700_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 4,
    rating: 4.7,
    trending: false,
    images: ["/images/products/jeep-ijen.jpg"],
  },
  {
    id: "t1",
    type: ListingType.TRANSPORT,
    slug: "bandara-ke-villa",
    title: "Bandara ke Villa",
    locationText: "Dieng",
    basePrice: 250_000,
    unitType: ListingUnitType.PER_TRIP,
    maxGuest: 4,
    rating: 4.5,
    trending: true,
    images: ["/images/products/transport-bandara-ke-villa.jpg"],
  },
  {
    id: "t2",
    type: ListingType.TRANSPORT,
    slug: "city-tour-6jam",
    title: "City Tour 6 Jam",
    locationText: "Dieng",
    basePrice: 550_000,
    unitType: ListingUnitType.PER_TRIP,
    maxGuest: 6,
    rating: 4.6,
    trending: true,
    images: ["/images/products/transport-city-tour-6jam.jpg"],
  },
  {
    id: "t3",
    type: ListingType.TRANSPORT,
    slug: "sewa-elf",
    title: "Sewa ELF + Driver",
    locationText: "Dieng",
    basePrice: 1_500_000,
    unitType: ListingUnitType.PER_TRIP,
    maxGuest: 12,
    rating: 4.7,
    trending: false,
    images: ["/images/products/transport-sewa-elf.jpg"],
  },
  {
    id: "t4",
    type: ListingType.TRANSPORT,
    slug: "sewa-matic",
    title: "Sewa Motor Matic",
    locationText: "Dieng",
    basePrice: 120_000,
    unitType: ListingUnitType.PER_TRIP,
    maxGuest: 2,
    rating: 4.4,
    trending: false,
    images: ["/images/products/transport-sewa-matic.jpg"],
  },
  {
    id: "d1",
    type: ListingType.PHOTOGRAPHER,
    slug: "foto-sunset-2jam",
    title: "Foto Sunset 2 Jam",
    locationText: "Dieng",
    basePrice: 600_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 5,
    rating: 4.8,
    trending: true,
    images: ["/images/products/doc-foto-sunset-2jam.jpg"],
  },
  {
    id: "d2",
    type: ListingType.PHOTOGRAPHER,
    slug: "foto-family-1jam",
    title: "Foto Family 1 Jam",
    locationText: "Dieng",
    basePrice: 400_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 6,
    rating: 4.6,
    trending: true,
    images: ["/images/products/doc-foto-family-1jam.jpg"],
  },
  {
    id: "d3",
    type: ListingType.PHOTOGRAPHER,
    slug: "prewedding-outdoor",
    title: "Prewedding Outdoor",
    locationText: "Dieng",
    basePrice: 1_800_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 2,
    rating: 4.9,
    trending: false,
    images: ["/images/products/doc-prewedding-outdoor.jpg"],
  },
  {
    id: "d4",
    type: ListingType.PHOTOGRAPHER,
    slug: "video-short",
    title: "Video Short 60s",
    locationText: "Dieng",
    basePrice: 900_000,
    unitType: ListingUnitType.PER_SESSION,
    maxGuest: 3,
    rating: 4.5,
    trending: false,
    images: ["/images/products/doc-video-short-60s.jpg"],
  },
] as const;

const promos = [
  {
    slug: "diskon-villa-15",
    title: "Diskon 15% Villa pilihan",
    code: "VILLA15",
    discount: "15%",
    description: "Berlaku untuk minimum menginap 1 malam. Tidak berlaku pada high season dan libur nasional.",
    imageUrl: "/images/products/villa-aster.jpg",
    terms: "Minimal 1 malam, tidak berlaku pada high season, dan tidak dapat digabung promo lain.",
    href: "/villa",
    badge: "Best Seller",
    category: "VILLA",
    expiresAt: new Date("2026-12-31T23:59:59.000Z"),
    sortOrder: 1,
  },
  {
    slug: "jeep-sunrise-hemat",
    title: "Jeep Sunrise Hemat",
    code: "SUNRISE90",
    discount: "90K",
    description: "Diskon Rp90.000 untuk trip sunrise. Kuota terbatas, hanya untuk rute standar.",
    imageUrl: "/images/products/jeep-bromo-sunrise.jpg",
    terms: "Khusus sunrise route standar, kuota terbatas per hari, dan wajib booking H-1.",
    href: "/jeep",
    category: "JEEP",
    expiresAt: new Date("2026-11-30T23:59:59.000Z"),
    sortOrder: 2,
  },
  {
    slug: "transport-bandara",
    title: "Transport Bandara",
    code: "RIDE10",
    discount: "10%",
    description: "Potongan 10% antar-jemput bandara. Termasuk tol dan parkir untuk paket yang ditandai.",
    imageUrl: "/images/products/transport-sewa-elf.jpg",
    terms: "Berlaku untuk rute bandara tertentu, maksimal 1 kode per booking, dan tidak termasuk overtime.",
    href: "/rent",
    category: "RENT",
    expiresAt: new Date("2026-12-20T23:59:59.000Z"),
    sortOrder: 3,
  },
  {
    slug: "dokumentasi-couple",
    title: "Dokumentasi Couple",
    code: "DOC50",
    discount: "50K",
    description: "Potongan Rp50.000 untuk paket dokumentasi pasangan. Termasuk 30 edited photos.",
    imageUrl: "/images/products/doc-prewedding-outdoor.jpg",
    terms: "Berlaku untuk paket couple terpilih, maksimal 1 sesi, dan penjadwalan mengikuti ketersediaan fotografer.",
    href: "/dokumentasi",
    category: "DOKUMENTASI",
    expiresAt: new Date("2026-12-15T23:59:59.000Z"),
    sortOrder: 4,
  },
  {
    slug: "semua-produk-oktober",
    title: "Semua Produk Oktober",
    code: "OKTOBER8",
    discount: "8%",
    description: "Diskon 8% untuk semua kategori. Tidak bisa digabung promo lain, satu akun satu kali.",
    imageUrl: "/images/slider.png",
    terms: "Satu akun satu kali, tidak bisa digabung promo lain, dan otomatis gugur bila kuota habis.",
    href: "/villa",
    badge: "Limited",
    category: "SEMUA",
    expiresAt: new Date("2026-12-25T23:59:59.000Z"),
    sortOrder: 5,
  },
] as const;

async function seedSeller() {
  await prisma.user.upsert({
    where: { email: "seed-seller@dienglife.local" },
    update: {
      name: "Seed Seller",
      role: Role.SELLER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
    create: {
      id: sellerUserId,
      name: "Seed Seller",
      email: "seed-seller@dienglife.local",
      role: Role.SELLER,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.sellerProfile.upsert({
    where: { userId: sellerUserId },
    update: {
      displayName: "Dieng Life Villas",
      legalName: "Dieng Life Villas",
      status: SellerStatus.ACTIVE,
    },
    create: {
      id: sellerProfileId,
      userId: sellerUserId,
      displayName: "Dieng Life Villas",
      legalName: "Dieng Life Villas",
      status: SellerStatus.ACTIVE,
      bankName: "BCA",
      bankCode: "014",
      accountNumber: "1234567890",
      accountName: "Dieng Life Villas",
    },
  });
}

async function seedListings() {
  for (const listing of listings) {
    await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: {
        sellerId: sellerProfileId,
        title: listing.title,
        description: `${listing.title} - paket dummy sinkron dari seed database.`,
        locationText: listing.locationText,
        basePrice: listing.basePrice,
        maxGuest: listing.maxGuest,
        unitType: listing.unitType,
        type: listing.type,
        status: ListingStatus.APPROVED,
        metadata: {
          rating: listing.rating,
          trending: listing.trending,
        },
      },
      create: {
        id: listing.id,
        sellerId: sellerProfileId,
        title: listing.title,
        slug: listing.slug,
        description: `${listing.title} - paket dummy sinkron dari seed database.`,
        locationText: listing.locationText,
        basePrice: listing.basePrice,
        maxGuest: listing.maxGuest,
        unitType: listing.unitType,
        type: listing.type,
        status: ListingStatus.APPROVED,
        publishedAt: new Date(),
        metadata: {
          rating: listing.rating,
          trending: listing.trending,
        },
      },
    });

    await prisma.listingImage.deleteMany({
      where: { listingId: listing.id },
    });

    await prisma.listingImage.createMany({
      data: listing.images.map((url, index) => ({
        listingId: listing.id,
        url,
        altText: listing.title,
        isPrimary: index === 0,
        sortOrder: index,
      })),
    });
  }
}

async function seedPromos() {
  for (const promo of promos) {
    await prisma.promoPackage.upsert({
      where: { code: promo.code },
      update: {
        slug: promo.slug,
        title: promo.title,
        description: promo.description,
        discount: promo.discount,
        badge: promo.badge,
        imageUrl: promo.imageUrl,
        terms: promo.terms,
        href: promo.href,
        category: promo.category,
        expiresAt: promo.expiresAt,
        isActive: true,
        sortOrder: promo.sortOrder,
      },
      create: {
        slug: promo.slug,
        title: promo.title,
        code: promo.code,
        description: promo.description,
        discount: promo.discount,
        badge: promo.badge,
        imageUrl: promo.imageUrl,
        terms: promo.terms,
        href: promo.href,
        category: promo.category,
        expiresAt: promo.expiresAt,
        isActive: true,
        sortOrder: promo.sortOrder,
      },
    });
  }
}

async function main() {
  await seedSeller();
  await seedListings();
  await seedPromos();
  await ensureHomepageSectionsSeeded();
  console.log("SEED_SYNC_DONE");
}

main()
  .catch((error) => {
    console.error("SEED_SYNC_FAILED");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
