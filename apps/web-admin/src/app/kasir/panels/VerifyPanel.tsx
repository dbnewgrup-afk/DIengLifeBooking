"use client";
import type { CashierBookingRow } from "../lib/types";
import { card, form as s, misc } from "../lib/styles";
import Labeled from "../ui/Labeled";

export default function VerifyPanel({
  queue,
  queueLoading,
  queueError,
  value,
  onChange,
  busy,
  onSubmit,
}: {
  queue: CashierBookingRow[];
  queueLoading?: boolean;
  queueError?: string | null;
  value: { code: string };
  onChange: (p: Partial<{ code: string }>) => void;
  busy?: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} style={{ ...card.panel, marginTop: 12 }}>
      <div style={card.panelTitle}>Verifikasi Xendit</div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 12, alignItems: "end" }}>
        <Labeled label="Kode Booking" required>
          <input
            style={s.input}
            value={value.code}
            onChange={e => onChange({ code: (e.target as HTMLInputElement).value })}
          />
        </Labeled>
        <button type="submit" style={s.primary} disabled={busy}>
          {busy ? "Memeriksa..." : "Verifikasi"}
        </button>
      </div>
      <div style={s.hint}>Masukkan kode booking untuk mengambil status invoice terbaru dari Xendit.</div>

      <div style={misc.line} />
      <div style={{ fontSize: 13, fontWeight: 900, color: "#102a43", marginBottom: 8 }}>Antrian verifikasi Xendit</div>

      {queueLoading ? <div style={s.hint}>Memuat antrian invoice Xendit dari backend...</div> : null}
      {queueError ? <div style={{ ...s.hint, color: "#b91c1c" }}>{queueError}</div> : null}
      {!queueLoading && !queueError && queue.length === 0 ? (
        <div style={s.hint}>Tidak ada booking online yang masih menunggu verifikasi Xendit.</div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        {queue.map(item => (
          <div
            key={item.code}
            style={{
              border: "1px solid #dbe8f0",
              borderRadius: 14,
              padding: 12,
              background: "rgba(248,252,255,.92)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#0f172a" }}>{item.code}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                  {item.customerName} • {item.productName}
                </div>
              </div>
              <button
                type="button"
                style={{
                  ...s.primary,
                  padding: "8px 12px",
                  fontSize: 12,
                }}
                onClick={() => onChange({ code: item.code })}
              >
                Pilih
              </button>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginTop: 8,
                fontSize: 12,
                color: "#334155",
              }}
            >
              <span>{item.paymentProvider || "XENDIT"}</span>
              <span>{item.paymentExternalId || item.code}</span>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
