-- Enable pgcrypto for gen_random_uuid (kalau belum)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Pastikan default ID User pakai UUID text (sinkron dengan Prisma uuid())
ALTER TABLE "User"
  ALTER COLUMN "id" SET DEFAULT (gen_random_uuid())::text;

-- ============================================
-- Seed 3 akun SUPER_ADMIN (id auto by default)
-- NOTE:
--   - Kolom "password" diasumsikan ADA (hashed).
--   - Tipe kolom "role" diasumsikan enum "Role".
--   - Kalau role kamu masih TEXT, hapus ::"Role".
--   - ON CONFLICT biar idempotent saat migrate ulang.
-- ============================================
INSERT INTO "User" ("email", "password", "role")
VALUES
  ('super1@system.local', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zf52zI1WsVY.GFQp/9G6.', 'SUPER_ADMIN'::"Role"),
  ('super2@system.local', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zf52zI1WsVY.GFQp/9G6.', 'SUPER_ADMIN'::"Role"),
  ('super3@system.local', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Zf52zI1WsVY.GFQp/9G6.', 'SUPER_ADMIN'::"Role")
ON CONFLICT ("email") DO NOTHING;
