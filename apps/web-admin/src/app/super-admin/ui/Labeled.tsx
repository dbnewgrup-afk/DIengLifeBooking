"use client";
import React from "react";

export function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize:12, fontWeight:800, color:"#244a5b" }}>
        {label} {required ? <sup style={{ color:"#dc2626" }}>*</sup> : null}
      </label>
      {children}
    </div>
  );
}
