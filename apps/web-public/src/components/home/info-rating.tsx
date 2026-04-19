export function InfoRating() {
  const items: { name: string; text: string; stars: 1|2|3|4|5 }[] = [
    { name: "Nadia", text: "Villa bersih, sunrise jeep mantap!", stars: 5 },
    { name: "Bima", text: "Proses booking cepat, CS responsif.", stars: 5 },
    { name: "Sari", text: "Dokumentasi bagus, hasil fotonya cakep.", stars: 4 },
  ];

  return (
    <section className="container-page py-10" aria-labelledby="rating-title">
      <h2 id="rating-title" className="text-lg font-semibold mb-4">Rating & Review</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((r, i) => (
          <div key={i} className="card">
            <div className="font-medium">{r.name}</div>
            <div className="text-yellow-500 text-sm" aria-label={`${r.stars} dari 5 bintang`}>
              {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
            </div>
            <p className="text-sm text-[var(--muted)] mt-1">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
