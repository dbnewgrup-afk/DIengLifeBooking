import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicAuthLanding } from "@/components/auth/PublicAuthLanding";
import { buildAdminUrl } from "@/lib/auth";

const loginChoices = [
  {
    title: "Login user",
    description:
      "Untuk customer yang mau booking lebih cepat, cek pesanan, dan lanjut checkout tanpa isi ulang data dasar.",
    href: "/login/user",
    ctaLabel: "Masuk sebagai user",
    badge: "Customer",
    accentClassName: "from-sky-500/25 via-cyan-500/15 to-white",
  },
];

export default function LoginChooserPage() {
  redirect("/login/user");
  /* legacy chooser removed
      legacy chooser content removed
        {loginOptions.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`group rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-32px_rgba(15,23,42,.42)]`}
          >
            <div className={`rounded-2xl bg-gradient-to-br ${item.accent} p-4`}>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-900 shadow-sm">
                {item.title.split(" ")[1]?.[0] || "A"}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>Buka halaman login</span>
              <span className="transition group-hover:translate-x-1">→</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-sm">
        Belum punya akun?
        {" "}
        <Link href="/register" className="font-semibold text-slate-900 underline underline-offset-4">
          Pilih jalur register di sini
        </Link>
        .
      </div>
    </div>
  */
}
