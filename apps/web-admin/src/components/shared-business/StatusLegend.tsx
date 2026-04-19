"use client";

import * as React from "react";
import Tag from "../ui/Tag";

export type StatusLegendProps = {
  type: "order" | "payout";
  className?: string;
};

export default function StatusLegend({ type, className }: StatusLegendProps) {
  const items =
    type === "order"
      ? [
          ["PENDING", "warn"] as const,
          ["PENDING_PAYMENT", "warn"] as const,
          ["PAID", "success"] as const,
          ["SETTLEMENT", "success"] as const,
          ["EXPIRE", "neutral"] as const,
          ["CANCEL", "neutral"] as const,
          ["REFUND", "error"] as const,
        ]
      : [
          ["DRAFT", "warn"] as const,
          ["APPROVED", "success"] as const,
          ["PROCESSING", "neutral"] as const,
          ["COMPLETED", "success"] as const,
          ["FAILED", "error"] as const,
        ];

  return (
    <div className={["rounded-xl border border-slate-200 bg-white p-3", className || ""].join(" ")}>
      <div className="text-sm font-semibold text-slate-900">
        {type === "order" ? "Order Status" : "Payout Status"}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map(([label, tone]) => (
          <div key={label} className="flex items-center gap-2">
            <Tag tone={tone as any}>{label}</Tag>
            <span className="text-xs text-slate-600">
              {describe(type, label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function describe(type: "order" | "payout", s: string) {
  if (type === "order") {
    switch (s) {
      case "PENDING":
        return "Draft order dibuat";
      case "PENDING_PAYMENT":
        return "Menunggu pembayaran";
      case "PAID":
        return "Dibayar (cash/manual)";
      case "SETTLEMENT":
        return "Pembayaran settle";
      case "EXPIRE":
        return "Pembayaran kedaluwarsa";
      case "CANCEL":
        return "Order dibatalkan";
      case "REFUND":
        return "Dana dikembalikan";
    }
  } else {
    switch (s) {
      case "DRAFT":
        return "Batch dibuat, belum dikirim";
      case "APPROVED":
        return "Disetujui, siap diproses IRIS";
      case "PROCESSING":
        return "IRIS sedang memproses";
      case "COMPLETED":
        return "Semua item berhasil";
      case "FAILED":
        return "Gagal, cek detail";
    }
  }
  return "";
}
