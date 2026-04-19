"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export type SidebarMenuItem = {
  label: string;
  href: string;
  /** optional: icon node */
  icon?: React.ReactNode;
  /** optional: badge kecil di kanan, misal "New" */
  badge?: string;
  /** optional: role gate di UI (hanya tampilan, logika akses tetap di server/page) */
  roles?: string[];
};
export type SidebarMenuSection = {
  heading?: string;
  items: SidebarMenuItem[];
};

export type AppSidebarProps = {
  menus: SidebarMenuSection[];
  /** dipanggil saat user klik link (untuk menutup drawer mobile) */
  onNavigate?: () => void;
};

function Logo() {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-white text-sm font-bold">
        BV
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-semibold text-slate-900">Booking-Villa</span>
        <span className="text-xs text-slate-500">Admin Panel</span>
      </div>
    </div>
  );
}

export default function AppSidebar({ menus, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <Logo />
      <nav className="flex-1 overflow-y-auto px-2 pb-6 pt-2">
        {menus.map((section, sIdx) => (
          <Fragment key={sIdx}>
            {section.heading ? (
              <div className="px-2 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500/80">
                {section.heading}
              </div>
            ) : null}

            <ul className="space-y-1">
              {section.items.map((item, iIdx) => {
                const active = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <li key={`${sIdx}-${iIdx}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={[
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Icon slot */}
                      <span
                        className={[
                          "grid h-5 w-5 place-items-center rounded-md text-[13px]",
                          active ? "text-slate-900" : "text-slate-500 group-hover:text-slate-900",
                        ].join(" ")}
                        aria-hidden="true"
                      >
                        {item.icon ?? <span className="i">•</span>}
                      </span>

                      <span className="flex-1 truncate">{item.label}</span>

                      {item.badge ? (
                        <span className="ml-2 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Fragment>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3 text-xs text-slate-500">
        <div>v1.0 • Stable</div>
        <div className="truncate">Environment: LOCAL</div>
      </div>
    </div>
  );
}
