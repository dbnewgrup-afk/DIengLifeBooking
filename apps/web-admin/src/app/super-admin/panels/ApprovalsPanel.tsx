"use client";
import { useMemo, useState } from "react";
import { fmtDateTime } from "../lib/utils";
import type { ApprovalItem } from "../lib/types";
import { BaseTable, EmptyTableState, ErrorStateCard, LoadingStateCard, SectionTitle, TableFrame, Td, Th } from "../ui/Table";
import DetailModal from "../ui/DetailModal";
import FilterToolbar from "../ui/FilterToolbar";

export default function ApprovalsPanel({
  approvals,
  onApprove,
  onReject,
  onComplete,
  busyId,
  busyAction,
  loading = false,
  error = null,
}: {
  approvals: ApprovalItem[];
  onApprove: (approval: ApprovalItem) => Promise<void>;
  onReject: (approval: ApprovalItem) => Promise<void>;
  onComplete: (approval: ApprovalItem) => Promise<void>;
  busyId?: string | null;
  busyAction?: "approve" | "reject" | "complete" | null;
  loading?: boolean;
  error?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const selectedApproval = useMemo(
    () => approvals.find((approval) => approval.id === selectedId) ?? null,
    [approvals, selectedId]
  );
  const filteredApprovals = useMemo(
    () =>
      approvals.filter((approval) => {
        const matchesQuery =
          !query ||
          [approval.code, approval.reason, approval.by].join(" ").toLowerCase().includes(query.toLowerCase());
        const matchesType = typeFilter === "ALL" || approval.type === typeFilter;
        const matchesStatus = statusFilter === "ALL" || approval.status === statusFilter;
        return matchesQuery && matchesType && matchesStatus;
      }),
    [approvals, query, typeFilter, statusFilter]
  );
  const isApproving = (id: string) => busyId === id && busyAction === "approve";
  const isRejecting = (id: string) => busyId === id && busyAction === "reject";
  const isCompleting = (id: string) => busyId === id && busyAction === "complete";

  return (
    <section style={{ marginTop: 18 }}>
      <SectionTitle
        title="Approvals"
        subtitle="Semua item di sini diambil dari record yang memang menunggu review atau tindakan final: seller, listing, review booking, affiliate withdraw, dan payout batch yang belum tuntas."
      />

      <FilterToolbar
        totalLabel={`${filteredApprovals.length} dari ${approvals.length} approval`}
        onReset={() => {
          setQuery("");
          setTypeFilter("ALL");
          setStatusFilter("ALL");
        }}
        fields={[
          {
            key: "query",
            label: "Cari approval",
            type: "search",
            value: query,
            placeholder: "Kode, catatan, requester...",
            onChange: setQuery,
          },
          {
            key: "type",
            label: "Tipe",
            type: "select",
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: "Semua tipe", value: "ALL" },
              { label: "SELLER", value: "SELLER" },
              { label: "LISTING", value: "LISTING" },
              { label: "PAYOUT", value: "PAYOUT" },
              { label: "AFFILIATE_WITHDRAW", value: "AFFILIATE_WITHDRAW" },
              { label: "REVIEW", value: "REVIEW" },
            ],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua status", value: "ALL" },
              { label: "PENDING", value: "PENDING" },
              { label: "APPROVED", value: "APPROVED" },
              { label: "PROCESSING", value: "PROCESSING" },
              { label: "FAILED", value: "FAILED" },
            ],
          },
        ]}
      />

      {loading ? (
        <LoadingStateCard
          title="Memuat approvals..."
          message="Inbox approval seller, listing, dan payout sedang diambil dari backend."
        />
      ) : error ? (
        <ErrorStateCard title="Gagal memuat approvals" message={error} />
      ) : filteredApprovals.length === 0 ? (
        <EmptyTableState message="Saat ini tidak ada approval yang menunggu tindakan." />
      ) : (
        <TableFrame minWidth={940}>
          <BaseTable>
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "34%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <Th>Kode</Th>
                <Th>Tipe</Th>
                <Th>Catatan</Th>
                <Th>Requester</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: "right" }}>Aksi</Th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map((approval) => (
                <tr key={approval.id}>
                  <Td style={{ fontWeight: 800 }}>{approval.code}</Td>
                  <Td>{approval.type}</Td>
                  <Td>
                    <div style={{ fontWeight: 700 }}>{approval.reason}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                      Masuk {fmtDateTime(approval.createdAt)}
                    </div>
                  </Td>
                  <Td>{approval.by}</Td>
                  <Td>
                    <StatusPill status={approval.status} />
                  </Td>
                  <Td style={{ textAlign: "right" }}>
                    <ApprovalActionRow
                      approval={approval}
                      onView={() => setSelectedId(approval.id)}
                      onApprove={async () => {
                        try {
                          await onApprove(approval);
                        } catch {
                          // Error toast ditangani parent.
                        }
                      }}
                      onReject={async () => {
                        try {
                          await onReject(approval);
                        } catch {
                          // Error toast ditangani parent.
                        }
                      }}
                      onComplete={async () => {
                        try {
                          await onComplete(approval);
                        } catch {
                          // Error toast ditangani parent.
                        }
                      }}
                      approving={isApproving(approval.id)}
                      rejecting={isRejecting(approval.id)}
                      completing={isCompleting(approval.id)}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </BaseTable>
        </TableFrame>
      )}

      <DetailModal
        open={Boolean(selectedApproval)}
        onClose={() => setSelectedId(null)}
        title={selectedApproval?.code || "Detail approval"}
        subtitle={selectedApproval ? `Request by ${selectedApproval.by}` : undefined}
        meta={
          selectedApproval
            ? [
                { label: "Type", value: selectedApproval.type },
                { label: "Status", value: selectedApproval.status },
                { label: "Created", value: fmtDateTime(selectedApproval.createdAt) },
              ]
            : []
        }
        data={selectedApproval ?? {}}
        footer={
          selectedApproval ? (
            <div className="flex flex-wrap justify-end gap-2">
              {getApprovalCapabilities(selectedApproval).canApprove ? (
                <button
                  type="button"
                  disabled={isApproving(selectedApproval.id)}
                  onClick={async () => {
                    try {
                      await onApprove(selectedApproval);
                    } catch {
                      // Error toast ditangani parent.
                    }
                  }}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-60"
                >
                  {isApproving(selectedApproval.id) ? "Memproses..." : "Approve approval"}
                </button>
              ) : null}
              {getApprovalCapabilities(selectedApproval).canReject ? (
                <button
                  type="button"
                  disabled={isRejecting(selectedApproval.id)}
                  onClick={async () => {
                    try {
                      await onReject(selectedApproval);
                    } catch {
                      // Error toast ditangani parent.
                    }
                  }}
                  className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60"
                >
                  {isRejecting(selectedApproval.id) ? "Memproses..." : "Reject approval"}
                </button>
              ) : null}
              {getApprovalCapabilities(selectedApproval).canComplete ? (
                <button
                  type="button"
                  disabled={isCompleting(selectedApproval.id)}
                  onClick={async () => {
                    try {
                      await onComplete(selectedApproval);
                    } catch {
                      // Error toast ditangani parent.
                    }
                  }}
                  className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 disabled:opacity-60"
                >
                  {isCompleting(selectedApproval.id) ? "Memproses..." : "Mark paid"}
                </button>
              ) : null}
              {!getApprovalCapabilities(selectedApproval).canApprove &&
              !getApprovalCapabilities(selectedApproval).canReject &&
              !getApprovalCapabilities(selectedApproval).canComplete ? (
                <div className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {getApprovalCapabilities(selectedApproval).unavailableLabel}
                </div>
              ) : null}
            </div>
          ) : null
        }
      />
    </section>
  );
}

