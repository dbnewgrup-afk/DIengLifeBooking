"use client";
import { Card } from "./Card";
import { S } from "../lib/styles";

export function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <div style={S.kpiNumber}>{value}</div>
      <div style={S.kpiLabel}>{label}</div>
    </Card>
  );
}
