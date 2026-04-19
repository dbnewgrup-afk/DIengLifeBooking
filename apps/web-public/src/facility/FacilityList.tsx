"use client";

// src/facility/FacilityList.tsx
import { getFacilities } from "@/data/facilities";
import { useLang } from "@/components/i18n/lang";

export function FacilityList() {
  const { lang } = useLang();
  const items = getFacilities(lang);

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((f) => (
        <div key={f.icon + f.label} className="flex items-center gap-2">
          {/* TODO: ganti <span> ini dengan ikon asli (lucide/react atau custom svg) */}
          <span className="w-5 h-5 bg-blue-100 text-blue-600 flex items-center justify-center rounded">
            {f.icon[0].toUpperCase()}
          </span>
          <span>{f.label}</span>
        </div>
      ))}
    </div>
  );
}
