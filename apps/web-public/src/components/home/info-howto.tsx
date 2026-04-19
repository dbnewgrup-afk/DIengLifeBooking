import type { HomepageHowToContent } from "@/lib/homepage-cms";

export function InfoHowTo({
  content,
}: {
  content: HomepageHowToContent;
}) {
  return (
    <section className="container-page py-10">
      <h2 className="text-lg font-semibold mb-4">{content.title}</h2>
      <ol className="list-decimal list-inside text-sm text-[var(--muted)] space-y-1 card">
        {content.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
