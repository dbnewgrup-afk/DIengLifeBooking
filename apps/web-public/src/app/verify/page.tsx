"use client";

// ⚠️ LEGACY - DO NOT USE

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const code = search.get("code")?.trim() ?? "";

  useEffect(() => {
    if (code) {
      router.replace(`/invoice/${encodeURIComponent(code)}`);
      return;
    }

    router.replace("/");
  }, [code, router]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Route verify lama sedang dialihkan ke flow invoice aktif.
      </div>
    </div>
  );
}
