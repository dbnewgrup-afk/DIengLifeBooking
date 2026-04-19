export default function NotFound() {
  return (
    <main className="min-h-screen bg-sky-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-6 text-center shadow">
        <h1 className="text-2xl font-extrabold text-sky-900">Halaman Tidak Ditemukan</h1>
        <p className="mt-2 text-sm text-sky-800/80">
          Cek kembali URL atau pilih menu di kiri.
        </p>
        <a
          href="/"
          className="mt-4 inline-flex rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </main>
  );
}
