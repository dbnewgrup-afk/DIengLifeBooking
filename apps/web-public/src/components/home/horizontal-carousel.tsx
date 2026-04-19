"use client";

import { useRef } from "react";

export function HorizontalCarousel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  function scrollByAmount(direction: "left" | "right") {
    const node = ref.current;
    if (!node) return;
    const amount = Math.max(280, Math.floor(node.clientWidth * 0.82));
    node.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="container-page py-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={() => scrollByAmount("left")}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
            aria-label="Geser ke kiri"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount("right")}
            className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
            aria-label="Geser ke kanan"
          >
            →
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}
