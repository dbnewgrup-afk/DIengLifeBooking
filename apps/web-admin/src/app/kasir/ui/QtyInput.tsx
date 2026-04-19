"use client";
import { form as s } from "../lib/styles";

export default function QtyInput({
  value,
  min = 1,
  onChange,
}: {
  value: number;
  min?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div style={s.qtyRow}>
      <button type="button" style={s.qtyBtn} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <input
        type="number"
        min={min}
        style={{ ...s.input, textAlign: "center" }}
        value={value}
        onChange={e => onChange(Math.max(min, Number((e.target as HTMLInputElement).value || min)))}
      />
      <button type="button" style={s.qtyBtn} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}
