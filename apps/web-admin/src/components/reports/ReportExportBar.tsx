"use client";

import * as React from "react";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

export type ReportExportBarProps = {
  apiBase?: string;
  getToken?: () => string | null;
  from?: string;
  to?: string;
  fileName?: string; // default: report.csv
  className?: string;
};

export default function ReportExportBar({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  from,
  to,
  fileName = "report.csv",
  className,
}: ReportExportBarProps) {
  const [loading, setLoading] = React.useState(false);

  async function exportCsv() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      qs.set("format", "csv");
      const res = await fetch(`${apiBase}/reports/admin/export?${qs.toString()}`, {
        headers: {
          Authorization: withBearer(getToken()),
        },
      });
      if (!res.ok) throw new Error(`Gagal export: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export CSV dimulai");
    } catch (e: any) {
      toast.error(e?.message || "Gagal export");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={["flex items-center justify-end", className || ""].join(" ")}>
      <Button variant="outline" loading={loading} onClick={exportCsv}>
        Export CSV
      </Button>
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
