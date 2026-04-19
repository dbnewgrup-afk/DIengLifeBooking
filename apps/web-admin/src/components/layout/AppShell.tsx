"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppSidebar, { type SidebarMenuSection } from "./AppSidebar";
import AppTopbar from "./AppTopbar";

export type AppShellProps = {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  menus: SidebarMenuSection[];
  children: React.ReactNode;
  topbarExtras?: React.ReactNode;
};

export default function AppShell({
  title,
  breadcrumbs,
  menus,
  children,
  topbarExtras,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div className="min-h-dvh">
      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-72 lg:flex-col border-r border-white/20 bg-white/85 backdrop-blur">
        <AppSidebar menus={menus} />
      </div>

      {/* Drawer mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r border-white/20 bg-white/95 backdrop-blur transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <AppSidebar menus={menus} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* Main column */}
      <div className="lg:pl-72 flex min-h-dvh flex-col">
        <div className="sticky top-0 z-20 border-b border-white/20 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/55">
          <AppTopbar
            title={title}
            breadcrumbs={breadcrumbs}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
            rightSlot={topbarExtras}
          />
        </div>

        <main className="flex-1">
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-white/20 bg-white/60 backdrop-blur">
          <div className="container mx-auto max-w-7xl px-4 py-3 text-xs text-slate-700 sm:px-6 lg:px-8">
            © {new Date().getFullYear()} <Link href="/" className="hover:underline">Booking-Villa Admin</Link>. Keep it tidy.
          </div>
        </footer>
      </div>
    </div>
  );
}
