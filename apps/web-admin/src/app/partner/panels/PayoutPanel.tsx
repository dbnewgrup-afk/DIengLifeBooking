"use client";
import { S } from "../lib/styles";
import type { BalanceInfo, PayoutRow } from "../lib/types";
import { fmtIDR } from "../lib/utils";
import { Card } from "../ui/Card";

export function PayoutsPanel({ balance, payouts }: { balance: BalanceInfo; payouts: PayoutRow[] }) {
  return (
    <>
      <div style={{ ...S.gridAuto(260), marginBottom: 20 }}>
        <Card>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Saldo</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 6 }}>{fmtIDR(balance.balance)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Tersedia</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#065f46", marginTop: 6 }}>{fmtIDR(balance.available)}</div>
        </Card>
        <Card>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Diproses</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#92400e", marginTop: 6 }}>{fmtIDR(balance.pending)}</div>
        </Card>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#334155" }}>Riwayat Payout</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Cutoff berikut: {balance.nextCutoff ? new Date(balance.nextCutoff).toLocaleString("id-ID") : "-"}
          </div>
        </div>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Tanggal</th>
                <th style={S.th}>Kode</th>
                <th style={S.th}>Nominal</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 14, color: "#64748b" }}>
                    Belum ada payout.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => {
                  const tone = p.status === "PAID" ? "good" : p.status === "PENDING" ? "warn" : "danger";
                  return (
                    <tr key={p.id}>
                      <td style={S.td}>{new Date(p.createdAt).toLocaleString("id-ID")}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{p.id}</td>
                      <td style={S.td}>{fmtIDR(p.amount)}</td>
                      <td style={S.td}>
                        <span style={S.badge(tone as any)}>{p.status}</span>
                      </td>
                      <td style={S.td}>{p.note || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
