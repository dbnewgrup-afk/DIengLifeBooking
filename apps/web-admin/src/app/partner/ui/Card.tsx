"use client";
import type { CSSProperties, ReactNode } from "react";
import { S } from "../lib/styles";

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...S.card, ...style }}>{children}</div>;
}
