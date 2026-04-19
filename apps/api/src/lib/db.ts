import { Prisma, PrismaClient } from '@prisma/client';

import { env } from "./env.js";

export const prisma = new PrismaClient({
  datasourceUrl: env.databaseUrl,
  log: env.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
});

// Contoh hook audit minimal (bisa kamu matikan kalau belum perlu)
// prisma.$use(async (params, next) => {
//   const result = await next(params);
//   // TODO: push ke tabel Audit sesuai kebutuhan
//   return result;
// });

export default prisma;










