"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "./Breadcrumbs";
import { clearToken } from "@/lib/auth/session";
import { resolveLoginPathForRole } from "@/lib/auth/role-routing";
import { useSession } from "@/store/session";

export type AppTopbarProps = {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  /** Toggle sidebar untuk mobile */
  onToggleSidebar?: () => void;
  /** Slot kanan: tombol aksi spesifik page */
  rightSlot?: React.ReactNode;
};

export default function AppTopbar({
  title,
  breadcrumbs,
  onToggleSidebar,
  rightSlot,
}: AppTopbarProps) {
  const router = useRouter();
  const { user, role } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/clear-cookie", { method: "POST" });
    } finally {
      clearToken();
      router.replace(resolveLoginPathForRole(role));
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Burger mobile */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 lg:hidden"
            aria-label="Toggle navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {breadcrumbs?.length ? (
              <div className="mb-1">
                <Breadcrumbs items={breadcrumbs} />
              </div>
            ) : null}
            <h1 className="truncate text-lg font-semibold text-slate-900">
              {title ?? "Dashboard"}
            </h1>
          </div>

          {/* Search ringan */}
          <div className="hidden md:block">
            <form
              role="search"
              className="relative"
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.querySelector("input[name='q']") as HTMLInputElement | null;
                const q = input?.value?.trim();
                if (!q) return;
                // routing search bisa diarahkan ke /search?q=
                window.location.href = `/search?q=${encodeURIComponent(q)}`;
              }}
            >
              <input
                name="q"
                type="search"
                placeholder="Search…"
                className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300"
                aria-label="Search"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                ⌘K
              </span>
            </form>
          </div>

          {/* Slot kanan: tombol aksi */}
          {rightSlot ? <div className="hidden sm:block">{rightSlot}</div> : null}

          {/* User menu super sederhana */}
          <div className="ml-2 flex items-center gap-2">
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-sm font-medium text-slate-900">
                {user?.name || user?.email || "Admin"}
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {role || "GUEST"}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hidden rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              {loggingOut ? "Keluar..." : "Logout"}
            </button>
            <Link
              href="/profile"
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-white text-sm font-semibold"
              aria-label="Open profile"
            >
              {(user?.name || user?.email || "A").slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
