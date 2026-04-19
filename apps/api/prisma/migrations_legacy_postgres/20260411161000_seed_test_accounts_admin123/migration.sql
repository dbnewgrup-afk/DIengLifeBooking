-- Seed akun test lintas role untuk environment lokal/staging
-- Semua akun memakai password: admin123
-- Hash bcrypt untuk "admin123":
-- $2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK

INSERT INTO "User" (
  "email",
  "name",
  "password",
  "role",
  "phone",
  "status",
  "emailVerifiedAt"
)
VALUES
  (
    'super1@system.local',
    'Super Admin 1',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'SUPER_ADMIN'::"Role",
    '081100000001',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'super2@system.local',
    'Super Admin 2',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'SUPER_ADMIN'::"Role",
    '081100000002',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'super3@system.local',
    'Super Admin 3',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'SUPER_ADMIN'::"Role",
    '081100000003',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'admin@system.local',
    'Admin Test',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'ADMIN'::"Role",
    '081100000010',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'kasir@system.local',
    'Kasir Test',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'KASIR'::"Role",
    '081100000020',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'seller@system.local',
    'Seller Test',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'SELLER'::"Role",
    '081100000030',
    'ACTIVE'::"UserStatus",
    NOW()
  ),
  (
    'user@system.local',
    'User Test',
    '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK',
    'USER'::"Role",
    '081100000040',
    'ACTIVE'::"UserStatus",
    NOW()
  )
ON CONFLICT ("email") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "password" = EXCLUDED."password",
  "role" = EXCLUDED."role",
  "phone" = EXCLUDED."phone",
  "status" = EXCLUDED."status",
  "emailVerifiedAt" = EXCLUDED."emailVerifiedAt";

INSERT INTO "SellerProfile" (
  "userId",
  "displayName",
  "legalName",
  "bio",
  "status"
)
SELECT
  "id",
  'Dieng Life Villas Seller Test',
  'PT Dieng Life Villas Test',
  'Akun seller test untuk kebutuhan login dan pengujian dashboard seller.',
  'ACTIVE'::"SellerStatus"
FROM "User"
WHERE "email" = 'seller@system.local'
ON CONFLICT ("userId") DO UPDATE
SET
  "displayName" = EXCLUDED."displayName",
  "legalName" = EXCLUDED."legalName",
  "bio" = EXCLUDED."bio",
  "status" = EXCLUDED."status";
