"use client";

import { useLang } from "@/components/i18n/lang";

export default function TermsPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <div className="container-page py-8 prose prose-slate max-w-3xl">
      <h1>{L("Syarat & Ketentuan", "Terms & Conditions")}</h1>
      <p>
        {L(
          "Dengan menggunakan layanan kami, Anda setuju pada syarat dan ketentuan berikut.",
          "By using our services, you agree to the following terms and conditions."
        )}
      </p>

      <h2>{L("Penggunaan Layanan", "Use of Service")}</h2>
      <ul>
        <li>{L("Pengguna wajib memberikan data yang akurat.", "Users must provide accurate information.")}</li>
        <li>{L("Dilarang menyalahgunakan sistem atau melanggar hukum.", "Do not abuse the system or violate laws.")}</li>
      </ul>

      <h2>{L("Pembayaran & Pembatalan", "Payment & Cancellation")}</h2>
      <ul>
        <li>{L("Semua pembayaran bersifat final kecuali diatur lain.", "All payments are final unless stated otherwise.")}</li>
        <li>{L("Kebijakan pembatalan mengikuti ketentuan produk.", "Cancellation policy follows product rules.")}</li>
      </ul>

      <h2>{L("Batasan Tanggung Jawab", "Limitation of Liability")}</h2>
      <p>
        {L(
          "Kami tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial.",
          "We are not liable for indirect, incidental, or consequential damages."
        )}
      </p>
    </div>
  );
}
