import type { ReactNode } from "react";
import { redirect } from "next/navigation";

// ⚠️ LEGACY - DO NOT USE

/**
 * DO NOT USE - legacy.
 * Layout dashboard lama masih menyimpan menu statis yang sudah obsolete.
 * Pertahankan file ini hanya untuk memastikan route legacy selalu dibelokkan ke panel aktif.
 */
export default function LegacyDashboardLayout({ children }: { children: ReactNode }) {
  void children;
  redirect("/admin");
}
