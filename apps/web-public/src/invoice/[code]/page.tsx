"use client";

// ⚠️ LEGACY - DO NOT USE

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/components/i18n/lang";
import { formatRupiah } from "@/lib/format";

export default function InvoicePage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? "-";
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const issuedAt = new Date().toLocaleString();
  const total = 1250000;

  return (
    <div className="container-page py-8">
      <h1 className="mb-1 text-xl font-bold">{L("Invoice", "Invoice")}</h1>
      <p className="mb-6 text-sm text-[var(--muted)]">
        {L("Kode", "Code")}: <span className="font-mono">{code}</span>
      </p>

      <div className="space-y-3 rounded-xl border border-[var(--line)] bg-white/70 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm">{L("Tanggal terbit", "Issued at")}</span>
          <span className="text-sm font-medium">{issuedAt}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">{L("Status", "Status")}</span>
          <span className="text-sm font-semibold text-emerald-700">{L("Lunas", "Paid")}</span>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-2">
          <span className="text-sm">{L("Total", "Total")}</span>
          <span className="text-base font-semibold">{formatRupiah(total)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        {L(
          "Invoice resmi untuk alur baru diakses dari halaman verifikasi atau endpoint PDF.",
          "Official invoices for the new flow are accessed from the verification page or PDF endpoint."
        )}
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/verify" className="btn border border-[var(--line)] bg-white">
          {L("Buka Verifikasi", "Open Verification")}
        </Link>
        <Link href="/" className="btn btn-brand">
          {L("Kembali ke Beranda", "Back to Home")}
        </Link>
      </div>
    </div>
  );
}
