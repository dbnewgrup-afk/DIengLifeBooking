import type { Product } from "@/types";
import { formatUnitPrice } from "@/lib/format";

export function ProductInfoSection({
  product,
  description,
  onSelect,
}: {
  product: Product;
  description?: string;
  onSelect?: () => void;
}) {
  return (
    <>
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{product.name}</h1>
            {product.location && (
              <div className="text-sm text-[var(--muted)]">{product.location}</div>
            )}
          </div>

          <div className="text-right">
            {typeof product.rating === "number" && (
              <div className="mb-1">
                <span className="badge" aria-label={`Rating ${product.rating} dari 5`}>
                  ⭐ {product.rating.toFixed(1)}
                </span>
              </div>
            )}
            <div className="text-sm">
              <span className="font-semibold">{formatUnitPrice(product.price, product.unit)}</span>
            </div>
            {onSelect && (
              <button className="btn btn-brand mt-2" onClick={onSelect}>
                Select Product
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="font-medium mb-2">Tentang {product.name}</div>
        <p className="text-sm text-[var(--muted)]">
          {description ||
            "Deskripsi singkat produk. (FE-only placeholder) Tambahkan fasilitas, kebijakan check-in/out, dan catatan penting di sini nanti."}
        </p>
      </div>
    </>
  );
}
