import { redirect } from "next/navigation";

// ⚠️ LEGACY - DO NOT USE

/**
 * DO NOT USE - legacy.
 * Dashboard statis lama ini tidak boleh dipakai lagi.
 * Semua akses diarahkan ke route admin aktif.
 */
export default function LegacyDashboardPage() {
  redirect("/admin");
}
