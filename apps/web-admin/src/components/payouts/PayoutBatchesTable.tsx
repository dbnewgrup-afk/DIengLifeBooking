"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import { toast } from "../ui/Toast";

export type PayoutBatchRow = {
  id: string;
  code: string;
  status: "DRAFT" | "APPROVED" | "PROCESSING" | "COMPLETED" | "FAILED" | (string & {});
  totalAmount: number;
  createdAt?: string;
};

export type PayoutBatchesTableProps = {
  apiBase?: string;
  getToken?: () => string | null;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  renderActions?: (row: PayoutBatchRow) => React.ReactNode;
  className?: string;
};

export default function PayoutBatchesTable({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  page = 1,
  pageSize = 10,
  onPageChange,
  renderActions,
  className,
}: PayoutBatchesTableProps) {
  const [rows, setRows] = React.useState<PayoutBatchRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<PayoutBatchRow>[] = [
    { key: "code", header: "Code", render: r => <span className="font-mono text-xs">{r.code}</span>, sortable: true },
    {
      key: "status",
      header: "Status",
      render: r => (
        <span
          className={[
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            r.status === "DRAFT"
              ? "bg-amber-100 text-amber-800 border border-amber-200"
              : r.status === "APPROVED" || r.status === "COMPLETED"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : r.status === "FAILED"
              ? "bg-rose-100 text-rose-800 border border-rose-200"
              : "bg-slate-100 text-slate-800 border border-slate-200",
          ].join(" ")}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      align: "right",
      sortable: true,
      accessor: r => r.totalAmount,
      render: r => <span className="font-medium">{formatIDR(r.totalAmount)}</span>,
    },
    {
      key: "createdAt",
      header: "Created",
      render: r => <span className="text-xs text-slate-600">{formatDateTime(r.createdAt)}</span>,
      sortable: true,
      accessor: r => r.createdAt || "",
    },
    { key: "actions", header: "Actions", render: r => renderActions?.(r) ?? null },
  ];

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageSize));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/payouts/batches?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat batch: ${res.status}`);
        const json = await res.json();
        const items: PayoutBatchRow[] = (json?.data || json?.items || json) as any;
        const totalAll = json?.total ?? items.length;
        if (mounted) {
          setRows(items);
          setTotal(totalAll);
        }
      } catch (e: any) {
        toast.error(e?.message || "Gagal memuat data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiBase, page, pageSize, getToken]); // eslint-disable-line

  return (
    <DataTable<PayoutBatchRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Belum ada payout batch."
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
function formatDateTime(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleString();
}
function formatIDR(n?: number) {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
