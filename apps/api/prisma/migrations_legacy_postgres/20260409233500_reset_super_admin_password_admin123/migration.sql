-- Reset local seeded SUPER_ADMIN passwords to "admin123"
UPDATE "User"
SET "password" = '$2b$10$kC7RAUqfOpKrZFizJzV3LuEq6CpK/tC9N463301qUoxgLFNd711ZK'
WHERE "email" IN (
  'super1@system.local',
  'super2@system.local',
  'super3@system.local'
);
