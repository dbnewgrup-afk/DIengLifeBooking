"use client";

import * as React from "react";

export type CodeInlineProps = {
  children: React.ReactNode;
  className?: string;
  monospace?: boolean;
  selectable?: boolean;
};

export default function CodeInline({
  children,
  className,
  monospace = true,
  selectable = true,
}: CodeInlineProps) {
  return (
    <code
      className={[
        "rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[12px] text-slate-800",
        monospace ? "font-mono" : "font-semibold",
        selectable ? "select-all" : "select-none",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </code>
  );
}
