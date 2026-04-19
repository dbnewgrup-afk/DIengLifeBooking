"use client";

import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  /** Separator custom jika mau, default "/" */
  separator?: React.ReactNode;
};

export default function Breadcrumbs({ items, separator = "/" }: BreadcrumbsProps) {
  if (!items?.length) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="rounded px-1 py-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="px-1 py-0.5 text-slate-700">{item.label}</span>
              )}
              {!last ? <span className="px-1 text-slate-400">{separator}</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
