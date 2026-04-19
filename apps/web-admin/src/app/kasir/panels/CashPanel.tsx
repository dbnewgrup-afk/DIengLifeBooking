"use client";
import type { CashierBookingRow, ManualPaymentPayload } from "../lib/types";
import { card, form as s, misc } from "../lib/styles";
import Labeled from "../ui/Labeled";

type CashValue = { code: string; amount: number; method: ManualPaymentPayload["method"]; note: string };

export default function CashPanel({
  queue,
  queueLoading,
  queueError,
  value,
  onChange,
  busy,
  fmtIDR,
  onSubmit,
}: {
  queue: CashierBookingRow[];
  queueLoading?: boolean;
  queueError?: string | null;
  value: CashValue;
  onChange: (p: Partial<CashValue>) => void;
  busy?: boolean;
  fmtIDR: (value: number) => string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} style={{ ...card.panel, marginTop: 12 }}>
      <div style={card.panelTitle}>Mark Tunai/Transfer</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <Labeled label="Kode Order" required>
          <input style={s.input} value={value.code} onChange={e => onChange({ code: (e.target as HTMLInputElement).value })} />
        </Labeled>
        <Labeled label="Nominal" required>
          <input
            style={s.input}
            inputMode="numeric"
            value={value.amount ? String(value.amount) : ""}
            onChange={e =>
              onChange({
                amount: Math.max(0, Number((e.target as HTMLInputElement).value.replace(/[^\d]/g, "")) || 0),
              })
            }
            placeholder="cth. 1500000"
          />
        </Labeled>
        <Labeled label="Metode" required>
          <select
            style={s.select}
            value={value.method}
            onChange={e => onChange({ method: (e.target as HTMLSelectElement).value as ManualPaymentPayload["method"] })}
          >
            <option value="CASH">Tunai</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </Labeled>
      </div>
      <Labeled label="Catatan">
        <input style={s.input} value={value.note} onChange={e => onChange({ note: (e.target as HTMLInputElement).value })} />
      </Labeled>
      <button type="submit" style={{ ...s.primary, marginTop: 8 }} disabled={busy}>
        {busy ? "Memproses..." : "Tandai Pembayaran"}
      </button>

      <div style={misc.line} />
      <div style={{ fontSize: 13, fontWeight: 900, color: "#102a43", marginBottom: 8 }}>Antrian pembayaran pending</div>

      {queueLoading ? <div style={s.hint}>Memuat booking pending dari backend...</div> : null}
      {queueError ? <div style={{ ...s.hint, color: "#b91c1c" }}>{queueError}</div> : null}
      {!queueLoading && !queueError && queue.length === 0 ? (
        <div style={s.hint}>Tidak ada booking pending yang menunggu penandaan tunai/transfer.</div>
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
                onClick={() =>
                  onChange({
                    code: item.code,
                    amount: item.totalAmount,
                  })
                }
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
              <span>{item.locationText || "-"}</span>
              <span>{fmtIDR(item.totalAmount)}</span>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
