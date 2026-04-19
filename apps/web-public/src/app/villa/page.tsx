import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { parseCatalogQuery } from "@/lib/catalog-utils";

export default async function VillaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initial = parseCatalogQuery("villa", sp);
  return <CatalogPageClient type="villa" initial={initial} />;
}
