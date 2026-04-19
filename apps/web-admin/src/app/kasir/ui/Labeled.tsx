"use client";
import { form } from "../lib/styles";

export default function Labeled({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div style={form.field}>
      <label style={form.label}>
        {label} {required ? <sup style={{ color: "#dc2626" }}>*</sup> : null}
      </label>
      {children}
      {hint ? <div style={form.hint}>{hint}</div> : null}
    </div>
  );
}
