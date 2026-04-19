"use client";

import * as React from "react";

export type SuspenseFallbackProps = {
  lines?: number;
  className?: string;
};

export default function SuspenseFallback({ lines = 4, className }: SuspenseFallbackProps) {
  return (
    <div className={["rounded-xl border border-slate-200 bg-white p-4", className].filter(Boolean).join(" ")}>
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
        {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-slate-200" />
        ))}
      </div>
    </div>
  );
}
