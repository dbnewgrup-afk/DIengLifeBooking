"use client";
import React from "react";

export function StatTile({ title, value, tone }: { title: string; value: string; tone?: "amber"|"teal"|"indigo" }) {
  const overlay = tone==="amber" ? "rgba(251,191,36,0.34)" :
                  tone==="teal" ? "rgba(45,211,191,0.32)" :
                  "rgba(129,140,248,0.32)";
  return (
    <div style={{
      background: `linear-gradient(180deg, ${overlay}, rgba(255,255,255,0.24))`,
      border: "1px solid rgba(255,255,255,.55)", borderRadius: 18, padding: 16,
      color: "#053343", boxShadow: "0 10px 26px rgba(2,47,64,.20)", backdropFilter: "blur(8px)"
    }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#053343" }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900 }}>{value}</div>
    </div>
  );
}
