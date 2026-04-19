"use client";
import React, { useMemo, useState } from "react";
import { BaseTable, EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle, TableFrame, Td, Th } from "../ui/Table";
import { fmtDateTime, fmtIDR, fmtNum } from "../lib/utils";
import type { AffiliateRow } from "../lib/types";
import ActionButtons from "../ui/ActionButtons";
import DetailModal from "../ui/DetailModal";
import FilterToolbar from "../ui/FilterToolbar";

export default function AffiliatesPanel({
  rows,
  loading = false,
  error = null,
}: {
  rows: AffiliateRow[];
  loading?: boolean;
  error?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const selectedAffiliate = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId]
  );
  const filteredRows = useMemo(
    () =>
      rows.filter((affiliate) => {
        const matchesQuery =
          !query ||
          [affiliate.name, affiliate.code, affiliate.category]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesCategory = categoryFilter === "ALL" || affiliate.category === categoryFilter;
        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" ? affiliate.isActive : !affiliate.isActive);
        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [rows, query, categoryFilter, statusFilter]
  );

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Affiliates"
        subtitle="Panel ini memakai data affiliate/referral yang terlacak dari booking. Domain affiliate sekarang dipisahkan dari promo, jadi tabel ini bersifat analytics/read-only."
      />

      <FilterToolbar
        totalLabel={`${filteredRows.length} dari ${rows.length} affiliate`}
        onReset={() => {
          setQuery("");
          setCategoryFilter("ALL");
          setStatusFilter("ALL");
        }}
        fields={[
          {
            key: "query",
            label: "Cari campaign",
            type: "search",
            value: query,
            placeholder: "Nama, kode, kategori...",
            onChange: setQuery,
          },
          {
            key: "category",
            label: "Kategori",
            type: "select",
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: "Semua kategori", value: "ALL" },
              ...Array.from(new Set(rows.map((item) => item.category))).map((category) => ({
                label: category,
                value: category,
              })),
            ],
          },
          {
            key: "status",
            label: "Status campaign",
            type: "select",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua status", value: "ALL" },
              { label: "Aktif", value: "ACTIVE" },
              { label: "Nonaktif", value: "INACTIVE" },
            ],
          },
        ]}
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat affiliate..."
          message="Ringkasan affiliate dan referral sedang diambil dari backend."
        />
      ) : error ? (
        <ErrorStateCard
          title="Gagal memuat affiliate"
          message={error}
        />
      ) : filteredRows.length === 0 ? (
        <EmptyTableState message="Belum ada data affiliate/referral yang bisa diringkas." />
      ) : (
        <TableFrame minWidth={980}>
          <BaseTable>
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Campaign</Th>
                <Th>Kode</Th>
                <Th>Kategori</Th>
                <Th style={{ textAlign: "right" }}>Booking</Th>
                <Th style={{ textAlign: "right" }}>Paid</Th>
                <Th style={{ textAlign: "right" }}>Revenue</Th>
                <Th style={{ textAlign: "right" }}>Diskon</Th>
                <Th style={{ textAlign: "right" }}>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((affiliate) => (
                <tr key={affiliate.id}>
                  <Td>
                    <div style={{ fontWeight: 800 }}>{affiliate.name}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      {affiliate.isActive ? "Aktif" : "Nonaktif"} • update {fmtDateTime(affiliate.updatedAt)}
                    </div>
                  </Td>
                  <Td style={{ fontWeight: 800 }}>{affiliate.code}</Td>
                  <Td>{affiliate.category}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtNum(affiliate.bookings)}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtNum(affiliate.paidOrders)}</Td>
                  <Td style={{ textAlign: "right", fontWeight: 800 }}>{fmtIDR(affiliate.attributedRevenue)}</Td>
                  <Td style={{ textAlign: "right" }}>{fmtIDR(affiliate.totalDiscount)}</Td>
                  <Td style={{ textAlign: "right" }}>
                    <ActionButtons
                      onView={() => setSelectedId(affiliate.id)}
                      showEdit={false}
                      showDelete={false}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </TableFrame>
      )}

      <DetailModal
        open={Boolean(selectedAffiliate)}
        onClose={() => setSelectedId(null)}
        title={selectedAffiliate?.name || "Detail affiliate"}
        subtitle={selectedAffiliate ? `Kode ${selectedAffiliate.code}` : undefined}
        meta={
          selectedAffiliate
            ? [
                { label: "Kategori", value: selectedAffiliate.category },
                { label: "Status", value: selectedAffiliate.isActive ? "Aktif" : "Nonaktif" },
                { label: "Booking", value: fmtNum(selectedAffiliate.bookings) },
                { label: "Paid", value: fmtNum(selectedAffiliate.paidOrders) },
                { label: "Revenue", value: fmtIDR(selectedAffiliate.attributedRevenue) },
                { label: "Diskon", value: fmtIDR(selectedAffiliate.totalDiscount) },
              ]
            : []
        }
        data={selectedAffiliate ?? {}}
        footer={
          selectedAffiliate ? (
            <div className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Domain affiliate bersifat analytics. Ubah campaign promo dari modul promo, bukan dari panel ini.
            </div>
          ) : null
        }
      />
    </section>
  );
}
