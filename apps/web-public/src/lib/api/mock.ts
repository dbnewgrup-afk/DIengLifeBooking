import { listProducts, listPromos as listPromoData, listTrending as listTrendingData } from "@/data/api";
import type { Product } from "@/types";
import type { ProductListItem, SearchParams, TrendingParams, PromoItem } from "../contracts";

function toListItem(p: Product): ProductListItem {
  return {
    id: p.id,
    type: p.type,
    slug: p.slug,
    name: p.name,
    location: p.location,
    price: p.price,
    unit: p.unit,
    rating: p.rating,
    cover: p.images?.[0],
  };
}

export async function listTrending({ type, limit = 4 }: TrendingParams) {
  const rows = await listTrendingData({ type, limit });
  return rows.map(toListItem);
}

export async function searchCatalog(params: SearchParams) {
  const pageSize = params.pageSize ?? 24;
  const page = params.page ?? 1;
  const rows = await listProducts({
    type: params.type,
    q: params.q,
    limit: pageSize,
    offset: Math.max(0, page - 1) * pageSize,
  });
  return rows.map(toListItem);
}

export async function listPromos(): Promise<PromoItem[]> {
  const rows = await listPromoData();
  return rows.map(({ id, slug, title, description, code, discount, href, badge, imageUrl, terms, until, category }) => ({
    id,
    slug,
    title,
    description,
    code,
    discount,
    href,
    badge,
    imageUrl,
    terms,
    until,
    category,
  }));
}
