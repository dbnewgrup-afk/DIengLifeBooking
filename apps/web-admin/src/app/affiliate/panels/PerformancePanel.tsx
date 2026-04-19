"use client";
import { C } from "../lib/styles";
import type { PerformanceToday } from "../lib/types";
import { Stat } from "../ui/Stat";
import { fmtIDR, fmtNum, timeAgo } from "../lib/utils";

export function PerformancePanel({ perf }: { perf: PerformanceToday }) {
  return (
    <section style={C.panel}>
      <div style={C.panelTitle}>Performance Hari Ini</div>
      <div style={C.grid3}>
        <Stat label="Klik" value={fmtNum(perf.clicks)} icon="🖱️" />
        <Stat label="Konversi" value={fmtNum(perf.conversions)} icon="✅" />
        <Stat label="Komisi Pending" value={fmtIDR(perf.pendingCommission)} icon="💸" />
      </div>
      <div style={{ marginTop: 12, ...C.mutedSmall }}>
        Data disegarkan {timeAgo(new Date().toISOString())}.
      </div>
    </section>
  );
}
