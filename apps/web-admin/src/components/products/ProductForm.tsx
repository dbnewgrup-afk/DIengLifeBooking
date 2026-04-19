"use client";

import * as React from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";
import ProductStatusBadge, { type ProductStatus } from "./ProductStatusBadge";

export type ProductFormValues = {
  id?: string;
  code: string;
  name: string;
  type: string;
  price: number;
  status: ProductStatus;
};

export type ProductFormProps = {
  apiBase?: string;
  getToken?: () => string | null;
  defaultValues?: Partial<ProductFormValues>;
  onSubmitted?: (saved: ProductFormValues) => void;
};

export default function ProductForm({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  defaultValues,
  onSubmitted,
}: ProductFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [v, setV] = React.useState<ProductFormValues>({
    id: defaultValues?.id,
    code: defaultValues?.code || "",
    name: defaultValues?.name || "",
    type: defaultValues?.type || "",
    price: defaultValues?.price || 0,
    status: (defaultValues?.status as ProductStatus) || "ACTIVE",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.code || !v.name) {
      toast.warn("Code dan Name wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const isUpdate = !!v.id;
      const url = isUpdate ? `${apiBase}/products/${encodeURIComponent(String(v.id))}` : `${apiBase}/products`;
      const method = isUpdate ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: withBearer(getToken()) },
        body: JSON.stringify({
          code: v.code,
          name: v.name,
          type: v.type,
          price: Number(v.price) || 0,
          status: v.status,
        }),
      });
      if (!res.ok) throw new Error(`${isUpdate ? "Update" : "Create"} product gagal: ${res.status}`);
      const json = await res.json();
      const saved = (json?.data || json) as ProductFormValues;
      toast.success(`Produk ${isUpdate ? "diupdate" : "dibuat"}`);
      onSubmitted?.(saved);
    } catch (e: any) {
      toast.error(e?.message || "Gagal submit product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Code" value={v.code} onChange={e => setV(s => ({ ...s, code: e.target.value }))} required />
        <Input label="Name" value={v.name} onChange={e => setV(s => ({ ...s, name: e.target.value }))} required />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Type" value={v.type} onChange={e => setV(s => ({ ...s, type: e.target.value }))} />
        <Input
          label="Price (IDR)"
          type="number"
          min={0}
          value={v.price}
          onChange={e => setV(s => ({ ...s, price: Number(e.target.value) }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Status"
          value={v.status}
          onChange={e => setV(s => ({ ...s, status: e.target.value as ProductStatus }))}
          options={[
            { label: "ACTIVE", value: "ACTIVE" },
            { label: "INACTIVE", value: "INACTIVE" },
            { label: "ARCHIVED", value: "ARCHIVED" },
          ]}
        />
        <div className="pt-6">
          <ProductStatusBadge status={v.status} />
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" loading={loading}>
          {v.id ? "Simpan Perubahan" : "Buat Produk"}
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
