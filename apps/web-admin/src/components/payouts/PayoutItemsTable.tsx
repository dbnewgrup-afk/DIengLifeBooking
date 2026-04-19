"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import { toast } from "../ui/Toast";

export type PayoutItemRow = {
  id: string;
  partnerId: string;
  partnerName?: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "PAID" | "FAILED" | (string & {});
  note?: string;
};

export type PayoutItemsTableProps = {
  batchId: string;
  apiBase?: string;
  getToken?: () => string | null;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  className?: string;
};

export default function PayoutItemsTable({
  batchId,
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
}: PayoutItemsTableProps) {
  const [rows, setRows] = React.useState<PayoutItemRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<PayoutItemRow>[] = [
    { key: "partnerName", header: "Seller", render: r => r.partnerName || r.partnerId },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortable: true,
      accessor: r => r.amount,
      render: r => <span className="font-medium">{formatIDR(r.amount)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: r => (
        <span
          className={[
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            r.status === "PAID"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : r.status === "FAILED"
              ? "bg-rose-100 text-rose-800 border border-rose-200"
              : "bg-amber-100 text-amber-800 border border-amber-200",
          ].join(" ")}
        >
          {r.status}
        </span>
      ),
    },
    { key: "note", header: "Note", render: r => <span className="text-xs text-slate-600">{r.note || "-"}</span> },
  ];

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageSize));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/payouts/batches/${encodeURIComponent(batchId)}?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat batch detail: ${res.status}`);
        const json = (await res.json()) as { items?: PayoutItemRow[]; data?: { items?: PayoutItemRow[] }; total?: number };
        // asumsi json.items = items, json.total = total
        const items = json.items || json.data?.items || [];
        const totalAll = json?.total ?? items.length;
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
  }, [apiBase, batchId, page, pageSize, getToken]); // eslint-disable-line

  return (
    <DataTable<PayoutItemRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Tidak ada item."
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
function formatIDR(n?: number) {
  if (typeof n !== "number") return "-";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
