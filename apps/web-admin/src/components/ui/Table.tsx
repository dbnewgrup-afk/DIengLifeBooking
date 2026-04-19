"use client";

import * as React from "react";

export type CellAlign = "left" | "center" | "right";

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  width?: string;
  align?: CellAlign;
  sortable?: boolean;
  /**
   * Render sel. Jika tidak ada, akan menggunakan accessor by key.
   */
  render?: (row: T, rowIndex: number) => React.ReactNode;
  /**
   * Accessor untuk sorting ketika render tidak cukup.
   */
  accessor?: (row: T) => unknown;
};

export type SortState = { key: string; dir: "asc" | "desc" } | null;

export type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  rowKey?: (row: T, index: number) => string | number;
  className?: string;
  dense?: boolean;
};

export default function Table<T>({
  columns,
  data,
  sort,
  onSortChange,
  rowKey,
  className,
  dense,
}: TableProps<T>) {
  function cellAlignCls(a?: CellAlign) {
    if (a === "center") return "text-center";
    if (a === "right") return "text-right";
    return "text-left";
  }

  return (
    <div className={["overflow-x-auto rounded-lg border border-slate-200 bg-white", className].filter(Boolean).join(" ")}>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-slate-700">
            {columns.map(col => {
              const sortable = !!col.sortable && !!onSortChange;
              const active = sort?.key === col.key;
              const dir = active ? sort!.dir : undefined;
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={[
                    "px-4",
                    dense ? "py-2.5" : "py-3",
                    "font-semibold",
                    cellAlignCls(col.align),
                  ].join(" ")}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline"
                      onClick={() => {
                        if (!onSortChange) return;
                        if (!active) onSortChange({ key: col.key, dir: "asc" });
                        else onSortChange({ key: col.key, dir: dir === "asc" ? "desc" : "asc" });
                      }}
                    >
                      {col.header}
                      <SortIcon active={active} dir={dir} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((row, i) => {
            const k = rowKey ? rowKey(row, i) : i;
            return (
              <tr key={k} className="text-slate-800">
                {columns.map((col, j) => {
                  let content: React.ReactNode = null;
                  if (col.render) content = col.render(row, i);
                  else content = (row as any)?.[col.key] as React.ReactNode;
                  return (
                    <td
                      key={`${k}-${col.key}-${j}`}
                      className={["px-4", dense ? "py-2.5" : "py-3", cellAlignCls(col.align)].join(" ")}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, dir }: { active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <span className="inline-grid h-4 w-3 place-items-center text-slate-400">
      {!active ? (
        <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
          <path d="M4 6h8M6 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : dir === "asc" ? (
        <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
          <path d="M8 5l3 4H5l3-4z" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="10" height="10" aria-hidden="true">
          <path d="M8 11L5 7h6l-3 4z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}
