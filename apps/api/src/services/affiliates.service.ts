import { PerformanceQuery } from "../schemas/affiliates.schema.js";
import * as repo from "../repositories/affiliates.repo.js";

export async function getPerformance(userId: string | null, rawQuery: unknown) {
  // validasi paging/range walau repositori masih stub
  PerformanceQuery.parse(rawQuery);
  return repo.getAffiliatePerformance(userId || "ANON");
}

export async function getLinks(userId: string | null) {
  return repo.getAffiliateLinks(userId || "ANON");
}









