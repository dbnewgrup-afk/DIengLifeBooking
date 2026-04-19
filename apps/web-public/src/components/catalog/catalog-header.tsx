"use client";

import { useMemo } from "react";
import type { SortKey } from "@/types";

export type Bucket = { id: string; label: string; min?: number; max?: number };

type Props = {
  // search
  q: string;
  onQChange: (v: string) => void;

  // buckets
  buckets: Bucket[];
  bucketId: string;              // "" = tidak ada bucket aktif
  onBucketChange: (id: string) => void;

  // rating & sort
  rating: number;                // 0 = semua
  onRatingChange: (n: number) => void;
  sort: SortKey;
  onSortChange: (s: SortKey) => void;

  // actions
  onReset: () => void;
};

const SORT_KEYS: readonly SortKey[] = ["popular", "price-asc", "price-desc", "rating-desc"] as const;
function isSortKey(v: string): v is SortKey {
  return (SORT_KEYS as readonly string[]).includes(v);
}

export function CatalogHeader({
  q, onQChange,
  buckets, bucketId, onBucketChange,
  rating, onRatingChange,
  sort, onSortChange,
  onReset,
}: Props) {
  const activeBucket = useMemo(
    () => buckets.find((b) => b.id === bucketId),
    [buckets, bucketId]
  );

  return (
    <>
      {/* Search bar ringkas */}
      <div className="bg-white border border-[var(--line)] rounded-2xl p-3 mb-3" role="search">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <label className="input flex items-center gap-2" aria-label="Cari">
            <span aria-hidden="true">🔎</span>
            <input
              value={q}
              onChange={(e) => onQChange(e.target.value)}
              placeholder="Kota, tujuan, atau nama produk"
              className="outline-none w-full text-sm bg-transparent"
            />
          </label>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onReset}
              className="btn border border-[var(--line)] bg-white"
              aria-label="Reset semua filter"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        {/* Buckets harga */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter harga">
          <span className="text-sm text-[var(--muted)]">Harga:</span>
          {buckets.map((b) => {
            const active = bucketId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onBucketChange(active ? "" : b.id)}
                className={[
                  "px-3 py-1.5 rounded-full text-sm border transition",
                  active
                    ? "bg-[var(--brand-600)] text-white border-[var(--brand-600)]"
                    : "bg-white border-[var(--line)] hover:bg-[var(--brand-50)]",
                ].join(" ")}
                aria-pressed={active}
                aria-label={active ? `Harga ${b.label} (aktif)` : `Pilih harga ${b.label}`}
              >
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Rating & Sort */}
        <div className="flex items-center gap-3" role="group" aria-label="Rating dan urutan">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Rating</span>
            <select
              value={rating}
              onChange={(e) => onRatingChange(Number(e.target.value))}
              className="select"
              aria-label="Minimal rating"
            >
              <option value={0}>Semua</option>
              <option value={4.0}>4.0+</option>
              <option value={4.5}>4.5+</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Urutkan</span>
            <select
              value={sort}
              onChange={(e) => {
                const v = e.target.value;
                if (isSortKey(v)) onSortChange(v);
              }}
              className="select"
              aria-label="Urutkan hasil"
            >
              <option value="popular">Terpopuler</option>
              <option value="price-asc">Harga termurah</option>
              <option value="price-desc">Harga termahal</option>
              <option value="rating-desc">Rating tertinggi</option>
            </select>
          </label>
        </div>
      </div>

      {/* Chips ringkas kondisi filter */}
      <div className="flex flex-wrap gap-2 mb-4" aria-live="polite">
        {!!q && (
          <button
            type="button"
            className="badge hover:bg-[var(--brand-50)]"
            onClick={() => onQChange("")}
            aria-label="Hapus kata kunci"
            title="Hapus kata kunci"
          >
            Cari: “{q}” ✕
          </button>
        )}
        {activeBucket && (
          <button
            type="button"
            className="badge hover:bg-[var(--brand-50)]"
            onClick={() => onBucketChange("")}
            aria-label="Hapus filter harga"
            title="Hapus filter harga"
          >
            Harga: {activeBucket.label} ✕
          </button>
        )}
        {rating > 0 && (
          <button
            type="button"
            className="badge hover:bg-[var(--brand-50)]"
            onClick={() => onRatingChange(0)}
            aria-label="Hapus filter rating"
            title="Hapus filter rating"
          >
            Rating ≥ {rating} ✕
          </button>
        )}
        {sort !== "popular" && (
          <button
            type="button"
            className="badge hover:bg-[var(--brand-50)]"
            onClick={() => onSortChange("popular")}
            aria-label="Kembalikan urutan ke Terpopuler"
            title="Kembalikan urutan ke Terpopuler"
          >
            Urut: {sort.replace("-", " ")} ✕
          </button>
        )}
        {!q && !activeBucket && rating === 0 && sort === "popular" && (
          <span className="text-sm text-[var(--muted)]">Tidak ada filter aktif</span>
        )}
      </div>
    </>
  );
}
