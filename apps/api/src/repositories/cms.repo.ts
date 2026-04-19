import type { Prisma } from "@prisma/client";
import prisma from "../lib/db.js";
import {
  ContactContentSchema,
  HeroContentSchema,
  HomepageSectionKeySchema,
  HowToContentSchema,
  PromoContentSchema,
  RecommendationsContentSchema,
  ReviewsContentSchema,
  type HomepageSectionKey,
} from "../schemas/cms.schema.js";

const DEFAULT_SECTIONS: Array<{
  key: HomepageSectionKey;
  label: string;
  description: string;
  sortOrder: number;
  isVisible: boolean;
  draftContent: Prisma.JsonObject;
  publishedContent: Prisma.JsonObject;
}> = [
  {
    key: "hero",
    label: "Hero",
    description: "Konten utama hero section di homepage.",
    sortOrder: 1,
    isVisible: true,
    draftContent: {
      eyebrow: "Booking Villa & Activity",
      title: "Pilihan terbaik untuk liburanmu",
      description: "Villa cantik, jeep seru, transport aman, dokumentasi estetik. Semua di satu tempat.",
    },
    publishedContent: {
      eyebrow: "Booking Villa & Activity",
      title: "Pilihan terbaik untuk liburanmu",
      description: "Villa cantik, jeep seru, transport aman, dokumentasi estetik. Semua di satu tempat.",
    },
  },
  {
    key: "promo",
    label: "Promo",
    description: "Header section paket & promo.",
    sortOrder: 2,
    isVisible: true,
    draftContent: {
      title: "Paket & Promo",
      ctaLabel: "Lihat semua",
      ctaHref: "/villa",
    },
    publishedContent: {
      title: "Paket & Promo",
      ctaLabel: "Lihat semua",
      ctaHref: "/villa",
    },
  },
  {
    key: "recommendations",
    label: "Recommendations",
    description: "Judul per section rekomendasi produk di homepage.",
    sortOrder: 3,
    isVisible: true,
    draftContent: {
      title: "Rekomendasi Pilihan",
      sections: [
        { key: "villa", title: "Villa Rekomendasi", enabled: true },
        { key: "jeep", title: "Jeep Rekomendasi", enabled: true },
        { key: "transport", title: "Rent Rekomendasi", enabled: true },
        { key: "dokumentasi", title: "Dokumentasi Rekomendasi", enabled: true },
      ],
    },
    publishedContent: {
      title: "Rekomendasi Pilihan",
      sections: [
        { key: "villa", title: "Villa Rekomendasi", enabled: true },
        { key: "jeep", title: "Jeep Rekomendasi", enabled: true },
        { key: "transport", title: "Rent Rekomendasi", enabled: true },
        { key: "dokumentasi", title: "Dokumentasi Rekomendasi", enabled: true },
      ],
    },
  },
  {
    key: "howTo",
    label: "How To",
    description: "Langkah booking di homepage.",
    sortOrder: 4,
    isVisible: true,
    draftContent: {
      title: "How to Book",
      steps: [
        "Pilih tipe produk dan tanggal atau slot.",
        "Tambahkan ke keranjang sesuai kebutuhan perjalanan.",
        "Checkout dan lanjut pembayaran.",
        "Terima invoice sementara via email atau WhatsApp.",
      ],
    },
    publishedContent: {
      title: "How to Book",
      steps: [
        "Pilih tipe produk dan tanggal atau slot.",
        "Tambahkan ke keranjang sesuai kebutuhan perjalanan.",
        "Checkout dan lanjut pembayaran.",
        "Terima invoice sementara via email atau WhatsApp.",
      ],
    },
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Review unggulan yang tampil di homepage.",
    sortOrder: 5,
    isVisible: true,
    draftContent: {
      title: "Rating & Review",
      items: [
        { name: "Nadia", text: "Villa bersih, sunrise jeep mantap!", stars: 5 },
        { name: "Bima", text: "Proses booking cepat, CS responsif.", stars: 5 },
        { name: "Sari", text: "Dokumentasi bagus, hasil fotonya cakep.", stars: 4 },
      ],
    },
    publishedContent: {
      title: "Rating & Review",
      items: [
        { name: "Nadia", text: "Villa bersih, sunrise jeep mantap!", stars: 5 },
        { name: "Bima", text: "Proses booking cepat, CS responsif.", stars: 5 },
        { name: "Sari", text: "Dokumentasi bagus, hasil fotonya cakep.", stars: 4 },
      ],
    },
  },
  {
    key: "contact",
    label: "Contact",
    description: "Kontak dan info operasional di homepage.",
    sortOrder: 6,
    isVisible: true,
    draftContent: {
      title: "Contact",
      supportTitle: "Customer Service",
      whatsappLabel: "+62 812-0000-0000",
      whatsappHref: "https://wa.me/6281200000000",
      emailLabel: "cs@green-grey.example",
      hoursTitle: "Jam Operasional",
      hoursText: "Setiap hari 08:00-21:00 WIB",
      officeTitle: "Alamat Kantor",
      officeText: "Jl. Contoh Indah No. 123, Kota Wisata",
    },
    publishedContent: {
      title: "Contact",
      supportTitle: "Customer Service",
      whatsappLabel: "+62 812-0000-0000",
      whatsappHref: "https://wa.me/6281200000000",
      emailLabel: "cs@green-grey.example",
      hoursTitle: "Jam Operasional",
      hoursText: "Setiap hari 08:00-21:00 WIB",
      officeTitle: "Alamat Kantor",
      officeText: "Jl. Contoh Indah No. 123, Kota Wisata",
    },
  },
];

