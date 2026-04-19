"use client";
import { Card } from "./Card";
import { S } from "../lib/styles";
import { fmtInt } from "../lib/utils";

export function Meter({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.max(0, Math.min(100, total <= 0 ? 0 : Math.round((used / total) * 100)));
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{fmtInt(used)}</div>
      </div>
      <div style={S.meterTrack}>
        <div style={{ ...S.meterFill, width: `${pct}%` }} />
      </div>
    </Card>
  );
}
