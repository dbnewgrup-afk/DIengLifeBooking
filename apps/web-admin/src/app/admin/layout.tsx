"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAccountManagementAccess } from "@/components/account-management/useAccountManagementAccess";
import { ADMIN_ROLES } from "@/lib/auth/role-routing";
import { clearToken } from "@/lib/auth/session";
import Tabs from "./ui/Tabs";
import { useAdminTabState } from "./lib/tab-state";

export default function AdminAreaLayout({ children }: { children: ReactNode }) {
  const { activeTab, setActiveTab } = useAdminTabState();
  const { canOpenAccountManagement } = useAccountManagementAccess();
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const isUtilityPage = pathname !== "/admin";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/clear-cookie", { method: "POST" });
    } finally {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.assign("/login/admin");
      }
    }
  }

  return (
    <AuthGuard requireRoles={ADMIN_ROLES} redirectTo="/login/admin">
      <div
        style={{
          minHeight: "100svh",
          background:
            "radial-gradient(60% 50% at 15% -10%, rgba(56,174,204,.16), transparent 60%), radial-gradient(55% 40% at 90% -10%, rgba(30,64,175,.20), transparent 60%), linear-gradient(180deg, #102a43 0%, #1e3a8a 58%, #312e81 100%)",
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 18px 40px" }}>
          <header
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 20,
              padding: 18,
              borderRadius: 22,
              background: "rgba(15,23,42,.28)",
              border: "1px solid rgba(255,255,255,.14)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h1 style={{ color: "#fff", fontSize: 32, lineHeight: 1.1, fontWeight: 900, margin: 0 }}>Admin</h1>
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "rgba(226,232,240,.86)",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  Panel admin marketplace dengan navigasi tab utama di header untuk berpindah antar panel tanpa memanjang ke bawah.
                </p>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {canOpenAccountManagement ? (
                  <Link
                    href="/admin/accounts"
                    className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                  >
                    Kelola akun
                  </Link>
                ) : null}
                <Link
                  href="/admin/reset-password"
                  className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Reset password saya
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    border: "1px solid rgba(255,255,255,.18)",
                    background: "rgba(15,23,42,.22)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: loggingOut ? "not-allowed" : "pointer",
                    opacity: loggingOut ? 0.7 : 1,
                  }}
                >
                  {loggingOut ? "Logout..." : "Logout"}
                </button>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    borderRadius: 999,
                    padding: "8px 12px",
                    background: "rgba(16,185,129,.14)",
                    color: "#d1fae5",
                    border: "1px solid rgba(110,231,183,.4)",
                    fontSize: 12,
                    fontWeight: 900,
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                  }}
                >
                  {loggingOut ? "Closing session..." : isUtilityPage ? "Utility page" : `${activeTab} panel`}
                </div>
              </div>
            </div>

            {isUtilityPage ? (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Link
                  href="/admin"
                  className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Kembali ke panel admin
                </Link>
              </div>
            ) : (
              <Tabs active={activeTab} onChange={setActiveTab} />
            )}
          </header>

          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
