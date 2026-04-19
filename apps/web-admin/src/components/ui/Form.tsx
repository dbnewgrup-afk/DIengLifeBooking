"use client";

import * as React from "react";

export type FormProps = React.FormHTMLAttributes<HTMLFormElement> & {
  /** Dua kolom responsif, otomatis stack di mobile */
  twoColumns?: boolean;
  /** Jarak antar field */
  gap?: number;
  /** Header optional di atas form */
  header?: React.ReactNode;
  /** Footer optional di bawah form (aksi tombol) */
  footer?: React.ReactNode;
  className?: string;
};

export default function Form({
  twoColumns = true,
  gap = 16,
  header,
  footer,
  className,
  children,
  ...rest
}: FormProps) {
  const gridGap = `gap-${Math.max(1, Math.min(12, Math.round(gap / 4)))}`;
  // fallback gap class safe: use fixed spacing classes when unsure
  const gapCls = gap >= 24 ? "gap-6" : gap >= 16 ? "gap-4" : "gap-3";

  return (
    <form
      className={[
        "rounded-xl border border-slate-200 bg-white",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {header ? (
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6">{header}</div>
      ) : null}

      <div className={["px-4 py-4 sm:px-6"].join(" ")}>
        <div
          className={[
            "grid",
            twoColumns ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
            gapCls,
          ].join(" ")}
        >
          {children}
        </div>
      </div>

      {footer ? (
        <div className="border-t border-slate-200 px-4 py-3 sm:px-6">{footer}</div>
      ) : null}
    </form>
  );
}
