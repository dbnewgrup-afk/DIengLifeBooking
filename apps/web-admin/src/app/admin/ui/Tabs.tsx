"use client";
import type { CSSProperties } from "react";
import { C } from "../lib/styles";

export type AdminTab =
  | "OVERVIEW"
  | "CONTROL"
  | "PRODUCTS"
  | "PROMOTIONS"
  | "SELLERS"
  | "TRANSACTIONS"
  | "REPORTS";

export default function Tabs({ active, onChange }: { active: AdminTab; onChange: (t: AdminTab) => void }) {
  const tabsWrapStyle = C.tabsWrap as CSSProperties;
  const tabStyle = C.tab as CSSProperties;
  const tabActiveStyle = C.tabActive as CSSProperties;
  const badgeInfoStyle = C.badgeInfo as CSSProperties;
  const items: Array<{ k: AdminTab; t: string }> = [
    { k: "OVERVIEW", t: "Overview" },
    { k: "CONTROL", t: "Control" },
    { k: "PRODUCTS", t: "Products" },
    { k: "PROMOTIONS", t: "Promotions" },
    { k: "SELLERS", t: "Sellers" },
    { k: "TRANSACTIONS", t: "Transactions" },
    { k: "REPORTS", t: "Reports" },
  ];
  return (
    <div style={tabsWrapStyle}>
      {items.map((x) => {
        const activeNow = active === x.k;
        return (
          <button
            key={x.k}
            type="button"
            onClick={() => onChange(x.k)}
            style={{ ...tabStyle, ...(activeNow ? tabActiveStyle : {}) }}
          >
            {x.t}
          </button>
        );
      })}
      <span style={badgeInfoStyle}>Admin Mode</span>
    </div>
  );
}