function getContentSchema(key: HomepageSectionKey) {
  switch (key) {
    case "hero":
      return HeroContentSchema;
    case "promo":
      return PromoContentSchema;
    case "recommendations":
      return RecommendationsContentSchema;
    case "howTo":
      return HowToContentSchema;
    case "reviews":
      return ReviewsContentSchema;
    case "contact":
      return ContactContentSchema;
    default: {
      const unreachable: never = key;
      return unreachable;
    }
  }
}

function normalizeSectionRecord<T extends { key: string; draftContent: unknown; publishedContent: unknown }>(record: T) {
  const key = HomepageSectionKeySchema.parse(record.key);
  const schema = getContentSchema(key);
  return {
    ...record,
    key,
    draftContent: schema.parse(record.draftContent),
    publishedContent: record.publishedContent ? schema.parse(record.publishedContent) : null,
  };
}

export async function ensureHomepageSectionsSeeded() {
  const existing = await prisma.cmsHomepageSection.findMany({
    select: { key: true },
  });

  const existingKeys = new Set(existing.map((item) => item.key));
  const missing = DEFAULT_SECTIONS.filter((section) => !existingKeys.has(section.key));

  if (!missing.length) {
    return;
  }

  await prisma.cmsHomepageSection.createMany({
    data: missing.map((section) => ({
      key: section.key,
      label: section.label,
      description: section.description,
      draftContent: section.draftContent,
      publishedContent: section.publishedContent,
      isVisible: section.isVisible,
      sortOrder: section.sortOrder,
      publishedAt: new Date(),
    })),
  });
}

export async function listHomepageSections() {
  await ensureHomepageSectionsSeeded();
  const rows = await prisma.cmsHomepageSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(normalizeSectionRecord);
}

export async function getHomepageSectionByKey(key: HomepageSectionKey) {
  await ensureHomepageSectionsSeeded();
  const row = await prisma.cmsHomepageSection.findUnique({
    where: { key },
  });
  if (!row) {
    return null;
  }
  return normalizeSectionRecord(row);
}

export async function updateHomepageSectionDraft(
  key: HomepageSectionKey,
  data: {
    draftContent?: unknown;
    isVisible?: boolean;
  }
) {
  await ensureHomepageSectionsSeeded();
  const current = await prisma.cmsHomepageSection.findUnique({
    where: { key },
  });

  if (!current) {
    return null;
  }

  const schema = getContentSchema(key);
  const nextDraft = data.draftContent === undefined ? current.draftContent : schema.parse(data.draftContent);

  const updated = await prisma.cmsHomepageSection.update({
    where: { key },
    data: {
      draftContent: nextDraft as Prisma.InputJsonValue,
      ...(typeof data.isVisible === "boolean" ? { isVisible: data.isVisible } : {}),
    },
  });

  return normalizeSectionRecord(updated);
}

export async function publishHomepageSection(key: HomepageSectionKey) {
  await ensureHomepageSectionsSeeded();
  const current = await prisma.cmsHomepageSection.findUnique({
    where: { key },
  });

  if (!current) {
    return null;
  }

  const schema = getContentSchema(key);
  const safeDraft = schema.parse(current.draftContent);

  const updated = await prisma.cmsHomepageSection.update({
    where: { key },
    data: {
      publishedContent: safeDraft as Prisma.InputJsonValue,
      publishedAt: new Date(),
    },
  });

  return normalizeSectionRecord(updated);
}

export async function getPublishedHomepageSections() {
  await ensureHomepageSectionsSeeded();
  const rows = await prisma.cmsHomepageSection.findMany({
    where: { isVisible: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return rows.map((row) => {
    const normalized = normalizeSectionRecord(row);
    return {
      key: normalized.key,
      label: normalized.label,
      content: normalized.publishedContent ?? normalized.draftContent,
      isVisible: normalized.isVisible,
      publishedAt: normalized.publishedAt,
      updatedAt: normalized.updatedAt,
    };
  });
}
