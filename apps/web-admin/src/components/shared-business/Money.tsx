"use client";

import * as React from "react";

export function formatIDR(n?: number, opts?: Intl.NumberFormatOptions) {
  if (typeof n !== "number" || Number.isNaN(n)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n);
}

export type MoneyProps = {
  value?: number;
  className?: string;
  compact?: boolean; // kalau true, gunakan notation "compact"
};

export default function Money({ value, className, compact }: MoneyProps) {
  if (typeof value !== "number") return <span className={className}>-</span>;
  const text = compact
    ? new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(value)
    : formatIDR(value);
  return <span className={className}>{text}</span>;
}
