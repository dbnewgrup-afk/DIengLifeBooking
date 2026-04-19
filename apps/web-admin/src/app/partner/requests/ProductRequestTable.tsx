"use client";
import { S } from "../lib/styles";
import type { ProductReq } from "../lib/types";

export function ProductRequestTable({ rows }: { rows: ProductReq[] }) {
  return (
    <div style={S.tableWrap}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Tanggal</th>
            <th style={S.th}>Kode</th>
            <th style={S.th}>Produk</th>
            <th style={S.th}>Kategori</th>
            <th style={S.th}>Aksi</th>
            <th style={S.th}>Status</th>
            <th style={S.th}>Alasan</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 14, color: "#64748b" }}>
                Belum ada request.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const tone = r.status === "APPROVED" ? "good" : r.status === "PENDING" ? "warn" : "danger";
              return (
                <tr key={r.id}>
                  <td style={S.td}>{new Date(r.createdAt).toLocaleString("id-ID")}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{r.id}</td>
                  <td style={S.td}>{r.product.name}</td>
                  <td style={S.td}>{r.product.type}</td>
                  <td style={S.td}>{r.action}</td>
                  <td style={S.td}>
                    <span style={S.badge(tone as any)}>{r.status}</span>
                  </td>
                  <td style={S.td}>{r.reason || "-"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
