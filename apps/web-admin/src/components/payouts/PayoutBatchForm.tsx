"use client";

import * as React from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { toast } from "../ui/Toast";

export type PartnerItem = { id: string; name: string; amount?: number };

export type PayoutBatchFormProps = {
  apiBase?: string;
  getToken?: () => string | null;
  partners: PartnerItem[]; // daftar seller, amount bisa diisi user
  note?: string;
  onSubmitted?: (batchCode: string) => void;
};

export default function PayoutBatchForm({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  partners,
  note = "",
  onSubmitted,
}: PayoutBatchFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<PartnerItem[]>(
    partners.map(p => ({ ...p, amount: p.amount ?? 0 }))
  );
  const [batchNote, setBatchNote] = React.useState(note);

  function setAmount(id: string, amt: number) {
    setItems(prev => prev.map(p => (p.id === id ? { ...p, amount: amt } : p)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payloadItems = items.filter(i => (i.amount || 0) > 0).map(i => ({ partnerId: i.id, amount: Number(i.amount) }));
    if (payloadItems.length === 0) {
      toast.warn("Isi minimal satu item dengan amount > 0");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/payouts/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: withBearer(getToken()) },
        body: JSON.stringify({ note: batchNote || undefined, items: payloadItems }),
      });
      if (!res.ok) throw new Error(`Create batch gagal: ${res.status}`);
      const json = (await res.json()) as { code?: string; data?: { code?: string } };
      const code = json?.code || json?.data?.code;
      toast.success(`Batch dibuat: ${code ?? "(unknown)"}`);
      if (code) {
        onSubmitted?.(code);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal membuat batch"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Catatan Batch (opsional)"
        value={batchNote}
        onChange={e => setBatchNote(e.target.value)}
        placeholder="Payout minggu ini"
      />

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold">Items</div>
        <div className="divide-y divide-slate-200">
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-500">Seller ID: {p.id}</div>
              </div>
              <div className="w-48">
                <Input
                  label="Amount (IDR)"
                  type="number"
                  min={0}
                  value={p.amount ?? 0}
                  onChange={e => setAmount(p.id, Number(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" loading={loading}>
          Buat Draft Batch
        </Button>
      </div>
    </form>
  );
}

function defaultGetToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_session") || sessionStorage.getItem("admin_session");
}
function withBearer(token: string | null) {
  return token ? `Bearer ${token}` : "";
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
