"use client";
import type { Product } from "../lib/types";
import { card, form as s, misc } from "../lib/styles";
import Labeled from "../ui/Labeled";
import QtyInput from "../ui/QtyInput";

export default function WalkinPanel({
  products,
  productsLoading,
  productsError,
  value,
  onChange,
  product,
  nights,
  total,
  busy,
  fmtIDR,
  onSubmit,
}: {
  products: Product[];
  productsLoading?: boolean;
  productsError?: string | null;
  value: {
    productId: string;
    start: string;
    end: string;
    qtyRoom: number;
    guestCount: number;
    custName: string;
    custEmail: string;
    phone: string;
    affiliate: string;
    notes: string;
  };
  onChange: (patch: Partial<typeof value>) => void;
  product?: Product;
  nights: number;
  total: number;
  busy?: boolean;
  fmtIDR: (n: number) => string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const noProducts = !productsLoading && !productsError && products.length === 0;

  return (
    <form onSubmit={onSubmit} style={s.grid}>
      {/* LEFT: form */}
      <section style={card.panel}>
        <div style={card.panelTitle}>Reservasi Walk-in</div>

        {productsLoading ? <div style={s.hint}>Memuat listing aktif dari backend...</div> : null}
        {productsError ? <div style={{ ...s.hint, color: "#b91c1c" }}>{productsError}</div> : null}
        {noProducts ? <div style={s.hint}>Belum ada listing aktif dari backend untuk dipakai walk-in.</div> : null}

        <Labeled label="Produk" required>
          <select
            style={s.select}
            value={value.productId}
            onChange={e => onChange({ productId: (e.target as HTMLSelectElement).value })}
            disabled={productsLoading || noProducts}
          >
            {products.length === 0 ? <option value="">Tidak ada produk</option> : null}
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} • {fmtIDR(p.price)}
                {p.unit === "malam" ? "/mlm" : ""}
              </option>
            ))}
          </select>
        </Labeled>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          <Labeled label="Mulai" required>
            <input
              type="date"
              style={s.input}
              value={value.start}
              onChange={e => onChange({ start: (e.target as HTMLInputElement).value })}
            />
          </Labeled>
          <Labeled
            label="Selesai"
            hint={product?.unit === "malam" ? "Wajib untuk per malam" : "Boleh kosong untuk paket"}
          >
            <input
              type="date"
              style={s.input}
              value={value.end}
              onChange={e => onChange({ end: (e.target as HTMLInputElement).value })}
              disabled={product?.unit !== "malam"}
            />
          </Labeled>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
          <Labeled label="Jumlah Kamar/Unit" required>
            <QtyInput value={value.qtyRoom} min={1} onChange={n => onChange({ qtyRoom: n })} />
          </Labeled>
          <Labeled label="Jumlah Tamu" required>
            <QtyInput value={value.guestCount} min={1} onChange={n => onChange({ guestCount: n })} />
          </Labeled>
          <Labeled label="Nama Customer" required>
            <input
              style={s.input}
              value={value.custName}
              onChange={e => onChange({ custName: (e.target as HTMLInputElement).value })}
            />
          </Labeled>
          <Labeled label="Email Customer" required>
            <input
              style={s.input}
              inputMode="email"
              type="email"
              value={value.custEmail}
              onChange={e => onChange({ custEmail: (e.target as HTMLInputElement).value })}
            />
          </Labeled>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
          <Labeled label="No. Telepon" required>
            <input
              style={s.input}
              inputMode="tel"
              value={value.phone}
              onChange={e => onChange({ phone: (e.target as HTMLInputElement).value })}
            />
          </Labeled>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
          <Labeled label="Affiliate ID (opsional)">
            <input
              style={s.input}
              value={value.affiliate}
              onChange={e => onChange({ affiliate: (e.target as HTMLInputElement).value })}
            />
          </Labeled>
          <Labeled label="Catatan (opsional)">
            <input
              style={s.input}
              value={value.notes}
              onChange={e => onChange({ notes: (e.target as HTMLInputElement).value })}
              placeholder="Mis. late check-in, permintaan khusus"
            />
          </Labeled>
        </div>

        <div style={s.footer}>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {product?.unit === "malam" ? (
              <>
                <b>{value.qtyRoom}</b> kamar × <b>{nights}</b> malam × {fmtIDR(product?.price ?? 0)}
              </>
            ) : (
              <>
                <b>{value.qtyRoom}</b> unit × {fmtIDR(product?.price ?? 0)}
              </>
            )}
          </div>
          <button type="submit" style={s.primary} disabled={busy || productsLoading || noProducts}>
            {busy ? "Menyimpan..." : "Buat Order"}
          </button>
        </div>
      </section>

      {/* RIGHT: receipt panel */}
      <aside style={{ ...card.panel, ...card.rightSticky }}>
        <div style={card.panelTitle}>Ringkasan</div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Produk</span>
          <span>{product?.name || "-"}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Tipe</span>
          <span>{product?.unit === "malam" ? "Per malam" : product?.unit ? product.unit : "-"}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Mulai</span>
          <span>{value.start || "-"}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Selesai</span>
          <span>{product?.unit === "malam" ? value.end || "-" : "-"}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Durasi</span>
          <span>
            {product?.unit === "malam" ? (
              <span
                style={{
                  marginLeft: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 999,
                  padding: "2px 8px",
                  background: "linear-gradient(180deg, rgba(16,185,129,.14), rgba(16,185,129,.20))",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {nights} malam
              </span>
            ) : (
              "-"
            )}
          </span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Qty</span>
          <span>{value.qtyRoom}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Guest Count</span>
          <span>{value.guestCount}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Customer</span>
          <span>{value.custName || "-"}</span>
        </div>
        <div style={misc.row}>
          <span style={misc.rowMuted}>Email</span>
          <span>{value.custEmail || "-"}</span>
        </div>

        <div style={misc.line} />

        <div style={misc.row}>
          <span style={misc.rowMuted}>Harga Satuan</span>
          <span>{fmtIDR(product?.price || 0)}</span>
        </div>
        <div style={{ ...misc.row, ...card.totalBox }}>
          <span style={{ fontWeight: 900, color: "#053343" }}>Perkiraan Total</span>
          <span style={{ fontWeight: 900, color: "#053343" }}>{fmtIDR(total)}</span>
        </div>
      </aside>
    </form>
  );
}
