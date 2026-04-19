"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  preventCloseOnOverlay?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  preventCloseOnOverlay = false,
  className,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onOpenChange(false);
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open || !mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[6px]"
        onClick={() => {
          if (!preventCloseOnOverlay) onOpenChange(false);
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 grid place-items-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "relative w-full overflow-hidden rounded-[28px] border border-white/65 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.28)]",
            sizeMap[size],
            className || "",
          ].join(" ")}
        >
          {(title || description) && (
            <div className="border-b border-slate-200/80 bg-white/90 px-5 py-4 pr-16 sm:px-7 sm:pr-20">
              {title ? <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h2> : null}
              {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}
            </div>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
            aria-label="Tutup modal"
          >
            ×
          </button>
          <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
          {footer ? (
            <div className="border-t border-slate-200/80 bg-slate-50/80 px-5 py-4 sm:px-7">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
