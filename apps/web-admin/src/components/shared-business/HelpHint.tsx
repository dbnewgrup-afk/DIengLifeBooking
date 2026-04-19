"use client";

import * as React from "react";

/**
 * Ikon kecil dengan popover SOP singkat.
 * - Klik icon atau fokus lalu tekan Enter untuk toggle.
 */
export type HelpHintProps = {
  title?: string;
  children?: React.ReactNode; // isi SOP singkat
  className?: string;
};

export default function HelpHint({ title = "SOP", children, className }: HelpHintProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className={["relative inline-block", className || ""].join(" ")} ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(v => !v);
          }
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
        title={title}
      >
        ?
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-lg"
        >
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
          <div className="prose prose-sm max-w-none text-slate-800">
            {children || (
              <ol className="list-decimal pl-5">
                <li>Cek data input.</li>
                <li>Ikuti alur sesuai peran.</li>
                <li>Log semua aksi penting.</li>
              </ol>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
