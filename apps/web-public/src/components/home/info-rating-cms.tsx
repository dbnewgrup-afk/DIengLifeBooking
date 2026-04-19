import type { HomepageReviewsContent } from "@/lib/homepage-cms";

export function InfoRatingCms({
  content,
}: {
  content: HomepageReviewsContent;
}) {
  return (
    <section className="container-page py-10" aria-labelledby="rating-title">
      <h2 id="rating-title" className="mb-4 text-lg font-semibold">{content.title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {content.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="card">
            <div className="font-medium">{item.name}</div>
            <div className="text-sm text-yellow-500" aria-label={`${item.stars} dari 5 bintang`}>
              {"★".repeat(item.stars)}{"☆".repeat(5 - item.stars)}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
