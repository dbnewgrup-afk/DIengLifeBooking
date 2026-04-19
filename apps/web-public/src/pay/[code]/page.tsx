"use client";

// ⚠️ LEGACY - DO NOT USE

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function PayCodePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code?.trim() ?? "";

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (code) {
      window.location.replace(`/invoice/${encodeURIComponent(code)}`);
      return;
    }

    window.location.replace("/");
  }, [code]);

  return (
    <div className="container-page py-8">
      <div className="rounded-xl border border-[var(--line)] bg-white/70 p-5 text-sm text-[var(--muted)]">
        Route pembayaran lama sedang dialihkan ke invoice aktif.
      </div>
    </div>
  );
}
