"use client";

import * as React from "react";

export type PaginationProps = {
  page: number;                 // 1-based
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;        // jumlah halaman di kiri/kanan current
};

export default function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = clamp(page, 1, totalPages);

  const pages = buildPages(current, totalPages, siblingCount);

  function go(p: number) {
    const next = clamp(p, 1, totalPages);
    if (next !== current) onPageChange(next);
  }

  return (
    <nav className={["flex items-center justify-between gap-2", className].filter(Boolean).join(" ")} aria-label="Pagination">
      <div className="text-xs text-slate-500">
        Halaman {current} dari {totalPages}
      </div>

      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => go(current - 1)}
            disabled={current <= 1}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Sebelumnya"
          >
            ‹
          </button>
        </li>

        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`e-${i}`} className="px-2 py-1 text-sm text-slate-500">
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => go(p)}
                aria-current={p === current ? "page" : undefined}
                className={[
                  "rounded-lg px-3 py-1.5 text-sm",
                  p === current
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {p}
              </button>
            </li>
          )
        )}

        <li>
          <button
            type="button"
            onClick={() => go(current + 1)}
            disabled={current >= totalPages}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Berikutnya"
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildPages(current: number, total: number, siblings: number): Array<number | "…"> {
  const pages: Array<number | "…"> = [];
  const left = Math.max(1, current - siblings);
  const right = Math.min(total, current + siblings);

  if (left > 1) {
    pages.push(1);
    if (left > 2) pages.push("…");
  }

  for (let p = left; p <= right; p++) pages.push(p);

  if (right < total) {
    if (right < total - 1) pages.push("…");
    pages.push(total);
  }

  return pages;
}
