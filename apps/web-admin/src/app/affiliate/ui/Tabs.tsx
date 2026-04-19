"use client";
import { C } from "../lib/styles";
import type { TabKey } from "../lib/types";

export function Tabs({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  const items: Array<{ k: TabKey; t: string }> = [
    { k: "OVERVIEW", t: "Overview" },
    { k: "LINKS", t: "Links" },
    { k: "PAYOUT", t: "Payout" },
    { k: "PERFORMANCE", t: "Performance" },
  ];
  return (
    <div style={C.tabsWrap}>
      {items.map((x) => (
        <button
          key={x.k}
          type="button"
          onClick={() => onChange(x.k)}
          style={{ ...C.tab, ...(active === x.k ? C.tabActive : {}) }}
        >
          {x.t}
        </button>
      ))}
      <span style={C.badge}>Program Aktif</span>
    </div>
  );
}
