"use client";

import { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui";

type Props<T> = {
  items: T[];
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;  // default grid 1/4 kolom
  emptyMessage?: string;
};

export function InfiniteGrid<T>({
  items,
  hasMore,
  loading,
  onLoadMore,
  renderItem,
  className = "grid grid-cols-1 md:grid-cols-4 gap-4",
  emptyMessage = "Belum ada data.",
}: Props<T>) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) onLoadMore();
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!loading && items.length === 0) {
    return <div className="text-sm text-[var(--muted)]">{emptyMessage}</div>;
  }

  return (
    <>
      <div className={className}>
        {items.map((it, i) => renderItem(it, i))}
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={`skel-${i}`} className="card">
              <div className="aspect-[16/10] rounded-xl skel mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
      </div>
      <div ref={sentinelRef} aria-hidden className="h-1" />
    </>
  );
}
