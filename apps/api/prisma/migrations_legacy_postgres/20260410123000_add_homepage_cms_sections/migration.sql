CREATE TABLE "CmsHomepageSection" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "draftContent" JSONB NOT NULL,
  "publishedContent" JSONB,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CmsHomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsHomepageSection_key_key" ON "CmsHomepageSection"("key");
CREATE INDEX "CmsHomepageSection_sortOrder_idx" ON "CmsHomepageSection"("sortOrder");
CREATE INDEX "CmsHomepageSection_isVisible_sortOrder_idx" ON "CmsHomepageSection"("isVisible", "sortOrder");

INSERT INTO "CmsHomepageSection" (
  "id",
  "key",
  "label",
  "description",
  "draftContent",
  "publishedContent",
  "isVisible",
  "sortOrder",
  "publishedAt",
  "createdAt",
  "updatedAt"
)
VALUES
  (
    gen_random_uuid()::text,
    'hero',
    'Hero',
    'Konten utama hero section di homepage.',
    '{
      "eyebrow": "Booking Villa & Activity",
      "title": "Pilihan terbaik untuk liburanmu",
      "description": "Villa cantik, jeep seru, transport aman, dokumentasi estetik. Semua di satu tempat."
    }'::jsonb,
    '{
      "eyebrow": "Booking Villa & Activity",
      "title": "Pilihan terbaik untuk liburanmu",
      "description": "Villa cantik, jeep seru, transport aman, dokumentasi estetik. Semua di satu tempat."
    }'::jsonb,
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'promo',
    'Promo',
    'Header section paket & promo.',
    '{
      "title": "Paket & Promo",
      "ctaLabel": "Lihat semua",
      "ctaHref": "/villa"
    }'::jsonb,
    '{
      "title": "Paket & Promo",
      "ctaLabel": "Lihat semua",
      "ctaHref": "/villa"
    }'::jsonb,
    true,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'recommendations',
    'Recommendations',
    'Judul per section rekomendasi produk di homepage.',
    '{
      "title": "Rekomendasi Pilihan",
      "sections": [
        { "key": "villa", "title": "Villa Rekomendasi", "enabled": true },
        { "key": "jeep", "title": "Jeep Rekomendasi", "enabled": true },
        { "key": "transport", "title": "Rent Rekomendasi", "enabled": true },
        { "key": "dokumentasi", "title": "Dokumentasi Rekomendasi", "enabled": true }
      ]
    }'::jsonb,
    '{
      "title": "Rekomendasi Pilihan",
      "sections": [
        { "key": "villa", "title": "Villa Rekomendasi", "enabled": true },
        { "key": "jeep", "title": "Jeep Rekomendasi", "enabled": true },
        { "key": "transport", "title": "Rent Rekomendasi", "enabled": true },
        { "key": "dokumentasi", "title": "Dokumentasi Rekomendasi", "enabled": true }
      ]
    }'::jsonb,
    true,
    3,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'howTo',
    'How To',
    'Langkah booking di homepage.',
    '{
      "title": "How to Book",
      "steps": [
        "Pilih tipe produk dan tanggal atau slot.",
        "Tambahkan ke keranjang sesuai kebutuhan perjalanan.",
        "Checkout dan lanjut pembayaran.",
        "Terima invoice sementara via email atau WhatsApp."
      ]
    }'::jsonb,
    '{
      "title": "How to Book",
      "steps": [
        "Pilih tipe produk dan tanggal atau slot.",
        "Tambahkan ke keranjang sesuai kebutuhan perjalanan.",
        "Checkout dan lanjut pembayaran.",
        "Terima invoice sementara via email atau WhatsApp."
      ]
    }'::jsonb,
    true,
    4,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'reviews',
    'Reviews',
    'Review unggulan yang tampil di homepage.',
    '{
      "title": "Rating & Review",
      "items": [
        { "name": "Nadia", "text": "Villa bersih, sunrise jeep mantap!", "stars": 5 },
        { "name": "Bima", "text": "Proses booking cepat, CS responsif.", "stars": 5 },
        { "name": "Sari", "text": "Dokumentasi bagus, hasil fotonya cakep.", "stars": 4 }
      ]
    }'::jsonb,
    '{
      "title": "Rating & Review",
      "items": [
        { "name": "Nadia", "text": "Villa bersih, sunrise jeep mantap!", "stars": 5 },
        { "name": "Bima", "text": "Proses booking cepat, CS responsif.", "stars": 5 },
        { "name": "Sari", "text": "Dokumentasi bagus, hasil fotonya cakep.", "stars": 4 }
      ]
    }'::jsonb,
    true,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    gen_random_uuid()::text,
    'contact',
    'Contact',
    'Kontak dan info operasional di homepage.',
    '{
      "title": "Contact",
      "supportTitle": "Customer Service",
      "whatsappLabel": "+62 812-0000-0000",
      "whatsappHref": "https://wa.me/6281200000000",
      "emailLabel": "cs@green-grey.example",
      "hoursTitle": "Jam Operasional",
      "hoursText": "Setiap hari 08:00-21:00 WIB",
      "officeTitle": "Alamat Kantor",
      "officeText": "Jl. Contoh Indah No. 123, Kota Wisata"
    }'::jsonb,
    '{
      "title": "Contact",
      "supportTitle": "Customer Service",
      "whatsappLabel": "+62 812-0000-0000",
      "whatsappHref": "https://wa.me/6281200000000",
      "emailLabel": "cs@green-grey.example",
      "hoursTitle": "Jam Operasional",
      "hoursText": "Setiap hari 08:00-21:00 WIB",
      "officeTitle": "Alamat Kantor",
      "officeText": "Jl. Contoh Indah No. 123, Kota Wisata"
    }'::jsonb,
    true,
    6,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO NOTHING;
