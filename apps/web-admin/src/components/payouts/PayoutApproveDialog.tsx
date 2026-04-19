"use client";

import * as React from "react";
import ConfirmDialog from "../ui/ConfirmDialog";
import { toast } from "../ui/Toast";

export type PayoutApproveDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  batchId: string | null;
  apiBase?: string;
  getToken?: () => string | null;
  onApproved?: () => void;
};

export default function PayoutApproveDialog({
  open,
  onOpenChange,
  batchId,
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  onApproved,
}: PayoutApproveDialogProps) {
  const [loading, setLoading] = React.useState(false);

  async function onConfirm() {
    if (!batchId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/payouts/batches/${encodeURIComponent(batchId)}/approve`, {
        method: "POST",
        headers: { Authorization: withBearer(getToken()) },
      });
      if (!res.ok) throw new Error(`Approve batch gagal: ${res.status}`);
      toast.success("Batch approved, IRIS dipanggil");
      onApproved?.();
    } catch (e: any) {
      toast.error(e?.message || "Gagal approve batch");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Approve Payout Batch?"
      description="Batch akan dikirim ke IRIS untuk diproses. Tindakan ini akan menulis AuditLog."
      confirmText="Approve"
      confirming={loading}
      onConfirm={onConfirm}
      danger={false}
    />
  );
}

function defaultGetToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_session") || sessionStorage.getItem("admin_session");
}
function withBearer(token: string | null) {
  return token ? `Bearer ${token}` : "";
}
