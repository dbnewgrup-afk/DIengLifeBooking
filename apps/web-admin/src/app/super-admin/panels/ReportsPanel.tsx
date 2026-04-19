"use client";
import { fmtIDR, fmtNum } from "../lib/utils";
import type { Reports } from "../lib/types";
import { ChartCard } from "../ui/ChartCard";
import { BaseTable, EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle, TableFrame, Td, Th } from "../ui/Table";

export default function ReportsPanel({
  reports,
  loading = false,
  error = null,
}: {
  reports: Reports;
  loading?: boolean;
  error?: string | null;
}) {
  const isEmpty =
    reports.occupancy.length === 0 &&
    reports.revenue.length === 0 &&
    reports.clicks.length === 0 &&
    reports.methodSplit.length === 0 &&
    reports.topProducts.length === 0;

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Reports"
        subtitle="Ringkasan 7 hari terakhir dari backend: tren order dan revenue, distribusi metode pembayaran, serta produk dengan revenue tertinggi."
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat reports..."
          message="Statistik order, revenue, metode pembayaran, dan top products sedang diambil dari backend."
        />
      ) : error ? (
        <ErrorStateCard title="Gagal memuat reports" message={error} />
      ) : isEmpty ? (
        <EmptyTableState message="Belum ada data reports untuk periode ini." />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <ChartCard
              title="Order / hari"
              data={(reports.occupancy ?? []).map((p) => ({ t: p.label, v: p.value }))}
              tone="#22C55E"
            />

            <ChartCard
              title="Revenue (x100k)"
              data={(reports.revenue ?? []).map((p) => ({
                t: p.label,
                v: Math.round(p.value / 100000),
              }))}
              tone="#2AA0C8"
            />

            <ChartCard
              title="Avg order value / hari"
              data={(reports.clicks ?? []).map((p) => ({ t: p.label, v: p.value }))}
              tone="#38BDF8"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 12 }}>Metode pembayaran</div>
              {reports.methodSplit.length === 0 ? (
                <EmptyTableState message="Belum ada transaksi pembayaran." />
              ) : (
                <TableFrame minWidth={420}>
                  <BaseTable>
                    <colgroup>
                      <col style={{ width: "65%" }} />
                      <col style={{ width: "35%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <Th>Provider</Th>
                        <Th style={{ textAlign: "right" }}>Jumlah</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.methodSplit.map((item) => (
                        <tr key={item.name}>
                          <Td style={{ fontWeight: 700 }}>{item.name}</Td>
                          <Td style={{ textAlign: "right" }}>{fmtNum(item.count)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </BaseTable>
                </TableFrame>
              )}
            </div>

            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 12 }}>Top products</div>
              {reports.topProducts.length === 0 ? (
                <EmptyTableState message="Belum ada top products untuk periode ini." />
              ) : (
                <TableFrame minWidth={520}>
                  <BaseTable>
                    <colgroup>
                      <col style={{ width: "54%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "30%" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <Th>Produk</Th>
                        <Th style={{ textAlign: "right" }}>Order</Th>
                        <Th style={{ textAlign: "right" }}>Revenue</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.topProducts.map((item) => (
                        <tr key={item.id}>
                          <Td style={{ fontWeight: 700 }}>{item.name}</Td>
                          <Td style={{ textAlign: "right" }}>{fmtNum(item.orders)}</Td>
                          <Td style={{ textAlign: "right", fontWeight: 800 }}>{fmtIDR(item.revenue)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </BaseTable>
                </TableFrame>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
