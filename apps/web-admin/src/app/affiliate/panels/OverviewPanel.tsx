"use client";
import { C } from "../lib/styles";
import type { AffiliateProfile, PerformanceToday } from "../lib/types";
import { Stat } from "../ui/Stat";
import { fmtIDR, fmtNum } from "../lib/utils";

export function OverviewPanel({
  profile,
  perf,
}: {
  profile: AffiliateProfile;
  perf: PerformanceToday;
}) {
  return (
    <section style={C.panel}>
      <div style={C.panelTitle}>Ringkasan</div>
      <div style={C.grid3}>
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.22))",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 18,
            padding: 14,
            textAlign: "center",
            boxShadow: "0 10px 24px rgba(2,47,64,.16)",
          }}
        >
          <div style={C.label}>Kode Affiliate</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#061f28" }}>
            {profile.code}
          </div>
        </div>
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.22))",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 18,
            padding: 14,
            textAlign: "center",
            boxShadow: "0 10px 24px rgba(2,47,64,.16)",
          }}
        >
          <div style={C.label}>Klik • Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#061f28" }}>
            {fmtNum(perf.clicks)}
          </div>
        </div>
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.30), rgba(255,255,255,.22))",
            border: "1px solid rgba(255,255,255,0.55)",
            borderRadius: 18,
            padding: 14,
            textAlign: "center",
            boxShadow: "0 10px 24px rgba(2,47,64,.16)",
          }}
        >
          <div style={C.label}>Konversi • Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#061f28" }}>
            {fmtNum(perf.conversions)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={C.panelTitle}>KPI Hari Ini</div>
        <div style={C.grid3}>
          <Stat label="Klik Hari Ini" value={fmtNum(perf.clicks)} icon="🖱️" />
          <Stat label="Konversi Hari Ini" value={fmtNum(perf.conversions)} icon="✅" />
          <Stat label="Komisi Pending" value={fmtIDR(perf.pendingCommission)} icon="💸" />
        </div>
      </div>
    </section>
  );
}
