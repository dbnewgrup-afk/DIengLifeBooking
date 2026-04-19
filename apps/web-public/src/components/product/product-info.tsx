export type ProductInfoProps = {
  title: string;
  shortDescription?: string;
  facilities?: string[];
  rules?: string[];
};

export function ProductInfo({
  title,
  shortDescription = "Semua yang kamu butuh untuk liburan santai tanpa drama.",
  facilities = [],
  rules = [],
}: ProductInfoProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-xl font-extrabold tracking-tight text-slate-900">{title} ✨</h2>
      <p className="mb-4 text-slate-600">{shortDescription}</p>

      {facilities.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Yang kamu dapet</h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {facilities.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-300"></span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rules.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800">Catatan kecil</h3>
          <ul className="space-y-1">
            {rules.map((r, i) => (
              <li key={i} className="text-sm text-slate-600">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
