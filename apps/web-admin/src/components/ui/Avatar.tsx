"use client";

import * as React from "react";

export type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number; // px
  rounded?: "full" | "lg" | "md";
  className?: string;
};

export default function Avatar({
  src,
  name,
  size = 36,
  rounded = "full",
  className,
}: AvatarProps) {
  const initials = makeInitials(name);
  const bgCls = colorByName(name ?? "");

  const radiusCls = rounded === "full" ? "rounded-full" : rounded === "lg" ? "rounded-lg" : "rounded-md";
  const style = { width: size, height: size } as React.CSSProperties;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={[
          "object-cover",
          radiusCls,
          "border border-slate-200",
          className || "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={style}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={[
        "grid place-items-center border border-slate-200 text-xs font-semibold text-white",
        radiusCls,
        bgCls,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      aria-label={name || "Avatar"}
      title={name || undefined}
    >
      {initials}
    </div>
  );
}

function makeInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function colorByName(name: string) {
  const colors = [
    "bg-slate-900",
    "bg-emerald-600",
    "bg-sky-600",
    "bg-indigo-600",
    "bg-rose-600",
    "bg-amber-600",
    "bg-teal-600",
    "bg-fuchsia-600",
  ];
  return colors[hash(name) % colors.length];
}