function getApprovalCapabilities(approval: ApprovalItem) {
  if (approval.type === "SELLER" || approval.type === "LISTING") {
    if (approval.status === "PENDING") {
      return {
        canApprove: true,
        canReject: true,
        canComplete: false,
        unavailableLabel: "Belum tersedia",
      };
    }

    return {
      canApprove: false,
      canReject: false,
      canComplete: false,
      unavailableLabel: "Approval ini sudah tidak punya aksi lanjutan.",
    };
  }

  if (approval.type === "PAYOUT") {
    if (approval.status === "PENDING") {
      return {
        canApprove: true,
        canReject: true,
        canComplete: false,
        unavailableLabel: "Belum tersedia",
      };
    }

    if (approval.status === "APPROVED") {
      return {
        canApprove: false,
        canReject: true,
        canComplete: true,
        unavailableLabel: "Batch payout ini sudah diapprove dan siap ditandai paid.",
      };
    }

    if (approval.status === "PROCESSING") {
      return {
        canApprove: false,
        canReject: false,
        canComplete: true,
        unavailableLabel: "Batch payout sedang diproses backend dan bisa ditandai paid saat transfer selesai.",
      };
    }

    return {
      canApprove: false,
      canReject: false,
      canComplete: false,
      unavailableLabel: "Approval payout ini tidak punya aksi backend yang tersedia.",
    };
  }

  if (approval.type === "AFFILIATE_WITHDRAW") {
    if (approval.status === "PENDING") {
      return {
        canApprove: true,
        canReject: true,
        canComplete: false,
        unavailableLabel: "Belum tersedia",
      };
    }

    return {
      canApprove: false,
      canReject: false,
      canComplete: false,
      unavailableLabel: "Withdraw affiliate ini sudah selesai diproses.",
    };
  }

  if (approval.type === "REVIEW") {
    return {
      canApprove: approval.status === "PENDING",
      canReject: approval.status === "PENDING",
      canComplete: false,
      unavailableLabel: "Review ini sudah selesai dimoderasi.",
    };
  }

  return {
    canApprove: false,
    canReject: false,
    canComplete: false,
    unavailableLabel: "Belum tersedia",
  };
}

