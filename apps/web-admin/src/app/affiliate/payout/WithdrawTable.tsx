"use client";
import { C } from "../lib/styles";
import { fmtIDR } from "../lib/utils";
import type { WithdrawReq } from "../lib/types";

export function WithdrawTable({ rows }: { rows: WithdrawReq[] }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.96)",
        border: "1px solid #d1e5f0",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 12px 30px rgba(2,47,64,.12)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 8 }}>
        Riwayat Permintaan
      </div>
      <table style={C.table}>
        <thead>
          <tr>
            <th style={C.th}>Tanggal</th>
            <th style={C.th}>Kode</th>
            <th style={C.th}>Nominal</th>
            <th style={C.th}>Tujuan</th>
            <th style={C.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={C.td}>{new Date(r.createdAt).toLocaleString("id-ID")}</td>
              <td style={C.td}>{r.id}</td>
              <td style={C.td}>{fmtIDR(r.amount)}</td>
              <td style={C.td}>
                {r.bank} • {r.account}
                <div style={C.mutedSmall}>({r.owner})</div>
              </td>
              <td style={C.td}>
                {r.status === "APPROVED" ? (
                  <span style={C.chip("green")}>APPROVED</span>
                ) : r.status === "PENDING" ? (
                  <span style={C.chip("orange")}>PENDING</span>
                ) : (
                  <span style={C.chip("red")}>REJECTED</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
