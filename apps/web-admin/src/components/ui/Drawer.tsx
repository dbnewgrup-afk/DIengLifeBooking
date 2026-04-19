"use client";

import * as React from "react";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  width?: "sm" | "md" | "lg";
  preventCloseOnOverlay?: boolean;
  className?: string;
};

const widthMap = {
  sm: "w-[24rem] max-w-[90vw]",
  md: "w-[32rem] max-w-[95vw]",
  lg: "w-[40rem] max-w-[98vw]",
};

export default function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  width = "md",
  preventCloseOnOverlay = false,
  className,
}: DrawerProps) {
  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  return (
    <div className={["fixed inset-0 z-50", open ? "" : "pointer-events-none"].join(" ")}>
      {/* overlay */}
      <div
        className={[
          "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={() => {
          if (!preventCloseOnOverlay) onOpenChange(false);
        }}
        aria-hidden="true"
      />
      {/* panel */}
      <div
        className={[
          "absolute right-0 top-0 h-full border-l border-slate-200 bg-white shadow-xl transition-transform",
          widthMap[width],
          open ? "translate-x-0" : "translate-x-full",
          className || "",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <div>
              {title ? <h2 className="text-base font-semibold text-slate-900">{title}</h2> : null}
              {description ? <p className="mt-0.5 text-sm text-slate-600">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        )}
        <div className="h-[calc(100%-3.25rem)] overflow-auto px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  );
}
