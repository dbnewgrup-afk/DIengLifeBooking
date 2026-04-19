import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="mt-10 border-t border-[var(--line)] bg-white"
      role="contentinfo"
      aria-labelledby="site-footer-title"
    >
      <div className="container-page py-8 text-sm text-[var(--muted)] flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[var(--brand-600)]" aria-hidden="true" />
          <span id="site-footer-title" className="font-medium text-[var(--text)]">
            Dieng Life Villas
          </span>
          <span className="ml-2">© {year}</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-6">
            <li><Link href="/privacy" className="hover:text-[var(--text)]">Privasi</Link></li>
            <li><Link href="/terms" className="hover:text-[var(--text)]">S&amp;K</Link></li>
            <li><Link href="/contact" className="hover:text-[var(--text)]">Kontak</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
