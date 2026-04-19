"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import { toast } from "../ui/Toast";

export type CloseOpenRow = {
  id: string;
  partnerName: string;
  productName?: string;
  dateStart: string;
  dateEnd: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
};

export type CloseOpenRequestsTableProps = {
  apiBase?: string;
  getToken?: () => string | null;
  status?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  className?: string;
  /** aksi klik, biasanya dari ApprovalActions di kolom actions */
  renderActions?: (row: CloseOpenRow) => React.ReactNode;
};

export default function CloseOpenRequestsTable({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  status,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
  renderActions,
}: CloseOpenRequestsTableProps) {
  const [rows, setRows] = React.useState<CloseOpenRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<CloseOpenRow>[] = [
    { key: "partnerName", header: "Seller", sortable: true },
    { key: "productName", header: "Product" },
    {
      key: "dateRange",
      header: "Date",
      render: r => (
        <span className="text-xs text-slate-700">
          {formatDate(r.dateStart)} → {formatDate(r.dateEnd)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: r => (
        <span
          className={[
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            r.status === "PENDING"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : r.status === "APPROVED"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-rose-100 text-rose-800 border border-rose-200",
          ].join(" ")}
        >
          {r.status}
        </span>
      ),
    },
    { key: "note", header: "Note", render: r => <span className="text-xs text-slate-600">{r.note || "-"}</span> },
    { key: "actions", header: "Actions", render: r => renderActions?.(r) ?? null },
  ];

  const query = new URLSearchParams();
  if (status) query.set("status", status);
  query.set("page", String(page));
  query.set("limit", String(pageSize));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/approvals/close-open?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat approvals: ${res.status}`);
        const json = (await res.json()) as { data?: CloseOpenRow[]; items?: CloseOpenRow[]; total?: number } | CloseOpenRow[];
        const items = Array.isArray(json) ? json : json.data || json.items || [];
        const totalAll = Array.isArray(json) ? items.length : json.total ?? items.length;
        if (mounted) {
          setRows(items);
          setTotal(totalAll);
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Gagal memuat data"));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, status, page, pageSize, getToken]); // eslint-disable-line

  return (
    <DataTable<CloseOpenRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Tidak ada request."
    />
  );
}

function defaultGetToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_session") || sessionStorage.getItem("admin_session");
}
function withBearer(token: string | null) {
  return token ? `Bearer ${token}` : "";
}
function formatDate(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
