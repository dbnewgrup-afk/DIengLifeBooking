"use client";
import { C } from "../lib/styles";

export function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div style={C.statCard}>
      <div
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: "rgba(2,47,64,0.06)",
          display: "grid",
          placeItems: "center",
          boxShadow: "inset 0 0 0 1px rgba(2,47,64,0.08)",
          fontSize: 18,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1, color: "#0b1220" }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
