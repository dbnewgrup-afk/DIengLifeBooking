"use client";
import { useMemo, useState } from "react";
import { extractCmsContentEntries, summarizeCmsSectionContent } from "../lib/cms-content";
import { fmtDateTime, fmtIDR, fmtNum } from "../lib/utils";
import type { AffiliateRow, ApprovalItem, Kpi, PartnerRow, Product, Reports } from "../lib/types";
import type { HomepageCmsSection } from "../lib/homepage-cms";
import { ChartCard } from "../ui/ChartCard";
import DetailModal from "../ui/DetailModal";
import { EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle, BaseTable, TableFrame, Td, Th } from "../ui/Table";

export default function OverviewPanel({
  kpi,
  reports,
  products,
  sellers,
  approvals,
  affiliates,
  cmsSections,
  onOpenCmsDetail,
  onNavigateModule,
  loading = false,
  error = null,
}: {
  kpi: Kpi;
  reports: Reports;
  products: Product[];
  sellers: PartnerRow[];
  approvals: ApprovalItem[];
  affiliates: AffiliateRow[];
  cmsSections: HomepageCmsSection[];
  onOpenCmsDetail: (key: HomepageCmsSection["key"], entryId?: string | null) => void;
  onNavigateModule: (target: "AFFILIATES" | "APPROVALS" | "PARTNER" | "PRODUCTS" | "REPORTS") => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [selectedLiveSectionKey, setSelectedLiveSectionKey] = useState<HomepageCmsSection["key"] | null>(null);
  const liveSections = cmsSections.filter((section) => section.isVisible);
  const selectedLiveSection = useMemo(
    () => cmsSections.find((section) => section.key === selectedLiveSectionKey) ?? null,
    [cmsSections, selectedLiveSectionKey]
  );
  const selectedLiveEntries = useMemo(
    () =>
      selectedLiveSection
        ? extractCmsContentEntries(
            selectedLiveSection.key,
            selectedLiveSection.publishedContent ?? selectedLiveSection.draftContent
          )
        : [],
    [selectedLiveSection]
  );
  const isEmpty =
    kpi.bookingToday === 0 &&
    kpi.checkinToday === 0 &&
    kpi.checkoutToday === 0 &&
    kpi.pendingPayments === 0 &&
    kpi.revenue === 0 &&
    kpi.avgOrderValue === 0 &&
    kpi.paidRate === 0 &&
    reports.occupancy.length === 0 &&
    reports.revenue.length === 0 &&
    reports.clicks.length === 0 &&
    reports.topProducts.length === 0 &&
    reports.methodSplit.length === 0 &&
    products.length === 0 &&
    sellers.length === 0 &&
    approvals.length === 0 &&
    affiliates.length === 0 &&
    cmsSections.length === 0;

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Overview Operasional"
        subtitle="Ringkasan super admin untuk traffic, revenue, seller, konten homepage, dan item yang perlu ditindaklanjuti. Semua kartu di bawah memakai data live dari backend."
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat overview..."
          message="KPI, snapshot modul, konten live, dan statistik ringkas sedang diambil dari backend."
        />
      ) : error ? (
        <ErrorStateCard title="Gagal memuat overview" message={error} />
      ) : isEmpty ? (
        <EmptyTableState message="Belum ada data overview yang bisa diringkas dari backend." />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <MetricCard label="Booking Hari Ini" value={fmtNum(kpi.bookingToday)} helper={`${fmtNum(kpi.pendingPayments)} pending payment`} />
            <MetricCard label="Check-in Hari Ini" value={fmtNum(kpi.checkinToday)} helper="Reservasi mulai hari ini" />
            <MetricCard label="Check-out Hari Ini" value={fmtNum(kpi.checkoutToday)} helper="Reservasi selesai hari ini" />
            <MetricCard label="Revenue Tercatat" value={fmtIDR(kpi.revenue ?? 0)} helper={`Paid rate ${fmtNum(kpi.paidRate ?? 0)}%`} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 14,
              marginBottom: 18,
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.25fr) minmax(320px,1fr)",
              gap: 16,
              alignItems: "start",
            }}
          >
            <div
              style={{
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(15,23,42,.28)",
                backdropFilter: "blur(10px)",
                padding: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 12 }}>
                Yang tampil di web
              </div>
              {liveSections.length === 0 ? (
                <EmptyTableState message="Belum ada section homepage yang aktif." />
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {liveSections.map((section) => (
                    <div
                      key={section.id}
                      style={{
                        borderRadius: 16,
                        background: "rgba(255,255,255,.9)",
                        border: "1px solid rgba(226,232,240,1)",
                        padding: 14,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                        <div style={{ fontWeight: 900, color: "#0f172a" }}>{section.label}</div>
                        <span
                          style={{
                            borderRadius: 999,
                            padding: "5px 10px",
                            fontSize: 11,
                            fontWeight: 800,
                            background: "rgba(16,185,129,.12)",
                            color: "#065f46",
                          }}
                        >
                          Live
                        </span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                        {summarizeCmsSectionContent(section.key, section.publishedContent ?? section.draftContent)}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                        Update terakhir {fmtDateTime(section.updatedAt)}
                      </div>
                      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLiveSectionKey(section.key)}
                          style={{
                            borderRadius: 999,
                            border: "1px solid rgba(56,174,204,.35)",
                            background: "rgba(56,174,204,.12)",
                            color: "#0f3b4c",
                            padding: "8px 12px",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <SnapshotCard
                title="Snapshot modul"
                rows={[
                  {
                    label: "Seller aktif / total",
                    value: `${fmtNum(sellers.filter((item) => item.status === "ACTIVE").length)} / ${fmtNum(sellers.length)}`,
                    onClick: () => onNavigateModule("PARTNER"),
                  },
                  {
                    label: "Produk publish",
                    value: fmtNum(products.filter((item) => item.status === "APPROVED").length),
                    onClick: () => onNavigateModule("PRODUCTS"),
                  },
                  {
                    label: "Need approval",
                    value: fmtNum(approvals.length),
                    onClick: () => onNavigateModule("APPROVALS"),
                  },
                    {
                    label: "Affiliate campaign aktif",
                    value: fmtNum(affiliates.filter((item) => item.isActive).length),
                    onClick: () => onNavigateModule("AFFILIATES"),
                  },
                  {
                    label: "AOV",
                    value: fmtIDR(kpi.avgOrderValue ?? 0),
                    onClick: () => onNavigateModule("REPORTS"),
                  },
                ]}
              />

              <div
                style={{
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(15,23,42,.28)",
                  backdropFilter: "blur(10px)",
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 12 }}>
                  Top products
                </div>
                {reports.topProducts.length === 0 ? (
                  <EmptyTableState message="Belum ada produk dengan penjualan tercatat." />
                ) : (
                  <TableFrame minWidth={480}>
                    <BaseTable>
                      <colgroup>
                        <col style={{ width: "44%" }} />
                        <col style={{ width: "18%" }} />
                        <col style={{ width: "38%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <Th>Produk</Th>
                          <Th style={{ textAlign: "right" }}>Order</Th>
                          <Th style={{ textAlign: "right" }}>Revenue</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.topProducts.map((product) => (
                          <tr key={product.id}>
                            <Td style={{ fontWeight: 700 }}>{product.name}</Td>
                            <Td style={{ textAlign: "right" }}>{fmtNum(product.orders)}</Td>
                            <Td style={{ textAlign: "right", fontWeight: 800 }}>{fmtIDR(product.revenue)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </BaseTable>
                  </TableFrame>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <DetailModal
        open={Boolean(selectedLiveSection)}
        onClose={() => setSelectedLiveSectionKey(null)}
        title={selectedLiveSection?.label || "Detail section"}
        subtitle={
          selectedLiveSection
            ? summarizeCmsSectionContent(
                selectedLiveSection.key,
                selectedLiveSection.publishedContent ?? selectedLiveSection.draftContent
              )
            : undefined
        }
        meta={
          selectedLiveSection
            ? [
                { label: "Section key", value: selectedLiveSection.key },
                { label: "Status", value: selectedLiveSection.isVisible ? "Live" : "Hidden" },
                { label: "Updated", value: fmtDateTime(selectedLiveSection.updatedAt) },
                { label: "Total item", value: fmtNum(selectedLiveEntries.length) },
              ]
            : []
        }
        data={selectedLiveSection?.publishedContent ?? selectedLiveSection?.draftContent ?? {}}
        showRawData
        content={
          selectedLiveSection ? (
            <div className="grid gap-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Detail konten live
              </div>
              {selectedLiveEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Section ini belum punya item yang bisa dirinci.
                </div>
              ) : (
                selectedLiveEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="text-sm font-bold text-slate-900">{entry.title}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-600">{entry.summary}</div>
                  </div>
                ))
              )}
            </div>
          ) : null
        }
        footer={
          selectedLiveSection ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenCmsDetail(selectedLiveSection.key, selectedLiveEntries[0]?.id ?? null);
                  setSelectedLiveSectionKey(null);
                }}
                className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900"
              >
                Buka editor CMS
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}

function MetricCard({
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
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,.92)",
        border: "1px solid rgba(226,232,240,.95)",
        boxShadow: "0 14px 34px rgba(15,23,42,.10)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: ".04em" }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>{helper}</div>
    </div>
  );
}

function SnapshotCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string; onClick?: () => void }>;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,.18)",
        background: "rgba(15,23,42,.28)",
        backdropFilter: "blur(10px)",
        padding: 16,
      }}
      >
        <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 12 }}>{title}</div>
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row) => (
            <button
              key={row.label}
              type="button"
              onClick={row.onClick}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,.9)",
                border: "1px solid rgba(226,232,240,1)",
                padding: "12px 14px",
                cursor: row.onClick ? "pointer" : "default",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13, color: "#475569" }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{row.value}</span>
            </button>
          ))}
        </div>
    </div>
  );
}
