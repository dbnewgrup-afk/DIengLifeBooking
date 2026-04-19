"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Props = {
  value: number;
  onChange: (n: number) => void;
  label?: string;
  min?: number;
  max?: number;
};

export function SimpleGuestPicker({
  value,
  onChange,
  label = "Tamu",
  min = 1,
  max = 20,
}: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const options = useMemo(
    () => Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => i + min),
    [min, max]
  );

  const [focusIndex, setFocusIndex] = useState(
    Math.min(Math.max(value - min, 0), options.length - 1)
  );

  useEffect(() => {
    // update fokus saat value berubah dari luar
    setFocusIndex(Math.min(Math.max(value - min, 0), options.length - 1));
  }, [value, min, options.length]);

  // tutup saat klik di luar / Esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (
        !panelRef.current.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // keyboard di panel
  useEffect(() => {
    if (!open || !panelRef.current) return;
    const el = panelRef.current;

    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setFocusIndex(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setFocusIndex(options.length - 1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const newVal = options[focusIndex] ?? value;
        onChange(newVal);
        setOpen(false);
      }
    };

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [open, options, focusIndex, onChange, value]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="truncate">{`${label}: ${value}`}</span>
        <span aria-hidden="true">👥</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={id}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          className="absolute z-50 mt-2 w-[min(92vw,320px)] rounded-2xl border border-[var(--line)] bg-white p-2 shadow-lg"
        >
          <div className="max-h-56 overflow-y-auto rounded-xl">
            {options.map((n, idx) => {
              const selected = n === value;
              const focused = idx === focusIndex;
              return (
                <button
                  key={n}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setFocusIndex(idx)}
                  onClick={() => {
                    onChange(n);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition",
                    selected
                      ? "bg-[var(--brand-50)] text-[var(--brand-700)] ring-1 ring-[var(--brand-300)]"
                      : focused
                      ? "bg-slate-50"
                      : "hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span>{n} {n === 1 ? "orang" : "orang"}</span>
                  {selected && (
                    <span className="text-[var(--brand-600)]">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default SimpleGuestPicker;
