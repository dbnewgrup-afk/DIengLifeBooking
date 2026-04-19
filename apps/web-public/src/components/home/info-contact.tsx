export function InfoContact() {
  return (
    <section className="container-page py-10" aria-labelledby="contact-title">
      <h2 id="contact-title" className="text-lg font-semibold mb-4">Contact</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-sm text-[var(--muted)]">
          <div className="font-semibold text-[var(--text)] mb-1">Customer Service</div>
          <div>
            WA:{" "}
            <a className="underline" href="https://wa.me/6281200000000" target="_blank" rel="noopener noreferrer">
              +62 812-0000-0000
            </a>
          </div>
          <div>
            Email:{" "}
            <a className="underline" href="mailto:cs@green-grey.example">
              cs@green-grey.example
            </a>
          </div>
        </div>
        <div className="card text-sm text-[var(--muted)]">
          <div className="font-semibold text-[var(--text)] mb-1">Jam Operasional</div>
          <div>Setiap hari 08:00–21:00 WIB</div>
        </div>
        <div className="card text-sm text-[var(--muted)]">
          <div className="font-semibold text-[var(--text)] mb-1">Alamat Kantor</div>
          <div>Jl. Contoh Indah No. 123, Kota Wisata</div>
        </div>
      </div>
    </section>
  );
}
