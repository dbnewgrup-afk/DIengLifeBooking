"use client";

import * as React from "react";

export type TagProps = {
  children: React.ReactNode;
  tone?: "default" | "brand" | "neutral" | "success" | "warn" | "error";
  className?: string;
};

export default function Tag({ children, tone = "neutral", className }: TagProps) {
  const toneCls =
    tone === "brand"
      ? "bg-slate-900 text-white"
      : tone === "success"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : tone === "warn"
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : tone === "error"
      ? "bg-rose-100 text-rose-800 border border-rose-200"
      : tone === "default"
      ? "bg-slate-900 text-white"
      : "bg-slate-100 text-slate-800 border border-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        toneCls,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
