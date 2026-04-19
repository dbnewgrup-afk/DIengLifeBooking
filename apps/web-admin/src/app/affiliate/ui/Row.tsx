"use client";
import type { ReactNode } from "react";

export function Row({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return <div style={{ display: "grid", gap }}>{children}</div>;
}
