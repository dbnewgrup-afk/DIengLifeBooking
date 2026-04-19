"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import { toast } from "../ui/Toast";

export type PartnerRow = {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE" | (string & {});
  contactName?: string;
  contactPhone?: string;
};

export type PartnersTableProps = {
  apiBase?: string;
  getToken?: () => string | null;
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  className?: string;
  renderActions?: (row: PartnerRow) => React.ReactNode;
};

export default function PartnersTable({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  q,
  status,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
  renderActions,
}: PartnersTableProps) {
  const [rows, setRows] = React.useState<PartnerRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<PartnerRow>[] = [
    { key: "code", header: "Code", sortable: true, render: r => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", header: "Name", sortable: true },
    {
      key: "status",
      header: "Status",
      render: r => (
        <span
          className={[
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
            r.status === "ACTIVE"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-amber-100 text-amber-800 border border-amber-200",
          ].join(" ")}
        >
          {r.status}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: r => (
        <div className="text-xs text-slate-700">
          {r.contactName || "-"} {r.contactPhone ? `• ${r.contactPhone}` : ""}
        </div>
      ),
    },
    { key: "actions", header: "Actions", render: r => renderActions?.(r) ?? null },
  ];

  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  query.set("page", String(page));
  query.set("limit", String(pageSize));

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/partners?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat sellers: ${res.status}`);
        const json = (await res.json()) as { data?: PartnerRow[]; items?: PartnerRow[]; total?: number } | PartnerRow[];
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
  }, [apiBase, q, status, page, pageSize, getToken]); // eslint-disable-line

  return (
    <DataTable<PartnerRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Belum ada seller."
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
