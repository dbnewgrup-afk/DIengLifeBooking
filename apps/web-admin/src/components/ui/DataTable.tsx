"use client";

import * as React from "react";
import Table, { type Column, type SortState } from "./Table";
import Pagination from "./Pagination";

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  /** Jika true render skeleton baris kosong */
  loading?: boolean;
  /** Pesan saat kosong */
  emptyMessage?: React.ReactNode;
  /** Pagination props (kontrol dari luar) */
  page?: number;         // 1-based
  pageSize?: number;
  total?: number;        // total items
  onPageChange?: (page: number) => void;
  /** Sorting (kontrol dari luar), jika tak ada akan sorting client-side sederhana */
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  /** Kunci baris */
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
  dense?: boolean;
};

function defaultAccessor<T>(row: T, key: string): unknown {
  return (row as any)?.[key];
}

function sortClient<T>(data: T[], sort: SortState, columns: Column<T>[]) {
  if (!sort) return data;
  const col = columns.find(c => c.key === sort.key);
  if (!col) return data;
  const acc = col.accessor
    ? col.accessor
    : (row: T) => defaultAccessor(row, col.key);

  const sorted = [...data].sort((a, b) => {
    const va = acc(a);
    const vb = acc(b);
    if (va == null && vb == null) return 0;
    if (va == null) return -1;
    if (vb == null) return 1;
    if (typeof va === "number" && typeof vb === "number") {
      return va - vb;
    }
    return String(va).localeCompare(String(vb));
  });
  return sort.dir === "asc" ? sorted : sorted.reverse();
}

export default function DataTable<T>({
  columns,
  rows,
  loading,
  emptyMessage = "Tidak ada data.",
  page,
  pageSize = 10,
  total,
  onPageChange,
  sort,
  onSortChange,
  rowKey,
  className,
  dense,
}: DataTableProps<T>) {
  const [localSort, setLocalSort] = React.useState<SortState>(null);

  const activeSort = typeof sort === "undefined" ? localSort : sort;
  const setSort = (next: SortState) => {
    if (onSortChange) onSortChange(next);
    else setLocalSort(next);
  };

  // jika paging dikontrol
  const isPaged = typeof page === "number" && typeof total === "number";
  const startIndex = isPaged ? (Math.max(1, page!) - 1) * pageSize : 0;
  const endIndex = isPaged ? Math.min(total!, startIndex + pageSize) : rows.length;

  // sorting client-side (kalau tidak dikontrol)
  const displayRows = React.useMemo(() => {
    const base = typeof sort === "undefined" ? sortClient(rows, activeSort, columns) : rows;
    if (isPaged) return base; // diasumsikan server-side paging
    return base.slice(startIndex, endIndex); // client-side paging fallback
  }, [rows, activeSort, columns, isPaged, startIndex, endIndex, sort]);

  return (
    <div className={className}>
      <div className="mb-2 text-xs text-slate-500">
        {loading ? "Memuat data…" : isPaged ? `Menampilkan ${startIndex + 1}–${endIndex} dari ${total}` : `Total ${rows.length} data`}
      </div>

      {loading ? (
        <SkeletonTable columns={columns.length} rows={Math.min(pageSize, 8)} dense={dense} />
      ) : displayRows.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-slate-300 bg-white py-12 text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <Table<T>
          columns={columns}
          data={displayRows}
          sort={activeSort}
          onSortChange={setSort}
          rowKey={rowKey}
          dense={dense}
        />
      )}

      {/* Pagination */}
      {isPaged ? (
        <div className="mt-4">
          <Pagination
            page={page!}
            pageSize={pageSize}
            totalItems={total!}
            onPageChange={onPageChange!}
          />
        </div>
      ) : null}
    </div>
  );
}

function SkeletonTable({ columns, rows, dense }: { columns: number; rows: number; dense?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className={["px-4", dense ? "py-2.5" : "py-3"].join(" ")}>
                <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((__, c) => (
                <td key={c} className={["px-4", dense ? "py-2.5" : "py-3"].join(" ")}>
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
