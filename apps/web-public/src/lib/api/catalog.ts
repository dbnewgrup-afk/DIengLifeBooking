import { apiFetch, isLive } from "./client";
import { ProductListSchema, PromoListSchema } from "./schemas";
import type { ProductListItem, TrendingParams, SearchParams } from "../contracts";
import * as mock from "./mock";

export async function listTrending({ type, limit = 4 }: TrendingParams): Promise<ProductListItem[]> {
  if (!isLive()) return mock.listTrending({ type, limit });
  const qs = new URLSearchParams({ type, limit: String(limit) });
  return apiFetch(`/v1/trending?${qs}`, ProductListSchema);
}

export async function searchCatalog(params: SearchParams): Promise<ProductListItem[]> {
  if (!isLive()) return mock.searchCatalog(params);
  const qs = new URLSearchParams(Object.entries(params).reduce((a,[k,v])=>{
    if (v !== undefined && v !== "") a[String(k)] = String(v); return a;
  }, {} as Record<string,string>));
  return apiFetch(`/v1/catalog?${qs.toString()}`, ProductListSchema);
}

export async function listPromos() {
  if (!isLive()) return mock.listPromos();
  return apiFetch(`/v1/promos`, PromoListSchema);
}
