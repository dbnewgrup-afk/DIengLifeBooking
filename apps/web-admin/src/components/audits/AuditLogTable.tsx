"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import { toast } from "../ui/Toast";

export type AuditRow = {
  id: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  target?: string;
  targetId?: string;
  meta?: Record<string, unknown> | null;
  createdAt: string;
};

export type AuditLogTableProps = {
  apiBase?: string;
  getToken?: () => string | null;
  q?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  className?: string;
};

export default function AuditLogTable({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  q,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
}: AuditLogTableProps) {
  const [rows, setRows] = React.useState<AuditRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<AuditRow>[] = [
    {
      key: "actor",
      header: "Actor",
      render: r => (
        <div className="text-xs">
          <div className="font-medium">{r.actorId || "-"}</div>
          <div className="text-slate-500">{r.actorRole || ""}</div>
        </div>
      ),
    },
    { key: "action", header: "Action", render: r => <span className="text-sm">{r.action}</span>, sortable: true },
    {
      key: "target",
      header: "Target",
      render: r => (
        <div className="text-xs text-slate-700">
          {r.target || "-"} {r.targetId ? `• ${r.targetId}` : ""}
        </div>
      ),
    },
    {
      key: "time",
      header: "Time",
      sortable: true,
      accessor: r => r.createdAt,
      render: r => <span className="text-xs text-slate-600">{formatDateTime(r.createdAt)}</span>,
    },
  ];

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  query.set("page", String(page));
  query.set("limit", String(pageSize));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/audits?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat audit log: ${res.status}`);
        const json = await res.json();
        const items: AuditRow[] = (json?.data || json?.items || json) as any;
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
  }, [apiBase, q, page, pageSize, getToken]); // eslint-disable-line

  return (
    <DataTable<AuditRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Belum ada log."
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
