"use client";

import * as React from "react";
import PieChart from "../charts/PieChart";
import FilterBar from "../forms/FilterBar";
import DateRangePicker from "../ui/DateRangePicker";
import { toast } from "../ui/Toast";

type Row = { method: string; amount: number };

export type MethodSplitChartProps = {
  apiBase?: string;
  getToken?: () => string | null;
  defaultFrom?: string;
  defaultTo?: string;
  className?: string;
};

export default function MethodSplitChart({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  defaultFrom,
  defaultTo,
  className,
}: MethodSplitChartProps) {
  const [from, setFrom] = React.useState(defaultFrom || "");
  const [to, setTo] = React.useState(defaultTo || "");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    const qs = new URLSearchParams();
    qs.set("group", "paymentMethod");
    qs.set("metric", "amount");
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/reports/admin?${qs.toString()}`, {
        headers: { Authorization: withBearer(getToken()) },
      });
      if (!res.ok) throw new Error(`Gagal memuat split metode bayar: ${res.status}`);
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
        <PieChart
          data={rows.map(r => ({ name: r.method, value: r.amount }))}
          nameKey="name"
          valueKey="value"
          valueFormatter={n => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(n))}
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
