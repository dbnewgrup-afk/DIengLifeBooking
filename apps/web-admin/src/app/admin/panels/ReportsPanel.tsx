"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { api } from "@/lib/api/client";
import { C } from "../lib/styles";

type ReportsOverviewResponse = {
  ok: true;
  kpis?: {
    revenue?: number;
    orders?: number;
    avgOrderValue?: number;
    paidRate?: number;
    checkinToday?: number;
    checkoutToday?: number;
    pendingPayments?: number;
  };
  byDay?: Array<{
    label: string;
    orders: number;
    revenue: number;
  }>;
  methodSplit?: Array<{
    name: string;
    count: number;
  }>;
  topProducts?: Array<{
    id: string;
    name: string;
    orders: number;
    revenue: number;
  }>;
};

const panelStyle = C.panel as CSSProperties;
const panelTitleStyle = C.panelTitle as CSSProperties;

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat("id-ID");

const cardGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const cardStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid #dbe7ef",
  background: "linear-gradient(180deg, rgba(248,250,252,.96), rgba(255,255,255,1))",
  padding: 14,
  color: "#102a43",
};

const boxStyle: CSSProperties = {
  borderRadius: 14,
  border: "1px solid #dbe7ef",
  background: "linear-gradient(180deg, rgba(248,250,252,.96), rgba(255,255,255,1))",
  padding: 16,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 13,
};

function isEmptyReport(data: ReportsOverviewResponse | null) {
  if (!data) return true;

  const kpis = data.kpis ?? {};
  const kpiValues = [
    kpis.revenue ?? 0,
    kpis.orders ?? 0,
    kpis.avgOrderValue ?? 0,
    kpis.paidRate ?? 0,
    kpis.checkinToday ?? 0,
    kpis.checkoutToday ?? 0,
    kpis.pendingPayments ?? 0,
  ];

  return (
    kpiValues.every((value) => value === 0) &&
    (data.byDay?.length ?? 0) === 0 &&
    (data.methodSplit?.length ?? 0) === 0 &&
    (data.topProducts?.length ?? 0) === 0
  );
}

function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", color: "#5d7080", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, color: "#102a43" }}>{value}</div>
      {helper ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#526779", lineHeight: 1.6 }}>{helper}</div>
      ) : null}
    </div>
  );
}

export default function ReportsPanel() {
  const [data, setData] = useState<ReportsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ReportsOverviewResponse>("/reports/admin/overview");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const dailyStats = useMemo(() => (data?.byDay ?? []).slice(-7).reverse(), [data]);
  const methodSplit = data?.methodSplit ?? [];
  const topProducts = data?.topProducts ?? [];
  const kpis = data?.kpis ?? {};
  const empty = isEmptyReport(data);

  return (
    <section style={panelStyle}>
      <div style={panelTitleStyle}>Reports</div>

      {loading ? (
        <div style={boxStyle}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43" }}>Loading laporan admin...</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.7, color: "#526779" }}>
            Mengambil summary dan statistik utama langsung dari backend.
          </p>
        </div>
      ) : null}

      {!loading && error ? (
        <div style={boxStyle}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#7f1d1d" }}>Gagal memuat reports</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.7, color: "#7f1d1d" }}>{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            style={{
              marginTop: 12,
              borderRadius: 999,
              border: "1px solid rgba(239,68,68,.28)",
              background: "rgba(254,242,242,1)",
              color: "#991b1b",
              fontSize: 12,
              fontWeight: 800,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {!loading && !error && empty ? (
        <div style={boxStyle}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43" }}>Belum ada data laporan</div>
          <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.7, color: "#526779" }}>
            Endpoint reports sudah terhubung ke backend, tetapi saat ini belum ada data summary atau statistik yang bisa ditampilkan.
          </p>
        </div>
      ) : null}

      {!loading && !error && !empty ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={cardGridStyle}>
            <KpiCard label="Revenue" value={currency.format(kpis.revenue ?? 0)} helper="Total revenue booking paid." />
            <KpiCard label="Orders" value={integer.format(kpis.orders ?? 0)} helper="Total booking dalam periode report." />
            <KpiCard
              label="Avg Order Value"
              value={currency.format(kpis.avgOrderValue ?? 0)}
              helper="Nilai rata-rata order yang berhasil dibayar."
            />
            <KpiCard label="Paid Rate" value={`${integer.format(kpis.paidRate ?? 0)}%`} helper="Persentase order yang sudah paid." />
            <KpiCard label="Check-in Hari Ini" value={integer.format(kpis.checkinToday ?? 0)} />
            <KpiCard label="Check-out Hari Ini" value={integer.format(kpis.checkoutToday ?? 0)} />
            <KpiCard label="Pending Payment" value={integer.format(kpis.pendingPayments ?? 0)} />
          </div>

          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, .8fr)" }}>
            <div style={boxStyle}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 12 }}>Statistik Harian</div>
              {dailyStats.length === 0 ? (
                <div style={{ fontSize: 13, color: "#526779" }}>Belum ada statistik harian.</div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "0 0 10px", color: "#5d7080" }}>Tanggal</th>
                      <th style={{ textAlign: "right", padding: "0 0 10px", color: "#5d7080" }}>Orders</th>
                      <th style={{ textAlign: "right", padding: "0 0 10px", color: "#5d7080" }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((row) => (
                      <tr key={row.label}>
                        <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", color: "#102a43", fontWeight: 700 }}>
                          {row.label}
                        </td>
                        <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", textAlign: "right", color: "#102a43" }}>
                          {integer.format(row.orders)}
                        </td>
                        <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", textAlign: "right", color: "#102a43", fontWeight: 700 }}>
                          {currency.format(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={boxStyle}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 12 }}>Metode Pembayaran</div>
              {methodSplit.length === 0 ? (
                <div style={{ fontSize: 13, color: "#526779" }}>Belum ada distribusi metode pembayaran.</div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {methodSplit.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        borderRadius: 12,
                        border: "1px solid #e7eef4",
                        padding: "10px 12px",
                        background: "#f8fbfd",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#102a43" }}>{item.name}</span>
                      <span style={{ fontSize: 13, color: "#526779" }}>{integer.format(item.count)} transaksi</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={boxStyle}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 12 }}>Top Products</div>
            {topProducts.length === 0 ? (
              <div style={{ fontSize: 13, color: "#526779" }}>Belum ada data produk teratas.</div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "0 0 10px", color: "#5d7080" }}>Produk</th>
                    <th style={{ textAlign: "right", padding: "0 0 10px", color: "#5d7080" }}>Orders</th>
                    <th style={{ textAlign: "right", padding: "0 0 10px", color: "#5d7080" }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr key={product.id}>
                      <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", color: "#102a43", fontWeight: 700 }}>
                        {product.name}
                      </td>
                      <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", textAlign: "right", color: "#102a43" }}>
                        {integer.format(product.orders)}
                      </td>
                      <td style={{ padding: "10px 0", borderTop: "1px solid #e7eef4", textAlign: "right", color: "#102a43", fontWeight: 700 }}>
                        {currency.format(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
