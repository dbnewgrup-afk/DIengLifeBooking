"use client";
import { S } from "../lib/styles";
import type { PartnerSummary } from "../lib/types";
import { Card } from "../ui/Card";
import { KPI } from "../ui/KPI";
import { Meter } from "../ui/Meter";

export function OverviewPanel({ summary }: { summary: PartnerSummary }) {
  const kpis = [
    { label: "Booking Hari Ini", value: summary.bookingsToday },
    { label: "Check-in Hari Ini", value: summary.checkinsToday },
    { label: "Check-out Hari Ini", value: summary.checkoutsToday },
    { label: "Pembayaran Pending", value: summary.pendingPayments },
  ];
  return (
    <>
      <div style={{ ...S.gridAuto(230), marginBottom: 20 }}>
        {kpis.map((k) => (
          <KPI key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      <div style={{ ...S.gridAuto(260), marginBottom: 20 }}>
        <Meter label="Slot Jeep/Transportasi Aktif" used={summary.activeTransportSlots} total={10} />
        <Meter label="Job Dokumentasi" used={summary.activeDocsJobs} total={10} />
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#334155" }}>Aktivitas Terbaru</div>
          <span style={S.badge("info")}>{summary.latestActivities.length} items</span>
        </div>
        {summary.latestActivities.length === 0 ? (
          <div style={{ fontSize: 14, color: "#64748b" }}>Belum ada aktivitas.</div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {summary.latestActivities.map((a) => (
              <li
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: "1px solid #e4f0f7",
                }}
              >
                <span style={{ color: "#0f172a" }}>{a.text}</span>
                <span style={{ color: "#64748b", fontSize: 12 }}>{a.ago}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
