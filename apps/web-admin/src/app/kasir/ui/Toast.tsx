"use client";
import { toast as toastStyle } from "../lib/styles";

export default function Toast({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <div style={toastStyle(ok)}>{children}</div>;
}
