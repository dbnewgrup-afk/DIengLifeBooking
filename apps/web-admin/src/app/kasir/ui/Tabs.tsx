"use client";
import { tabs as s } from "../lib/styles";

type TabKey = "OVERVIEW" | "WALKIN" | "CASH" | "VERIFY";

export default function Tabs({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  const items: Array<{ k: TabKey; t: string }> = [
    { k: "OVERVIEW", t: "Overview" },
    { k: "WALKIN", t: "Reservasi Walk-in" },
    { k: "CASH", t: "Mark Tunai/Transfer" },
    { k: "VERIFY", t: "Verifikasi Xendit" },
  ];

  return (
    <div style={s.wrap}>
      {items.map(x => {
        const activeNow = active === x.k;
        return (
          <button
            key={x.k}
            type="button"
            onClick={() => onChange(x.k)}
            style={{ ...s.tab, ...(activeNow ? s.active : null) }}
          >
            {x.t}
          </button>
        );
      })}
      <span style={s.badgeSuccess}>Kasir Mode</span>
    </div>
  );
}
