"use client";

import * as React from "react";
import KPIGrid from "../ui/KPIGrid";
import Money from "../shared-business/Money";

export type AdminSummaryCardsProps = {
  gross: number;
  paid: number;
  pending: number;
  refund: number;
  ordersCount: number;
  className?: string;
};

export default function AdminSummaryCards({
  gross,
  paid,
  pending,
  refund,
  ordersCount,
  className,
}: AdminSummaryCardsProps) {
  return (
    <KPIGrid
      className={className}
      items={[
        {
          title: "Gross Revenue",
          value: <Money value={gross} />,
          subtext: "Total sebelum potongan",
          icon: <span>₨</span>,
          trend: { value: "", direction: "flat" },
        },
        {
          title: "Paid",
          value: <Money value={paid} />,
          subtext: "Telah diterima",
          icon: <span>✔️</span>,
        },
        {
          title: "Pending",
          value: <Money value={pending} />,
          subtext: "Belum settle",
          icon: <span>⏳</span>,
        },
        {
          title: "Refund",
          value: <Money value={refund} />,
          subtext: "Dikembalikan",
          icon: <span>↩️</span>,
        },
        {
          title: "Orders",
          value: <span>{ordersCount.toLocaleString("id-ID")}</span>,
          subtext: "Jumlah transaksi",
          icon: <span>🧾</span>,
        },
      ]}
      cols={{ base: 2, md: 3, lg: 4 }}
    />
  );
}