function ApprovalActionRow({
  approval,
  onView,
  onApprove,
  onReject,
  onComplete,
  approving,
  rejecting,
  completing,
}: {
  approval: ApprovalItem;
  onView: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onComplete: () => Promise<void>;
  approving: boolean;
  rejecting: boolean;
  completing: boolean;
}) {
  const capability = getApprovalCapabilities(approval);

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 6 }}>
      <button type="button" onClick={onView} style={actionButtonStyle("view")}>
        View
      </button>
      {capability.canApprove ? (
        <button
          type="button"
          disabled={approving}
          onClick={() => {
            void onApprove();
          }}
          style={actionButtonStyle("approve", approving)}
        >
          {approving ? "Memproses..." : "Approve"}
        </button>
      ) : null}
      {capability.canReject ? (
        <button
          type="button"
          disabled={rejecting}
          onClick={() => {
            void onReject();
          }}
          style={actionButtonStyle("reject", rejecting)}
        >
          {rejecting ? "Memproses..." : "Reject"}
        </button>
      ) : null}
      {capability.canComplete ? (
        <button
          type="button"
          disabled={completing}
          onClick={() => {
            void onComplete();
          }}
          style={actionButtonStyle("complete", completing)}
        >
          {completing ? "Memproses..." : "Mark paid"}
        </button>
      ) : null}
      {!capability.canApprove && !capability.canReject && !capability.canComplete ? (
        <span style={unavailablePillStyle}>{capability.unavailableLabel}</span>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: ApprovalItem["status"] }) {
  const palette =
    status === "PENDING"
      ? { bg: "rgba(250,204,21,.16)", color: "#854d0e" }
      : status === "APPROVED"
        ? { bg: "rgba(16,185,129,.16)", color: "#065f46" }
        : status === "PROCESSING"
          ? { bg: "rgba(59,130,246,.16)", color: "#1d4ed8" }
          : { bg: "rgba(248,113,113,.16)", color: "#991b1b" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 12,
        fontWeight: 800,
        background: palette.bg,
        color: palette.color,
      }}
    >
      {status}
    </span>
  );
}

function actionButtonStyle(tone: "view" | "approve" | "reject" | "complete", disabled = false) {
  const palette =
    tone === "view"
      ? { border: "rgba(56,174,204,.35)", background: "rgba(56,174,204,.12)", color: "#0f3b4c" }
      : tone === "approve"
        ? { border: "rgba(16,185,129,.35)", background: "rgba(16,185,129,.12)", color: "#065f46" }
        : tone === "complete"
          ? { border: "rgba(59,130,246,.32)", background: "rgba(59,130,246,.12)", color: "#1d4ed8" }
          : { border: "rgba(248,113,113,.32)", background: "rgba(248,113,113,.12)", color: "#991b1b" };

  return {
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: palette.background,
    color: palette.color,
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    padding: "6px 10px",
    fontSize: 11,
    opacity: disabled ? 0.45 : 1,
  } as const;
}

const unavailablePillStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(148,163,184,.32)",
  background: "rgba(241,245,249,.9)",
  color: "#475569",
  fontWeight: 700,
  padding: "6px 10px",
  fontSize: 11,
  textAlign: "left",
} as const;
