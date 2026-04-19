"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/i18n/lang";

const SECTIONS = [
  { id: "pusat-bantuan", labelID: "Pusat Bantuan", labelEN: "Help Center" },
  { id: "syarat", labelID: "Syarat & Ketentuan", labelEN: "Terms & Conditions" },
  { id: "hubungi", labelID: "Hubungi Kami", labelEN: "Contact Us" },
] as const;

export default function BantuanPage() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const [active, setActive] = useState<typeof SECTIONS[number]["id"]>("pusat-bantuan");

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActive(visible.target.id as typeof SECTIONS[number]["id"]);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0.01, 0.25, 0.5, 0.75] }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) io.observe(el);
    }

    return () => io.disconnect();
  }, []);

  return (
    <main
      className="
        min-h-screen
        pt-[calc(var(--nav-sm)+var(--nav-sub)+24px)] md:pt-[calc(var(--nav-md)+var(--nav-sub)+32px)]
        pb-20
        bg-[radial-gradient(circle_at_top,rgba(90,174,255,0.18),transparent_0_28%),linear-gradient(to_bottom,#071a2d_0%,#0b2037_30%,rgba(11,32,55,0.78)_62%,#eef4ff_100%)]
      "
    >
      <section className="container-page" id="top">
        <div className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/8 shadow-[0_30px_80px_rgba(3,10,18,0.32)] backdrop-blur-md">
          <div className="grid gap-8 px-6 py-7 md:grid-cols-[minmax(0,1.25fr)_320px] md:px-8 md:py-9">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/84">
                <span className="h-2 w-2 rounded-full bg-[var(--brand-400)]" aria-hidden="true" />
                {L("Pusat Bantuan Villa", "Villa Support Center")}
              </div>

              <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white md:text-5xl">
                {L("Bantuan yang lebih cepat, jelas, dan enak dibaca.", "Support that feels faster, clearer, and easier to navigate.")}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/86 md:text-base">
                {L(
                  "Temukan jawaban paling sering dicari, pahami aturan booking dengan cepat, lalu hubungi tim kami kalau masih butuh bantuan.",
                  "Find the most common answers, understand booking rules quickly, then contact our team if you still need help."
                )}
              </p>

              <nav className="mt-6 flex flex-wrap gap-3" aria-label="Daftar isi">
                {SECTIONS.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className={`group inline-flex min-h-11 items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active === section.id
                        ? "border-transparent bg-white text-[var(--text)] shadow-[0_12px_30px_rgba(255,255,255,0.22)]"
                        : "border-white/16 bg-white/8 text-white/88 hover:border-white/28 hover:bg-white/14"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        active === section.id
                          ? "bg-[var(--brand-100)] text-[var(--text)]"
                          : "bg-white/10 text-white/86 group-hover:bg-white/16"
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span>{L(section.labelID, section.labelEN)}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="grid gap-3 self-start rounded-[1.6rem] border border-white/14 bg-white/10 p-4">
              <SupportStat
                label={L("Respons cepat", "Quick response")}
                value={L("< 10 menit", "< 10 minutes")}
                description={L("Untuk pertanyaan umum via WhatsApp.", "For general WhatsApp inquiries.")}
              />
              <SupportStat
                label={L("Bantuan tersedia", "Support availability")}
                value={L("08.00 - 21.00", "08:00 - 21:00")}
                description={L("Setiap hari, termasuk akhir pekan.", "Daily, including weekends.")}
              />
              <SupportStat
                label={L("Topik utama", "Main topics")}
                value={L("Booking, reschedule, invoice", "Booking, reschedule, invoice")}
                description={L("Semua ringkas di satu halaman ini.", "Everything summarized on this page.")}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-16 md:space-y-20">
          <PusatBantuan />
          <Syarat />
          <HubungiKami />
        </div>

        <div className="mt-12 text-center">
          <a
            href="#top"
            onClick={(event) => smoothScrollTo(0, event)}
            className="inline-flex min-h-11 items-center rounded-full border border-white/14 bg-white/8 px-4 text-sm font-medium text-white/88 transition hover:bg-white/14"
          >
            {L("Kembali ke atas", "Back to top")}
          </a>
        </div>
      </section>
    </main>
  );
}

function PusatBantuan() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  return (
    <section id="pusat-bantuan" aria-label="Pusat Bantuan">
      <header className="mb-6 max-w-2xl">
        <SectionEyebrow>{L("Jawaban cepat", "Quick answers")}</SectionEyebrow>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{L("Pusat Bantuan", "Help Center")}</h2>
        <p className="mt-3 text-sm leading-7 text-blue-50/78 md:text-base">
          {L(
            "FAQ singkat untuk pertanyaan yang paling sering masuk, disusun agar gampang discan dari mobile maupun desktop.",
            "Short FAQs for the most common questions, arranged to be easy to scan on both mobile and desktop."
          )}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Accordion
          items={[
            {
              q: L("Bagaimana cara memesan villa?", "How do I book a villa?"),
              a: L(
                "Buka halaman Villa, pilih properti, tentukan tanggal dan jumlah tamu, lalu lanjutkan ke checkout. Pembayaran via Xendit mengikuti instruksi di layar.",
                "Open the Villa page, pick a property, set dates and guests, then proceed to checkout. Payments via Xendit follow the on-screen steps."
              ),
            },
            {
              q: L("Apakah bisa reschedule?", "Can I reschedule?"),
              a: L(
                "Bisa, selama masih di luar window pembekuan. Cek detail di bagian Syarat & Ketentuan.",
                "Yes, as long as you're still outside the freeze window. See the details in Terms & Conditions."
              ),
            },
            {
              q: L("Kode promo tidak bekerja?", "Promo code doesn't work?"),
              a: L(
                "Pastikan masa berlaku dan kategori sesuai. Beberapa promo tidak berlaku saat high season.",
                "Check the validity period and category. Some promos do not apply during high season."
              ),
            },
          ]}
        />

        <Accordion
          items={[
            {
              q: L("Trip jeep start jam berapa?", "What time does the jeep trip start?"),
              a: L(
                "Paling pagi 03:30 untuk paket sunrise. Titik kumpul tercantum di voucher booking.",
                "The earliest departure is 03:30 for the sunrise package. The meeting point is listed on your booking voucher."
              ),
            },
            {
              q: L("Apakah harga transport sudah termasuk tol dan parkir?", "Does transport price include toll and parking?"),
              a: L(
                "Kecuali disebutkan lain, harga yang tampil sudah all-in. Rincian tertera ketika memilih rute.",
                "Unless stated otherwise, the displayed price is already all-in. The breakdown appears when you choose a route."
              ),
            },
            {
              q: L("Apakah ada bukti/invoice?", "Do I get an invoice?"),
              a: L(
                "Ya. Setelah pembayaran sukses, invoice otomatis dikirim via WhatsApp/email dan bisa diunduh dari halaman riwayat.",
                "Yes. After successful payment, the invoice is sent automatically via WhatsApp/email and can also be downloaded from your history page."
              ),
            },
          ]}
        />
      </div>
    </section>
  );
}

function Syarat() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const terms = [
    {
      h: L("Pembatalan", "Cancellation"),
      p: L(
        "Gratis pembatalan H-7. H-6 s/d H-3 potong 50%. H-2 s/d H0 non-refundable.",
        "Free cancellation up to D-7. D-6 to D-3 incurs a 50% fee. D-2 to D0 is non-refundable."
      ),
    },
    {
      h: L("Reschedule", "Reschedule"),
      p: L("Maksimal 1 kali, minimal H-3, tergantung ketersediaan.", "Maximum once, at least D-3, subject to availability."),
    },
    {
      h: L("Check-in/Check-out", "Check-in/Check-out"),
      p: L("Check-in 14.00, check-out 12.00. Early/late by request.", "Check-in 14:00, check-out 12:00. Early/late by request."),
    },
    {
      h: L("Pembayaran", "Payment"),
      p: L(
        "Semua pembayaran diproses aman melalui Xendit. Jangan transfer ke rekening personal.",
        "All payments are processed securely through Xendit. Never transfer to a personal bank account."
      ),
    },
    {
      h: L("Ketentuan Khusus", "Special Terms"),
      p: L(
        "Beberapa properti/layanan memiliki aturan tambahan. Baca deskripsi produk sebelum bayar.",
        "Some properties and services have additional rules. Read the product description before paying."
      ),
    },
  ];

  return (
    <section id="syarat" aria-label="Syarat dan Ketentuan">
      <header className="mb-6 max-w-2xl">
        <SectionEyebrow>{L("Aturan booking", "Booking rules")}</SectionEyebrow>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{L("Syarat & Ketentuan", "Terms & Conditions")}</h2>
        <p className="mt-3 text-sm leading-7 text-blue-50/78 md:text-base">
          {L(
            "Dirangkum singkat supaya mudah dipahami sebelum checkout, tanpa perlu baca dokumen panjang di awal.",
            "Summarized clearly so it is easy to understand before checkout, without reading a long document first."
          )}
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {terms.map((term, index) => (
          <li
            key={index}
            className="group rounded-[1.5rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-sm font-semibold text-[var(--text)]">
                0{index + 1}
              </span>
              <h3 className="font-semibold text-[var(--text)]">{term.h}</h3>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{term.p}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function HubungiKami() {
  const { lang } = useLang();
  const L = (id: string, en: string) => (lang === "en" ? en : id);

  const [sent, setSent] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setSent(true);

    setTimeout(() => {
      setSent(false);
      formRef.current?.reset();
    }, 1400);
  };

  return (
    <section id="hubungi" aria-label="Hubungi Kami">
      <header className="mb-6 max-w-2xl">
        <SectionEyebrow>{L("Kontak langsung", "Direct contact")}</SectionEyebrow>
        <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">{L("Hubungi Kami", "Contact Us")}</h2>
        <p className="mt-3 text-sm leading-7 text-blue-50/78 md:text-base">
          {L(
            "Kalau masih butuh bantuan, kirim pesan singkat atau gunakan kontak resmi di samping.",
            "If you still need help, send a short message or use the official contact details beside the form."
          )}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <form
          ref={formRef}
          onSubmit={submit}
          className="rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6"
        >
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-[var(--text)]">{L("Kirim pesan", "Send a message")}</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {L("Isi data singkat di bawah, tim kami akan bantu arahkan.", "Fill in the short form below and our team will help you out.")}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]" htmlFor="name">
                {L("Nama", "Name")}
              </label>
              <input id="name" name="name" required className="input min-h-12" placeholder={L("Nama lengkap", "Full name")} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]" htmlFor="email">
                Email
              </label>
              <input id="email" name="email" type="email" required className="input min-h-12" placeholder="nama@email.com" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--text)]" htmlFor="msg">
                {L("Pesan", "Message")}
              </label>
              <textarea
                id="msg"
                name="msg"
                required
                rows={5}
                className="input min-h-32 resize-y"
                placeholder={L("Ceritakan kebutuhan atau kendala Anda...", "Tell us what you need help with...")}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-brand mt-5 w-full sm:w-auto" aria-live="polite" disabled={sent}>
            {sent ? L("Terkirim", "Sent") : L("Kirim Pesan", "Send Message")}
          </button>
        </form>

        <div className="rounded-[1.75rem] border border-white/14 bg-white/10 p-5 text-white shadow-[0_18px_45px_rgba(3,10,18,0.18)] backdrop-blur-md md:p-6">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">{L("Kontak resmi", "Official contacts")}</h3>
            <p className="mt-1 text-sm leading-6 text-blue-50/78">
              {L("Pilih kanal yang paling nyaman untuk Anda.", "Choose the channel that works best for you.")}
            </p>
          </div>

          <div className="space-y-3">
            <ContactRow label="WhatsApp">
              <Link href="https://wa.me/6281234567890" target="_blank" className="font-medium text-white underline decoration-white/35 underline-offset-4">
                +62 812-3456-7890
              </Link>
            </ContactRow>
            <ContactRow label="Email">
              <Link href="mailto:support@domainmu.com" className="font-medium text-white underline decoration-white/35 underline-offset-4">
                support@domainmu.com
              </Link>
            </ContactRow>
            <ContactRow label={L("Jam Layanan", "Service Hours")}>
              {L("Setiap hari 08.00-21.00 WIB", "Daily 08:00-21:00 GMT+7")}
            </ContactRow>
            <ContactRow label={L("Alamat", "Address")}>Jl. Contoh No. 123, Kota, Provinsi</ContactRow>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/12 bg-white/8 p-4">
            <div className="text-sm font-medium text-white">{L("Tips respon lebih cepat", "Tip for a faster reply")}</div>
            <p className="mt-2 text-sm leading-6 text-blue-50/76">
              {L(
                "Sertakan tanggal booking, nama produk, dan nomor pesanan jika sudah ada.",
                "Include your booking date, product name, and order number if available."
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-[1.15rem] border border-white/10 bg-white/7 px-4 py-3 md:grid-cols-[132px_1fr] md:items-start md:gap-3">
      <div className="text-sm font-medium text-blue-50/72">{label}</div>
      <div className="flex-1 text-sm leading-6 text-white/94">{children}</div>
    </div>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      {items.map((item, index) => (
        <AccordionItem key={index} q={item.q} a={item.a} />
      ))}
    </div>
  );
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200/80 last:border-b-0">
      <button
        className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[var(--bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-400)] focus-visible:ring-inset"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="pr-4 text-sm font-semibold leading-6 text-[var(--text)] md:text-base">{q}</span>
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-lg font-medium transition ${
            open ? "border-[var(--brand-100)] bg-[var(--brand-50)] text-[var(--text)]" : "border-slate-200 text-slate-500"
          }`}
          aria-hidden="true"
        >
          {open ? "-" : "+"}
        </span>
      </button>
      {open ? <div className="px-5 pb-5 text-sm leading-7 text-[var(--muted)]">{a}</div> : null}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/72">
      {children}
    </div>
  );
}

function SupportStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/12 bg-white/8 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-50/62">{label}</div>
      <div className="mt-2 text-base font-semibold text-white">{value}</div>
      <p className="mt-1 text-sm leading-6 text-blue-50/72">{description}</p>
    </div>
  );
}

function smoothScrollTo(y: number, event?: React.MouseEvent) {
  event?.preventDefault?.();
  window.scrollTo({ top: y, behavior: "smooth" });
}
