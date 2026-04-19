"use client";
import React from "react";

export function Stat({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      background: "rgba(255,255,255,0.86)", border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: 16, padding: 14, boxShadow: "0 12px 30px rgba(2,47,64,.20)",
      backdropFilter: "blur(8px)", color: "#0f172a",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 12, background: "rgba(2,47,64,0.06)",
        display: "grid", placeItems: "center", fontSize: 18,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: "1.6rem", fontWeight: 900, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: "#334155", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}
