"use client";

import * as React from "react";
import StatsCard, { type StatsCardProps } from "./StatsCard";

export type KPIGridProps = {
  items: StatsCardProps[];
  /** Kolom responsif default: 2 → 3 → 4 */
  cols?: { base?: number; md?: number; lg?: number };
  className?: string;
};

export default function KPIGrid({ items, cols, className }: KPIGridProps) {
  const base = cols?.base ?? 2;
  const md = cols?.md ?? 3;
  const lg = cols?.lg ?? 4;

  return (
    <div
      className={[
        "grid gap-3 sm:gap-4",
        `grid-cols-1`,
        base >= 2 && `sm:grid-cols-${Math.min(base, 4)}`,
        md >= 2 && `md:grid-cols-${Math.min(md, 4)}`,
        lg >= 2 && `lg:grid-cols-${Math.min(lg, 4)}`,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {items.map((p, i) => (
        <StatsCard key={i} {...p} />
      ))}
    </div>
  );
}
