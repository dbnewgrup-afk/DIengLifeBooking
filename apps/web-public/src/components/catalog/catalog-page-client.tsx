"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Product, ProductType, SortKey } from "@/types";
import { DataState } from "@/components/ui";
import { getPublicApiErrorMessage, listProducts } from "@/data/api";
import { ProductCard } from "@/components/catalog/product-card";
import { CatalogHeader } from "@/components/catalog/catalog-header";
import { InfiniteGrid } from "@/components/catalog/infinite-grid";
import {
  getBucketsFor,
  getBucketById,
  type CatalogInitialState,
  toSearchString,
} from "@/lib/catalog-utils";

const PAGE_SIZE = 12;

export function CatalogPageClient({
  type,
  initial,
}: {
  type: ProductType;
  initial: CatalogInitialState;
}) {
  // ---- state filter/query
  const [q, setQ] = useState<string>(initial.q);
  const [bucketId, setBucketId] = useState<string>(initial.bucketId);
  const [rating, setRating] = useState<number>(initial.rating);
  const [sort, setSort] = useState<SortKey>(initial.sort);

  // ---- state data
  const [items, setItems] = useState<Product[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // ---- buckets per type
  const buckets = useMemo(() => getBucketsFor(type), [type]);

  // ---- sync URL tiap filter berubah (supaya shareable & siap BE)
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = toSearchString({ q, bucketId, rating, sort });
    const current = searchParams?.toString() ?? "";
    if (next !== current) {
      router.replace(`${pathname}?${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, bucketId, rating, sort]);

  // ---- fungsi fetch 1 halaman (tidak bergantung pada state internal)
  const fetchPage = useCallback(
    async (pageOffset: number) => {
      const bucket = getBucketById(buckets, bucketId);
      const minPrice = bucket?.min;
      const maxPrice = bucket?.max;

      return listProducts({
        type,
        q,
        minPrice,
        maxPrice,
        minRating: rating || undefined,
        sort,
        offset: pageOffset,
        limit: PAGE_SIZE,
      });
    },
    [buckets, bucketId, q, rating, sort, type]
  );

  // ---- reset & load ketika filter berubah
  useEffect(() => {
    let cancelled = false;

    // reset state saat filter berubah agar error tidak terlihat seperti data kosong
    setError(null);
    setItems([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);

    (async () => {
      try {
        const rows = await fetchPage(0);
        if (cancelled) return;
        setItems(rows);
        setOffset(rows.length);
        setHasMore(rows.length === PAGE_SIZE);
      } catch (cause) {
        if (cancelled) return;
        setItems([]);
        setOffset(0);
        setHasMore(false);
        setError(getPublicApiErrorMessage(cause, "Katalog gagal dimuat dari server."));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [q, bucketId, rating, sort, type, fetchPage, reloadKey]);

  // ---- loadMore untuk infinite scroll
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPage(offset);
      setItems(prev => [...prev, ...rows]);
      setOffset(prev => prev + rows.length);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (cause) {
      setError(getPublicApiErrorMessage(cause, "Gagal memuat halaman katalog berikutnya."));
    } finally {
      setLoading(false);
    }
  }, [fetchPage, hasMore, loading, offset]);

  // ---- reset all
  const onReset = useCallback(() => {
    setQ("");
    setBucketId("");
    setRating(0);
    setSort("popular");
  }, []);

  const title = useMemo(() => {
    switch (type) {
      case "villa": return "Villa";
      case "jeep": return "Jeep";
      case "transport": return "Rent";
      case "dokumentasi": return "Dokumentasi";
    }
  }, [type]);

  return (
    <div className="container-page py-6">
      <h1 className="text-xl font-semibold mb-3">{title}</h1>

      <CatalogHeader
        q={q}
        onQChange={setQ}
        buckets={buckets}
        bucketId={bucketId}
        onBucketChange={setBucketId}
        rating={rating}
        onRatingChange={setRating}
        sort={sort}
        onSortChange={setSort}
        onReset={onReset}
      />

      {error && items.length > 0 ? (
        <DataState
          className="mb-4"
          tone="error"
          title="Sebagian data katalog gagal dimuat"
          description={error}
        >
          <button
            type="button"
            onClick={() => void loadMore()}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Coba muat lagi
          </button>
        </DataState>
      ) : null}

      {error && items.length === 0 ? (
        <DataState
          tone="error"
          title="Katalog gagal dimuat"
          description={error}
        >
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Coba lagi
          </button>
        </DataState>
      ) : !loading && items.length === 0 ? (
        <DataState
          tone="empty"
          title="Tidak ada produk yang cocok"
          description="Filter yang aktif belum menemukan produk yang sesuai."
        />
      ) : (
        <InfiniteGrid<Product>
          items={items}
          hasMore={hasMore}
          loading={loading}
          onLoadMore={loadMore}
          renderItem={(p) => <ProductCard key={p.id} p={p} />}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          emptyMessage="Tidak ada produk yang cocok."
        />
      )}
    </div>
  );
}
