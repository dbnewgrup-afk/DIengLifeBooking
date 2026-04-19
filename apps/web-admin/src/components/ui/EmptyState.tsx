"use client";

import * as React from "react";

export type EmptyStateProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
};

export default function EmptyState({
  title = "Tidak ada data",
  description = "Coba ubah filter atau tambah data baru.",
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[
        "grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700">
          {icon ?? <span className="text-xl">🗂️</span>}
        </div>
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="max-w-md text-sm text-slate-600">{description}</div>
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
    </div>
  );
}
