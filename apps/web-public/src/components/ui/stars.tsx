import * as React from "react";

export function StarRating({
  value,
  outOf = 5,
  showValue = true,
  size = "sm",
}: {
  value: number;        // 0..5
  outOf?: number;       // default 5
  showValue?: boolean;  // tampilkan angka
  size?: "sm" | "md";
}) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = Math.max(0, outOf - full - (half ? 1 : 0));

  const cls = size === "sm" ? "text-xs" : "text-base";

  return (
    <div className="inline-flex items-center gap-1">
      <span className={`text-yellow-500 ${cls}`} aria-hidden={true}>
        {"★".repeat(full)}
        {half ? "☆" : ""}
        {"☆".repeat(empty)}
      </span>
      {showValue && (
        <span className="text-xs text-[var(--muted)]">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
