"use client";
import { S } from "../lib/styles";
import { fmtIDR } from "../lib/utils";
import type { WithdrawalReq } from "../lib/types";

export function WithdrawTable({ rows }: { rows: WithdrawalReq[] }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Tanggal</th>
            <th style={S.th}>Kode</th>
            <th style={S.th}>Nominal</th>
            <th style={S.th}>Tujuan</th>
            <th style={S.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: 14, color: "#64748b" }}>
                Belum ada permintaan.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const tone = r.status === "APPROVED" ? "good" : r.status === "PENDING" ? "warn" : "danger";
              return (
                <tr key={r.id}>
                  <td style={S.td}>{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{r.id}</td>
                  <td style={S.td}>{fmtIDR(r.amount)}</td>
                  <td style={S.td}>
                    {r.target.bank} • {r.target.accNo} ({r.target.accName})
                  </td>
                  <td style={S.td}>
                    <span style={S.badge(tone as any)}>{r.status}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
