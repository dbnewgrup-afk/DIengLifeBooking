"use client";

import { useLang } from "@/components/i18n/lang";

export default function PrivacyPolicyPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="container-page py-8 prose prose-slate max-w-3xl">
      <h1>{L("Kebijakan Privasi", "Privacy Policy")}</h1>
      <p>
        {L(
          "Kami menghargai privasi Anda. Dokumen ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.",
          "We respect your privacy. This document explains how we collect, use, and protect your personal data."
        )}
      </p>

      <h2>{L("Data yang Dikumpulkan", "Data We Collect")}</h2>
      <ul>
        <li>{L("Informasi akun (nama, email, nomor telepon).", "Account info (name, email, phone).")}</li>
        <li>{L("Detail pemesanan (produk, tanggal, jumlah).", "Booking details (product, dates, quantity).")}</li>
        <li>{L("Data teknis (alamat IP, jenis perangkat).", "Technical data (IP address, device type).")}</li>
      </ul>

      <h2>{L("Penggunaan Data", "How We Use Data")}</h2>
      <ul>
        <li>{L("Memproses pesanan dan pembayaran.", "Process orders and payments.")}</li>
        <li>{L("Menyediakan dukungan pelanggan.", "Provide customer support.")}</li>
        <li>{L("Peningkatan layanan dan keamanan.", "Improve service and security.")}</li>
      </ul>

      <h2>{L("Kontak", "Contact")}</h2>
      <p>
        {L(
          "Untuk pertanyaan terkait privasi, hubungi kami di support@example.com.",
          "For privacy questions, contact us at support@example.com."
        )}
      </p>
    </div>
  );
}
