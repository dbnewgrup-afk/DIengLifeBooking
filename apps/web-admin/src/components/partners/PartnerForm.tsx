"use client";

import * as React from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

export type PartnerFormValues = {
  id?: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  contactName?: string;
  contactPhone?: string;
};

export type PartnerFormProps = {
  apiBase?: string;
  getToken?: () => string | null;
  defaultValues?: Partial<PartnerFormValues>;
  onSubmitted?: (saved: PartnerFormValues) => void;
};

export default function PartnerForm({
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  defaultValues,
  onSubmitted,
}: PartnerFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [v, setV] = React.useState<PartnerFormValues>({
    id: defaultValues?.id,
    code: defaultValues?.code || "",
    name: defaultValues?.name || "",
    status: defaultValues?.status ?? "ACTIVE",
    contactName: defaultValues?.contactName || "",
    contactPhone: defaultValues?.contactPhone || "",
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
      const url = isUpdate ? `${apiBase}/partners/${encodeURIComponent(String(v.id))}` : `${apiBase}/partners`;
      const method = isUpdate ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: withBearer(getToken()) },
        body: JSON.stringify({
          code: v.code,
          name: v.name,
          status: v.status,
          contactName: v.contactName || undefined,
          contactPhone: v.contactPhone || undefined,
        }),
      });
      if (!res.ok) throw new Error(`${isUpdate ? "Update" : "Create"} seller gagal: ${res.status}`);
      const json = (await res.json()) as { data?: PartnerFormValues } | PartnerFormValues;
      const saved = isPartnerFormValues(json) ? json : json.data;
      if (!saved) {
        throw new Error("Respons seller tidak lengkap.");
      }
      toast.success(`Seller ${isUpdate ? "diupdate" : "dibuat"}`);
      onSubmitted?.(saved);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Gagal submit seller"));
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
        <Input label="Contact Name" value={v.contactName} onChange={e => setV(s => ({ ...s, contactName: e.target.value }))} />
        <Input label="Contact Phone" value={v.contactPhone} onChange={e => setV(s => ({ ...s, contactPhone: e.target.value }))} />
      </div>
      <Select
        label="Status"
        value={v.status}
        onChange={e => setV(s => ({ ...s, status: e.target.value as "ACTIVE" | "INACTIVE" }))}
        options={[
          { label: "ACTIVE", value: "ACTIVE" },
          { label: "INACTIVE", value: "INACTIVE" },
        ]}
      />

      <div className="pt-2">
        <Button type="submit" loading={loading}>
          {v.id ? "Simpan Perubahan" : "Buat Seller"}
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

function isPartnerFormValues(value: unknown): value is PartnerFormValues {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PartnerFormValues>;
  return typeof candidate.code === "string" && typeof candidate.name === "string" && typeof candidate.status === "string";
}
