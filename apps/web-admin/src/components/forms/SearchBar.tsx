"use client";

import * as React from "react";
import Button from "../ui/Button";

export type SearchBarProps = {
  placeholder?: string;
  /** debounce ms untuk onSearch */
  debounceMs?: number;
  /** dipanggil saat user mengetik (setelah debounce) */
  onSearch?: (q: string) => void;
  /** dipanggil saat submit form eksplisit (Enter/klik) */
  onSubmit?: (q: string) => void;
  defaultValue?: string;
  className?: string;
};

export default function SearchBar({
  placeholder = "Search…",
  debounceMs = 400,
  onSearch,
  onSubmit,
  defaultValue = "",
  className,
}: SearchBarProps) {
  const [q, setQ] = React.useState(defaultValue);
  const timer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    if (!onSearch) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onSearch(q.trim()), debounceMs);
    return () => window.clearTimeout(timer.current);
  }, [q, debounceMs, onSearch]);

  return (
    <form
      className={["flex items-center gap-2", className || ""].join(" ")}
      onSubmit={e => {
        e.preventDefault();
        onSubmit?.(q.trim());
      }}
      role="search"
    >
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
        aria-label="Search"
      />
      <Button type="submit" variant="outline">
        Cari
      </Button>
    </form>
  );
}
