"use client";

import * as React from "react";
import Button from "../ui/Button";

export type FilterBarProps = {
  /** Slot elemen filter (Select, DateRangePicker, dsb) */
  children?: React.ReactNode;
  /** Trigger saat Apply diklik */
  onApply?: () => void;
  /** Trigger saat Reset diklik */
  onReset?: () => void;
  /** Kanan: slot aksi tambahan */
  rightSlot?: React.ReactNode;
  className?: string;
};

export default function FilterBar({
  children,
  onApply,
  onReset,
  rightSlot,
  className,
}: FilterBarProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-end sm:justify-between",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
        <Button onClick={onApply}>Apply</Button>
        {rightSlot}
      </div>
    </div>
  );
}
