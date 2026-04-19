import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { parseCatalogQuery } from "@/lib/catalog-utils";

export default async function JeepPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initial = parseCatalogQuery("jeep", sp);
  return <CatalogPageClient type="jeep" initial={initial} />;
}
