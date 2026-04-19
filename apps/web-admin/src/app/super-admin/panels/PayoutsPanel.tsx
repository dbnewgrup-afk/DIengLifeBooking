"use client";
import { fmtDateTime, fmtIDR, fmtNum } from "../lib/utils";
import type { PayoutSummary } from "../lib/types";
import { EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle } from "../ui/Table";

export default function PayoutsPanel({
  payout,
  loading = false,
  error = null,
}: {
  payout: PayoutSummary;
  loading?: boolean;
  error?: string | null;
}) {
  const isEmpty =
    payout.totalBatches === 0 &&
    payout.draftCount === 0 &&
    payout.approvedCount === 0 &&
    payout.completedCount === 0 &&
    payout.totalAmount === 0 &&
    !payout.lastBatchAt;

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Payouts"
        subtitle="Ringkasan payout batch dari backend. Kartu ini sengaja statis ukurannya supaya dashboard tetap rapi walau nominal dan jumlah batch berubah."
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat payouts..."
          message="Ringkasan payout batch sedang diambil dari backend."
        />
      ) : error ? (
        <ErrorStateCard title="Gagal memuat payouts" message={error} />
      ) : isEmpty ? (
        <EmptyTableState message="Belum ada batch payout yang tercatat di backend." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
          <PayoutMetric label="Total Batch" value={fmtNum(payout.totalBatches)} helper="Batch payout tercatat" />
          <PayoutMetric label="Draft" value={fmtNum(payout.draftCount)} helper="Masih pending review" />
          <PayoutMetric label="Approved" value={fmtNum(payout.approvedCount)} helper="Sedang diproses / approved" />
          <PayoutMetric label="Completed" value={fmtNum(payout.completedCount)} helper="Sudah dibayar" />
          <PayoutMetric label="Total Nilai" value={fmtIDR(payout.totalAmount)} helper={`Batch terakhir ${fmtDateTime(payout.lastBatchAt)}`} />
        </div>
      )}
    </section>
  );
}

function PayoutMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        minHeight: 132,
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,.92)",
        border: "1px solid rgba(226,232,240,.95)",
        boxShadow: "0 14px 34px rgba(15,23,42,.10)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </div>
      <div style={{ marginTop: 12, fontSize: 26, fontWeight: 900, color: "#0f172a" }}>{value}</div>
      <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, color: "#64748b" }}>{helper}</div>
    </div>
  );
}
