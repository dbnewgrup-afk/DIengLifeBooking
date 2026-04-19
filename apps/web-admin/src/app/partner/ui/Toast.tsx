"use client";
import { S } from "../lib/styles";

export function Toast({ ok, text }: { ok: boolean; text: string }) {
  return <div style={S.toast(ok)}>{text}</div>;
}
