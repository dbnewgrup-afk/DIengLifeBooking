"use client";

import * as React from "react";
import BarChart from "../charts/BarChart";
import FilterBar from "../forms/FilterBar";
import DateRangePicker from "../ui/DateRangePicker";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

type Row = { label: string; revenue: number };

export type TopProductsChartProps = {
  apiBase?: string;
  getToken?: () => string | null;
  defaultFrom?: string;
  defaultTo?: string;
  limit?: number;
  className?: string;
};

export default function TopProductsChart({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  defaultFrom,
  defaultTo,
  limit = 10,
  className,
}: TopProductsChartProps) {
  const [from, setFrom] = React.useState(defaultFrom || "");
  const [to, setTo] = React.useState(defaultTo || "");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    const qs = new URLSearchParams();
    qs.set("group", "product");
    qs.set("metric", "revenue");
    qs.set("limit", String(limit));
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/reports/admin?${qs.toString()}`, {
        headers: { Authorization: withBearer(getToken()) },
      });
      if (!res.ok) throw new Error(`Gagal memuat top products: ${res.status}`);
      const json = await res.json();
      setRows((json?.items || json?.data || []) as Row[]);
    } catch (e: any) {
      toast.error(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={className}>
      <FilterBar
        onApply={load}
        onReset={() => {
          setFrom("");
          setTo("");
          setTimeout(load, 0);
        }}
      >
        <DateRangePicker
          label="Periode"
          from={from}
          to={to}
          onFromChange={e => setFrom(e.target.value)}
          onToChange={e => setTo(e.target.value)}
        />
      </FilterBar>

      <div className="mt-3">
        <BarChart
          data={rows.map(r => ({ name: r.label, revenue: r.revenue }))}
          xKey="name"
          series={[{ dataKey: "revenue", name: "Revenue (IDR)" }]}
          yFormatter={n => formatYAxis(n)}
          height={320}
        />
        {loading ? <div className="mt-2 text-xs text-slate-500">Memuat…</div> : null}
      </div>
    </div>
  );
}

function defaultGetToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_session") || sessionStorage.getItem("admin_session");
}
function withBearer(token: string | null) {
  return token ? `Bearer ${token}` : "";
}
function formatYAxis(v: any) {
  if (typeof v === "number") {
    return new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  }
  return String(v);
}
