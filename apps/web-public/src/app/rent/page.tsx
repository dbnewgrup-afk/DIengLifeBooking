import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { parseCatalogQuery } from "@/lib/catalog-utils";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initial = parseCatalogQuery("transport", sp);
  return <CatalogPageClient type="transport" initial={initial} />;
}
