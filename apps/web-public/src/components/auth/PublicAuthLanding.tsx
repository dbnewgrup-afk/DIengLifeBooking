import Link from "next/link";
import type { ReactNode } from "react";

type PublicAuthChoice = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  badge: string;
  accentClassName: string;
};

type PublicAuthLandingProps = {
  eyebrow: string;
  title: string;
  description: string;
  choices: PublicAuthChoice[];
  helper?: ReactNode;
};

export function PublicAuthLanding({
  eyebrow,
  title,
  description,
  choices,
  helper,
}: PublicAuthLandingProps) {
  return (
    <div className="container-page py-10 sm:py-14">
      <section className="overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(135deg,rgba(11,32,55,.96),rgba(16,48,79,.88),rgba(56,174,204,.62))] px-6 py-8 text-white shadow-[0_24px_80px_-30px_rgba(11,32,55,.6)] sm:px-8">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100">
          {eyebrow}
        </span>
        <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-sky-50/85 sm:text-base">
          {description}
        </p>
      </section>

      <div className={`mt-6 grid gap-4 ${choices.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {choices.map((choice) => (
          <Link
            key={choice.title}
            href={choice.href}
            className="group rounded-[1.75rem] border border-[var(--line)] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,.35)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-32px_rgba(15,23,42,.42)]"
          >
            <div className={`rounded-[1.4rem] bg-gradient-to-br ${choice.accentClassName} p-5`}>
              <span className="inline-flex rounded-full border border-white/40 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-900">
                {choice.badge}
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
                {choice.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {choice.description}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-900">
              <span>{choice.ctaLabel}</span>
              <span className="transition group-hover:translate-x-1">-&gt;</span>
            </div>
          </Link>
        ))}
      </div>

      {helper ? (
        <div className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white/90 px-5 py-4 text-sm text-slate-600 shadow-sm">
          {helper}
        </div>
      ) : null}
    </div>
  );
}
