import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { parseCatalogQuery } from "@/lib/catalog-utils";
import type { ProductType } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveType(value: string | string[] | undefined): ProductType {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "jeep" || raw === "transport" || raw === "dokumentasi") {
    return raw;
  }
  return "villa";
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const type = resolveType(sp.type);
  const initial = parseCatalogQuery(type, sp);

  return <CatalogPageClient type={type} initial={initial} />;
}
