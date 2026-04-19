"use client";

import * as React from "react";
import Input from "../ui/Input";
import DatePicker from "../ui/DatePicker";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

export type CloseOpenRequestFormProps = {
  apiBase?: string;
  getToken?: () => string | null;
  partnerId?: string; // jika sudah diketahui dari sesi
  products?: Array<{ id: string; code: string; name: string }>;
  onSubmitted?: () => void;
};

export default function CloseOpenRequestForm({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  partnerId,
  products = [],
  onSubmitted,
}: CloseOpenRequestFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [v, setV] = React.useState({
    productId: "",
    dateStart: "",
    dateEnd: "",
    note: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.productId || !v.dateStart || !v.dateEnd) {
      toast.warn("Lengkapi field wajib.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/approvals/close-open`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: withBearer(getToken()) },
        body: JSON.stringify({
          productId: v.productId,
          dateStart: v.dateStart,
          dateEnd: v.dateEnd,
          note: v.note || undefined,
          partnerId, // jika server butuh, atau ambil dari token
        }),
      });
      if (!res.ok) throw new Error(`Submit request gagal: ${res.status}`);
      toast.success("Request terkirim");
      onSubmitted?.();
      setV({ productId: "", dateStart: "", dateEnd: "", note: "" });
    } catch (e: any) {
      toast.error(e?.message || "Gagal submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label className="text-sm font-medium text-slate-700">Produk</label>
      <select
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        value={v.productId}
        onChange={e => setV(s => ({ ...s, productId: e.target.value }))}
        required
      >
        <option value="">-- pilih produk --</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.code})
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DatePicker
          label="Mulai"
          value={v.dateStart}
          onChange={e => setV(s => ({ ...s, dateStart: e.target.value }))}
          required
        />
        <DatePicker
          label="Selesai"
          min={v.dateStart || undefined}
          value={v.dateEnd}
          onChange={e => setV(s => ({ ...s, dateEnd: e.target.value }))}
          required
        />
      </div>

      <Textarea
        label="Catatan"
        hint="Opsional. Contoh: perbaikan, blok event, maintenance."
        value={v.note}
        onChange={e => setV(s => ({ ...s, note: e.target.value }))}
        rows={4}
      />

      <div className="pt-2">
        <Button type="submit" loading={loading}>
          Kirim Request
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
