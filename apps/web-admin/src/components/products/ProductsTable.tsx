"use client";

import * as React from "react";
import DataTable from "../ui/DataTable";
import type { Column } from "../ui/Table";
import ProductStatusBadge, { type ProductStatus } from "./ProductStatusBadge";
import { toast } from "../ui/Toast";

export type ProductRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  price: number;
  status: ProductStatus;
};

export type ProductsTableProps = {
  apiBase?: string;
  getToken?: () => string | null;
  q?: string;
  page?: number;
  pageSize?: number;
  onPageChange?: (p: number) => void;
  className?: string;
};

export default function ProductsTable({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  q,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
}: ProductsTableProps) {
  const [rows, setRows] = React.useState<ProductRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const columns: Column<ProductRow>[] = [
    { key: "code", header: "Code", sortable: true, render: r => <span className="font-mono text-xs">{r.code}</span> },
    { key: "name", header: "Name", sortable: true },
    { key: "type", header: "Type", sortable: true },
    {
      key: "price",
      header: "Price",
      align: "right",
      sortable: true,
      render: r => <span className="font-medium">{formatIDR(r.price)}</span>,
      accessor: r => r.price,
    },
    { key: "status", header: "Status", render: r => <ProductStatusBadge status={r.status} /> },
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
        const res = await fetch(`${apiBase}/products?${query.toString()}`, {
          headers: { Authorization: withBearer(getToken()) },
        });
        if (!res.ok) throw new Error(`Gagal memuat products: ${res.status}`);
        const json = await res.json();
        const items: ProductRow[] = (json?.data || json?.items || json) as any;
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
    <DataTable<ProductRow>
      className={className}
      columns={columns}
      rows={rows}
      loading={loading}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      rowKey={r => r.id}
      emptyMessage="Belum ada produk."
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
