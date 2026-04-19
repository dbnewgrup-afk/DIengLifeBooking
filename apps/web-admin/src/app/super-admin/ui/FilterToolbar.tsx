"use client";

import type { CSSProperties } from "react";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterField =
  | {
      key: string;
      label: string;
      type: "search";
      value: string;
      placeholder?: string;
      onChange: (value: string) => void;
    }
  | {
      key: string;
      label: string;
      type: "select";
      value: string;
      options: FilterOption[];
      onChange: (value: string) => void;
    };

const controlStyle: CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  border: "1px solid rgba(191,219,254,.55)",
  background: "rgba(255,255,255,.94)",
  color: "#0f172a",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
};

export default function FilterToolbar({
  fields,
  totalLabel,
  onReset,
}: {
  fields: FilterField[];
  totalLabel?: string;
  onReset?: () => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: 14,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,.18)",
        background: "rgba(15,23,42,.28)",
        backdropFilter: "blur(10px)",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(226,232,240,.78)" }}>
          Filter & pencarian
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {totalLabel ? (
            <span
              style={{
                borderRadius: 999,
                padding: "6px 10px",
                background: "rgba(255,255,255,.14)",
                color: "#f8fafc",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {totalLabel}
            </span>
          ) : null}
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.24)",
                background: "rgba(255,255,255,.08)",
                color: "#f8fafc",
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Reset filter
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 12,
        }}
      >
        {fields.map((field) => (
          <label key={field.key} style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(226,232,240,.9)" }}>{field.label}</span>
            {field.type === "search" ? (
              <input
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                placeholder={field.placeholder}
                style={controlStyle}
              />
            ) : (
              <select
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                style={controlStyle}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
