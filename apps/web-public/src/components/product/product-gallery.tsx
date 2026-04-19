"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  images?: string[];
  title?: string;
  badge?: string;
};

export function ProductGallery({ images, title = "Gallery", badge }: Props) {
  const pics = useMemo(() => {
    const list = Array.isArray(images) ? images.filter(Boolean) : [];
    return list.length > 0 ? list : Array.from({ length: 5 }, () => "");
  }, [images]);

  const [active, setActive] = useState(0);
  const mainRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (active >= pics.length) setActive(0);
  }, [pics.length, active]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setActive((i) => Math.min(pics.length - 1, i + 1));
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [pics.length]);

  return (
    <section aria-label="Galeri" className="space-y-3">
      <div
        ref={mainRef}
        tabIndex={0}
        aria-label={`${title} - gambar ${active + 1} dari ${pics.length}`}
        className="relative overflow-hidden rounded-2xl border border-[var(--line)] outline-none"
      >
        {badge && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
            {badge}
          </span>
        )}

        {pics[active] ? (
          <img
            src={pics[active]}
            alt={`${title} - Foto ${active + 1}`}
            className="h-full w-full select-none object-cover"
            style={{ aspectRatio: "16 / 9" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const skel = e.currentTarget.nextElementSibling as HTMLElement | null;
              if (skel) skel.style.display = "block";
            }}
            draggable={false}
          />
        ) : null}
        <div className={`skel ${pics[active] ? "hidden" : ""}`} style={{ aspectRatio: "16 / 9" }} />
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {pics.map((src, i) => {
          const isActive = i === active;
          return (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Pilih foto ${i + 1}`}
              className={[
                "group relative overflow-hidden rounded-lg border transition",
                isActive
                  ? "border-[var(--brand-600)] ring-2 ring-[var(--brand-200)]"
                  : "border-[var(--line)] hover:border-[var(--brand-400)]",
              ].join(" ")}
            >
              {src ? (
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{ aspectRatio: "16 / 10" }}
                  draggable={false}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                    const sk = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (sk) sk.style.display = "block";
                  }}
                />
              ) : null}
              <div className={`skel ${src ? "hidden" : ""}`} style={{ aspectRatio: "16 / 10" }} />
              <div className="pointer-events-none absolute inset-0 hidden bg-black/5 group-hover:block" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
