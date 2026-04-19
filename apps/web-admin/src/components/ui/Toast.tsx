"use client";

import * as React from "react";

/**
 * Sistem toast sederhana:
 * - Render <Toast /> sekali di root layout.
 * - Panggil toast.success("..."), toast.error("..."), dst dari mana saja.
 */

type ToastKind = "success" | "error" | "info" | "warn";
type ToastItem = { id: number; kind: ToastKind; message: React.ReactNode; duration: number };

let idSeq = 1;
type Subscriber = (items: ToastItem[]) => void;

const store = {
  items: [] as ToastItem[],
  subs: new Set<Subscriber>(),
  push(kind: ToastKind, message: React.ReactNode, duration = 3000) {
    const item: ToastItem = { id: idSeq++, kind, message, duration };
    this.items = [...this.items, item];
    this.emit();
    // auto-remove setelah durasi
    const tid = window.setTimeout(() => this.remove(item.id), duration);
    // simpan id ke item kalau kamu mau cancel di masa depan (skip untuk kesederhanaan)
    return tid;
  },
  remove(id: number) {
    const before = this.items.length;
    this.items = this.items.filter(t => t.id !== id);
    if (this.items.length !== before) this.emit();
  },
  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn);
    fn(this.items);
    // Penting: kembalikan cleanup bertipe void, jangan hasil boolean dari Set.delete
    return () => {
      this.subs.delete(fn);
    };
  },
  emit() {
    for (const fn of this.subs) fn(this.items);
  },
};

export const toast = {
  success(msg: React.ReactNode, ms?: number) {
    store.push("success", msg, ms);
  },
  error(msg: React.ReactNode, ms?: number) {
    store.push("error", msg, ms);
  },
  info(msg: React.ReactNode, ms?: number) {
    store.push("info", msg, ms);
  },
  warn(msg: React.ReactNode, ms?: number) {
    store.push("warn", msg, ms);
  },
  remove(id: number) {
    store.remove(id);
  },
};

export default function Toast() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const unsub = store.subscribe(setItems);
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-4 sm:px-6">
      <div className="flex w-full max-w-md flex-col gap-2">
        {items.map(item => (
          <div
            key={item.id}
            className={[
              "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg",
              item.kind === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
              item.kind === "error" && "border-rose-200 bg-rose-50 text-rose-900",
              item.kind === "info" && "border-sky-200 bg-sky-50 text-sky-900",
              item.kind === "warn" && "border-amber-200 bg-amber-50 text-amber-900",
            ]
              .filter(Boolean)
              .join(" ")}
            role="status"
          >
            <div className="mt-0.5">
              {item.kind === "success" ? "✔️" : item.kind === "error" ? "❌" : item.kind === "warn" ? "⚠️" : "ℹ️"}
            </div>
            <div className="min-w-0 flex-1 text-sm">{item.message}</div>
            <button
              type="button"
              onClick={() => toast.remove(item.id)}
              className="rounded-md px-1.5 py-0.5 text-xs opacity-70 hover:opacity-100"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
