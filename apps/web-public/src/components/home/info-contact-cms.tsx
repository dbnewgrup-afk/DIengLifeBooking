import type { HomepageContactContent } from "@/lib/homepage-cms";

export function InfoContactCms({
  content,
}: {
  content: HomepageContactContent;
}) {
  return (
    <section className="container-page py-10" aria-labelledby="contact-title">
      <h2 id="contact-title" className="mb-4 text-lg font-semibold">{content.title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card text-sm text-[var(--muted)]">
          <div className="mb-1 font-semibold text-[var(--text)]">{content.supportTitle}</div>
          <div>
            WA:{" "}
            <a className="underline" href={content.whatsappHref} target="_blank" rel="noopener noreferrer">
              {content.whatsappLabel}
            </a>
          </div>
          <div>
            Email:{" "}
            <a className="underline" href={`mailto:${content.emailLabel}`}>
              {content.emailLabel}
            </a>
          </div>
        </div>
        <div className="card text-sm text-[var(--muted)]">
          <div className="mb-1 font-semibold text-[var(--text)]">{content.hoursTitle}</div>
          <div>{content.hoursText}</div>
        </div>
        <div className="card text-sm text-[var(--muted)]">
          <div className="mb-1 font-semibold text-[var(--text)]">{content.officeTitle}</div>
          <div>{content.officeText}</div>
        </div>
      </div>
    </section>
  );
}
