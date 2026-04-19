"use client";

import type { CashierBookingRow, CashierSummary } from "../lib/types";
import { card, form, misc } from "../lib/styles";

function badgeStyle(tone: "neutral" | "success" | "warning" | "danger"): React.CSSProperties {
  if (tone === "success") {
    return {
      border: "1px solid rgba(16,185,129,.35)",
      background: "rgba(16,185,129,.12)",
      color: "#065f46",
    };
  }

  if (tone === "warning") {
    return {
      border: "1px solid rgba(245,158,11,.35)",
      background: "rgba(245,158,11,.12)",
      color: "#92400e",
    };
  }

  if (tone === "danger") {
    return {
      border: "1px solid rgba(239,68,68,.35)",
      background: "rgba(239,68,68,.12)",
      color: "#991b1b",
    };
  }

  return {
    border: "1px solid rgba(148,163,184,.35)",
    background: "rgba(148,163,184,.12)",
    color: "#334155",
  };
}

function paymentTone(status: string): "neutral" | "success" | "warning" | "danger" {
  if (status === "PAID") return "success";
  if (status === "PENDING") return "warning";
  if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") return "danger";
  return "neutral";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 14,
        padding: 16,
        color: "#475569",
        fontSize: 13,
        background: "rgba(248,250,252,.92)",
      }}
    >
      {message}
    </div>
  );
}

function QueueCard({
  row,
  fmtIDR,
  fmtDateTime,
  actionLabel,
  onAction,
}: {
  row: CashierBookingRow;
  fmtIDR: (value: number) => string;
  fmtDateTime: (value?: string | null) => string;
  actionLabel?: string;
  onAction?: (row: CashierBookingRow) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #dbe8f0",
        borderRadius: 14,
        padding: 12,
        background: "rgba(248,252,255,.92)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>{row.code}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            {row.customerName} • {row.productName}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 800,
              ...badgeStyle(paymentTone(row.paymentStatus)),
            }}
          >
            {row.paymentStatus}
          </span>
          {actionLabel && onAction ? (
            <button
              type="button"
              style={{
                ...form.primary,
                padding: "8px 12px",
                fontSize: 12,
              }}
              onClick={() => onAction(row)}
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" }}>Total</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{fmtIDR(row.totalAmount)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" }}>Lokasi</div>
          <div style={{ fontSize: 13, color: "#0f172a", marginTop: 4 }}>{row.locationText || "-"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" }}>
            Update
          </div>
          <div style={{ fontSize: 13, color: "#0f172a", marginTop: 4 }}>{fmtDateTime(row.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

export default function OverviewPanel({
  summary,
  recentBookings,
  pendingPayments,
  pendingXendit,
  loading,
  error,
  refreshing,
  onRefresh,
  onOpenCash,
  onOpenVerify,
  fmtIDR,
  fmtDateTime,
}: {
  summary: CashierSummary | null;
  recentBookings: CashierBookingRow[];
  pendingPayments: CashierBookingRow[];
  pendingXendit: CashierBookingRow[];
  loading?: boolean;
  error?: string | null;
  refreshing?: boolean;
  onRefresh: () => void;
  onOpenCash: (row: CashierBookingRow) => void;
  onOpenVerify: (row: CashierBookingRow) => void;
  fmtIDR: (value: number) => string;
  fmtDateTime: (value?: string | null) => string;
}) {
  if (loading && !summary) {
    return (
      <section style={{ ...card.panel, marginTop: 12 }}>
        <div style={card.panelTitle}>Overview</div>
        <div style={form.hint}>Memuat overview kasir dari backend...</div>
      </section>
    );
  }

  if (error && !summary) {
    return (
      <section style={{ ...card.panel, marginTop: 12 }}>
        <div style={card.panelTitle}>Overview</div>
        <div style={{ ...form.hint, color: "#b91c1c" }}>{error}</div>
        <button type="button" style={{ ...form.primary, marginTop: 12 }} onClick={onRefresh}>
          Coba Lagi
        </button>
      </section>
    );
  }

  if (!summary) {
    return (
      <section style={{ ...card.panel, marginTop: 12 }}>
        <div style={card.panelTitle}>Overview</div>
        <EmptyState message="Overview backend belum mengembalikan data apa pun." />
      </section>
    );
  }

  return (
    <section style={{ ...card.panel, marginTop: 12, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={card.panelTitle}>Overview Kasir</div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            Semua angka, antrian, dan booking di bawah ini diambil langsung dari backend aktif.
          </div>
        </div>
        <button type="button" style={form.primary} onClick={onRefresh} disabled={refreshing}>
          {refreshing ? "Menyegarkan..." : "Refresh Overview"}
        </button>
      </div>

      {error ? <div style={{ ...form.hint, color: "#b91c1c" }}>{error}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12 }}>
        {[
          { label: "Walk-in Hari Ini", value: String(summary.walkinsToday) },
          { label: "Check-in Hari Ini", value: String(summary.checkinsToday) },
          { label: "Pending Payment", value: String(summary.pendingPayments) },
          { label: "Revenue Hari Ini", value: fmtIDR(summary.revenueToday) },
          { label: "Verifikasi Xendit", value: String(summary.xenditAwaitingVerification) },
        ].map(item => (
          <div key={item.label} style={{ ...card.stat, minHeight: 100 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: ".04em" }}>
                {item.label}
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, lineHeight: 1.2, color: "#0b1220", marginTop: 8 }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={misc.line} />

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#102a43" }}>Booking Terbaru</div>
        {recentBookings.length === 0 ? (
          <EmptyState message="Belum ada booking yang tercatat di backend." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {recentBookings.map(item => (
              <QueueCard key={item.code} row={item} fmtIDR={fmtIDR} fmtDateTime={fmtDateTime} />
            ))}
          </div>
        )}
      </div>

      <div style={misc.line} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#102a43" }}>Pending Tunai/Transfer</div>
          {pendingPayments.length === 0 ? (
            <EmptyState message="Tidak ada booking pending yang siap ditandai tunai/transfer." />
          ) : (
            pendingPayments.map(item => (
              <QueueCard
                key={item.code}
                row={item}
                fmtIDR={fmtIDR}
                fmtDateTime={fmtDateTime}
                actionLabel="Mark Pembayaran"
                onAction={onOpenCash}
              />
            ))
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#102a43" }}>Pending Verifikasi Xendit</div>
          {pendingXendit.length === 0 ? (
            <EmptyState message="Tidak ada invoice Xendit yang menunggu verifikasi." />
          ) : (
            pendingXendit.map(item => (
              <QueueCard
                key={item.code}
                row={item}
                fmtIDR={fmtIDR}
                fmtDateTime={fmtDateTime}
                actionLabel="Verifikasi Xendit"
                onAction={onOpenVerify}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
