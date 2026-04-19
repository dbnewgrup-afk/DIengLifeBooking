"use client";
import { S } from "../lib/styles";
import type { TabKey } from "../lib/types";

export function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const items: Array<[TabKey, string]> = [
    ["OVERVIEW", "Overview"],
    ["PAYOUTS", "Payouts"],
    ["REQUESTS", "Requests"],
    ["REPORTS", "Reports"],
  ];
  return (
    <div style={S.tabs}>
      {items.map(([k, label]) => {
        const isActive = active === k;
        return (
          <button key={k} type="button" onClick={() => onChange(k)} style={{ ...S.tab, ...(isActive ? S.tabActive : null) }}>
            {label}
          </button>
        );
      })}
      <span
        style={{
          marginLeft: "auto",
          padding: "6px 12px",
          fontSize: 12,
          borderRadius: 999,
          background: "rgba(0,204,102,0.78)",
          color: "#fff",
          fontWeight: 800,
          border: "1px solid rgba(0,204,102,0.9)",
        }}
      >
        Seller Mode
      </span>
    </div>
  );
}
