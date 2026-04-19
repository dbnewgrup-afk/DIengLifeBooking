"use client";

import * as React from "react";

export type StatsCardProps = {
  title: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  className?: string;
};

export default function StatsCard({
  title,
  value,
  subtext,
  icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-slate-200 bg-white p-4 sm:p-5",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {value}
          </div>
        </div>
        {icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        {trend ? (
          <span
            className={[
              "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium",
              trend.direction === "up" && "bg-emerald-100 text-emerald-800",
              trend.direction === "down" && "bg-rose-100 text-rose-800",
              trend.direction === "flat" && "bg-slate-100 text-slate-800",
            ]
              .filter(Boolean)
              .join(" ")}
            title="Trend"
          >
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.value}
          </span>
        ) : null}
        {subtext ? <span className="text-slate-500">{subtext}</span> : null}
      </div>
    </div>
  );
}
