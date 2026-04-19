import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicAuthLanding } from "@/components/auth/PublicAuthLanding";
import { buildAdminUrl } from "@/lib/auth";

const registerChoices = [
  {
    title: "Register user",
    description:
      "Buat akun customer untuk booking lebih cepat, simpan data dasar, dan lanjut checkout tanpa isi ulang form berulang.",
    href: "/register/user",
    ctaLabel: "Buat akun user",
    badge: "Customer",
    accentClassName: "from-sky-500/25 via-cyan-500/15 to-white",
  },
];

export default function RegisterChooserPage() {
  redirect("/register/user");
  /* legacy chooser removed
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {registerOptions.map((item, index) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-32px_rgba(15,23,42,.42)]"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-50)] text-lg font-bold text-slate-900">
              {index + 1}
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            <div className="mt-5 text-sm font-semibold text-slate-900">Lanjut isi formulir →</div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-sm">
        Sudah punya akun?
        {" "}
        <Link href="/login" className="font-semibold text-slate-900 underline underline-offset-4">
          Masuk lewat halaman login
        </Link>
        .
      </div>
    </div>
  */
}
