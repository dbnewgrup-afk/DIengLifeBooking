"use client";
import * as React from "react";
import { C } from "../lib/styles";

export type WithdrawFormData = {
  amount: string;
  bank: string;
  account: string;
  owner: string;
};

export function WithdrawForm({
  balance,
  onSubmit,
}: {
  balance: number;
  onSubmit: (v: WithdrawFormData) => void;
}) {
  const [form, setForm] = React.useState<WithdrawFormData>({
    amount: "",
    bank: "",
    account: "",
    owner: "",
  });
  const canSubmit =
    Number(form.amount) > 0 &&
    form.bank.trim() &&
    form.account.trim() &&
    form.owner.trim();

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.86)",
        border: "1px solid rgba(255,255,255,0.70)",
        borderRadius: 16,
        padding: 14,
        boxShadow: "0 12px 30px rgba(2,47,64,.12)",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 900, color: "#102a43", marginBottom: 8 }}>
        Buat Permintaan Tarik Saldo
      </div>

      <div style={C.label}>Nominal</div>
      <input
        style={C.input}
        placeholder="cth. 1500000"
        value={form.amount}
        onChange={(e) =>
          setForm({ ...form, amount: e.target.value.replace(/[^\d]/g, "") })
        }
      />
      <div style={{ ...C.mutedSmall, marginBottom: 10 }}>
        Saldo tersedia: {new Intl.NumberFormat("id-ID").format(balance)}
      </div>

      <div style={C.label}>Bank</div>
      <select
        style={C.select}
        value={form.bank}
        onChange={(e) => setForm({ ...form, bank: e.target.value })}
      >
        <option value="">Pilih bank</option>
        <option value="BCA">BCA</option>
        <option value="BNI">BNI</option>
        <option value="BRI">BRI</option>
        <option value="Mandiri">Mandiri</option>
      </select>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
        <div>
          <div style={C.label}>No Rekening</div>
          <input
            style={C.input}
            placeholder="1234567890"
            value={form.account}
            onChange={(e) => setForm({ ...form, account: e.target.value })}
          />
        </div>
        <div>
          <div style={C.label}>Nama Pemilik</div>
          <input
            style={C.input}
            placeholder="Nama sesuai rekening"
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          style={{
            ...C.btnPrimary,
            cursor: canSubmit ? "pointer" : "not-allowed",
            opacity: canSubmit ? 1 : 0.6,
          }}
          disabled={!canSubmit}
          onClick={() => canSubmit && onSubmit(form)}
        >
          Kirim Permintaan
        </button>
      </div>
    </div>
  );
}
