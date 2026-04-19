"use client";

import * as React from "react";

type Status = "success" | "warn" | "error" | "info" | "neutral";

export type BadgeProps = {
  children: React.ReactNode;
  status?: Status;
  className?: string;
};

const style: Record<Status, string> = {
  success: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  warn: "bg-amber-100 text-amber-800 border border-amber-200",
  error: "bg-rose-100 text-rose-800 border border-rose-200",
  info: "bg-sky-100 text-sky-800 border border-sky-200",
  neutral: "bg-slate-100 text-slate-800 border border-slate-200",
};

export default function Badge({ children, status = "neutral", className }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        style[status],
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
