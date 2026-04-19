"use client";

import * as React from "react";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | (string & {});

export default function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const cls =
    status === "ACTIVE"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : status === "INACTIVE"
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : status === "ARCHIVED"
      ? "bg-slate-100 text-slate-800 border border-slate-200"
      : "bg-slate-100 text-slate-800 border border-slate-200";

  return (
    <span className={["inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", cls].join(" ")}>
      {status}
    </span>
  );
}
