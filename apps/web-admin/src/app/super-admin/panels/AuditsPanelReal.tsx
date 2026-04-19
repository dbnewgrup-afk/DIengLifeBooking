"use client";

import React, { useMemo, useState } from "react";
import { fmtDateTime } from "../lib/utils";
import type { AuditItem } from "../lib/types";
import { BaseTable, EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle, TableFrame, Td, Th } from "../ui/Table";
import ActionButtons from "../ui/ActionButtons";
import DetailModal from "../ui/DetailModal";
import FilterToolbar from "../ui/FilterToolbar";

export default function AuditsPanelReal({
  rows,
  onReview,
  onDelete,
  busyId,
  busyAction,
  loading = false,
  error = null,
}: {
  rows: AuditItem[];
  onReview: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busyId?: string | null;
  busyAction?: "review" | "delete" | null;
  loading?: boolean;
  error?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const selectedAudit = useMemo(() => rows.find((row) => row.id === selectedId) ?? null, [rows, selectedId]);
  const filteredRows = useMemo(
    () =>
      rows.filter((audit) => {
        const matchesQuery =
          !query ||
          [audit.actorName, audit.action, audit.targetType, audit.targetId ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase());
        const role = audit.actorRole || "SYSTEM";
        return (roleFilter === "ALL" || role === roleFilter) && matchesQuery;
      }),
    [rows, query, roleFilter]
  );

  const isReviewing = (id: string) => busyId === id && busyAction === "review";
  const isDeleting = (id: string) => busyId === id && busyAction === "delete";

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Audit Trail"
        subtitle="Log audit ini berasal dari tabel audit backend. Tujuannya supaya super admin bisa lihat siapa melakukan aksi apa dan kapan."
      />

      <FilterToolbar
        totalLabel={`${filteredRows.length} dari ${rows.length} log`}
        onReset={() => {
          setQuery("");
          setRoleFilter("ALL");
        }}
        fields={[
          {
            key: "query",
            label: "Cari log",
            type: "search",
            value: query,
            placeholder: "Aktor, aksi, target...",
            onChange: setQuery,
          },
          {
            key: "role",
            label: "Role aktor",
            type: "select",
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: "Semua role", value: "ALL" },
              ...Array.from(new Set(rows.map((item) => item.actorRole || "SYSTEM"))).map((role) => ({
                label: role,
                value: role,
              })),
            ],
          },
        ]}
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat audit trail..."
          message="Log audit backend sedang diambil supaya aksi operasional bisa ditelusuri."
        />
      ) : error ? (
        <ErrorStateCard title="Gagal memuat audit trail" message={error} />
      ) : filteredRows.length === 0 ? (
        <EmptyTableState message="Belum ada log audit yang tercatat." />
      ) : (
        <TableFrame minWidth={980}>
          <BaseTable>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Aktor</Th>
                <Th>Aksi</Th>
                <Th>Target</Th>
                <Th>IP</Th>
                <Th>Waktu</Th>
                <Th style={{ textAlign: "right" }}>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((audit) => (
                <tr key={audit.id}>
                  <Td>
                    <div style={{ fontWeight: 800 }}>{audit.actorName}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      {audit.actorRole || "SYSTEM"}
                    </div>
                  </Td>
                  <Td style={{ fontWeight: 700 }}>{audit.action}</Td>
                  <Td>
                    <div style={{ fontWeight: 700 }}>{audit.targetType}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      {audit.targetId || "-"}
                    </div>
                  </Td>
                  <Td>{audit.ipAddress || "-"}</Td>
                  <Td>{fmtDateTime(audit.createdAt)}</Td>
                  <Td style={{ textAlign: "right" }}>
                    <ActionButtons
                      onView={() => setSelectedId(audit.id)}
                      onDelete={() => {
                        void onDelete(audit.id).catch(() => undefined);
                      }}
                      disableDelete={isDeleting(audit.id)}
                      showEdit={false}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </TableFrame>
      )}

      <DetailModal
        open={Boolean(selectedAudit)}
        onClose={() => setSelectedId(null)}
        title={selectedAudit?.action || "Detail audit"}
        subtitle={selectedAudit ? `${selectedAudit.actorName} -> ${selectedAudit.targetType}` : undefined}
        meta={
          selectedAudit
            ? [
                { label: "Role", value: selectedAudit.actorRole || "SYSTEM" },
                { label: "Target ID", value: selectedAudit.targetId || "-" },
                { label: "IP", value: selectedAudit.ipAddress || "-" },
                { label: "Waktu", value: fmtDateTime(selectedAudit.createdAt) },
              ]
            : []
        }
        data={selectedAudit ?? {}}
        footer={
          selectedAudit ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isReviewing(selectedAudit.id)}
                onClick={async () => {
                  try {
                    await onReview(selectedAudit.id);
                  } catch {
                    // Error toast ditangani parent.
                  }
                }}
                className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {isReviewing(selectedAudit.id) ? "Mereview..." : "Review log ini"}
              </button>
              <button
                type="button"
                disabled={isDeleting(selectedAudit.id)}
                onClick={async () => {
                  try {
                    await onDelete(selectedAudit.id);
                  } catch {
                    // Error toast ditangani parent.
                  }
                }}
                className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
              >
                {isDeleting(selectedAudit.id) ? "Menghapus..." : "Delete log"}
              </button>
            </div>
          ) : null
        }
      />
    </section>
  );
}
