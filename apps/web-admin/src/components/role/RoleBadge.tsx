"use client";

type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "KASIR"
  | "SELLER"
  | "PARTNER"
  | "AFFILIATE"
  | (string & {}); // biar fleksibel jika kamu tambah role lain

export type RoleBadgeProps = {
  role: Role;
  className?: string;
};

const ROLE_STYLE: Record<string, string> = {
  SUPER_ADMIN:
    "bg-purple-100 text-purple-800 border border-purple-200",
  ADMIN:
    "bg-sky-100 text-sky-800 border border-sky-200",
  KASIR:
    "bg-amber-100 text-amber-800 border border-amber-200",
  SELLER:
    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  PARTNER:
    "bg-emerald-100 text-emerald-800 border border-emerald-200",
  AFFILIATE:
    "bg-pink-100 text-pink-800 border border-pink-200",
};

export default function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalizedRole = role === "PARTNER" ? "SELLER" : role;
  const style =
    ROLE_STYLE[normalizedRole] ??
    "bg-slate-100 text-slate-800 border border-slate-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        style,
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={`Role: ${role}`}
    >
      {normalizedRole}
    </span>
  );
}
