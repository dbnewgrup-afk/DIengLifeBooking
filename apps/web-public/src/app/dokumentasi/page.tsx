import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { parseCatalogQuery } from "@/lib/catalog-utils";

export default async function DokumentasiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initial = parseCatalogQuery("dokumentasi", sp);
  return <CatalogPageClient type="dokumentasi" initial={initial} />;
}
