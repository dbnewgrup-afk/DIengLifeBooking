"use client";
import { S } from "../lib/styles";
import { Card } from "../ui/Card";
import { KPI } from "../ui/KPI";
import type { GroupByKey, Owner } from "../lib/types";
import { fmtIDR, fmtInt } from "../lib/utils";

export function ReportsPanel({
  owners,
  ownerId,
  setOwnerId,
  groupBy,
  setGroupBy,
  grouped,
  totals,
  exportReport,
}: {
  owners: Owner[];
  ownerId: string;
  setOwnerId: (v: string) => void;
  groupBy: GroupByKey;
  setGroupBy: (g: GroupByKey) => void;
  grouped: Array<{ key: string; label: string; count: number; revenue: number }>;
  totals: { orders: number; revenue: number };
  exportReport: (type: "bookings" | "performance") => void;
}) {
  return (
    <>
      <Card>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <div style={S.label}>Listing</div>
            <select style={S.selectLight} value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="all">Semua Listing</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div style={S.label}>Group By</div>
            <select style={S.selectLight} value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupByKey)}>
              <option value="DAY">Per Day</option>
              <option value="WEEK">Per Week</option>
              <option value="MONTH">Per Month</option>
            </select>
          </div>
        </div>
      </Card>

      <div style={{ ...S.gridAuto(260), marginTop: 20 }}>
        <KPI label="Total Orders" value={fmtInt(totals.orders)} />
        <KPI label="Total Revenue" value={fmtIDR(totals.revenue)} />
      </div>

      <div style={{ ...S.gridAuto(320), marginTop: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Laporan Booking</div>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 0, marginBottom: 12 }}>Ekspor daftar booking dalam rentang tanggal.</p>
          <button onClick={() => exportReport("bookings")} style={S.btn}>
            Export CSV
          </button>
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>Laporan Performa</div>
          <p style={{ fontSize: 13, color: "#475569", marginTop: 0, marginBottom: 12 }}>Ekspor metrik performa (occupancy, revenue, dll).</p>
          <button onClick={() => exportReport("performance")} style={S.btn}>
            Export CSV
          </button>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#334155", marginBottom: 10 }}>
          Ringkasan per {groupBy === "DAY" ? "Hari" : groupBy === "WEEK" ? "Minggu" : "Bulan"}
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>{groupBy === "DAY" ? "Tanggal" : groupBy === "WEEK" ? "Minggu" : "Bulan"}</th>
                <th style={S.th}>Orders</th>
                <th style={S.th}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {grouped.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 14, color: "#64748b" }}>
                    Tidak ada data pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                grouped.map((r) => (
                  <tr key={r.key}>
                    <td style={S.td}>{r.label}</td>
                    <td style={S.td}>{fmtInt(r.count)}</td>
                    <td style={S.td}>{fmtIDR(r.revenue)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
