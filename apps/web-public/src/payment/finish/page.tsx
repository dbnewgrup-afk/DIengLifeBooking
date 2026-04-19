"use client";

import Link from "next/link";
import { useLang } from "@/components/i18n/lang";

export default function PaymentFinishPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="container-page py-12 text-center">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-white/70 p-8">
        <div className="mb-3 text-3xl">OK</div>
        <h1 className="text-xl font-bold">{L("Pembayaran Berhasil", "Payment Successful")}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {L(
            "Terima kasih. Pesananmu sedang diproses. Gunakan halaman verifikasi untuk melihat status terbaru.",
            "Thank you. Your order is being processed. Use the verification page to see the latest status."
          )}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link href="/verify" className="btn border border-[var(--line)] bg-white">
            {L("Buka Verifikasi", "Open Verification")}
          </Link>
          <Link href="/" className="btn btn-brand">
            {L("Kembali ke Beranda", "Back to Home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
