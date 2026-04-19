"use client";

import * as React from "react";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

export type ApprovalActionsProps = {
  id: string;
  apiBase?: string;
  getToken?: () => string | null;
  onChanged?: () => void;
};

export default function ApprovalActions({
  id,
  apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "",
  getToken = defaultGetToken,
  onChanged,
}: ApprovalActionsProps) {
  const [busy, setBusy] = React.useState<string | null>(null);

  async function act(path: "approve" | "reject") {
    setBusy(path);
    try {
      const res = await fetch(`${apiBase}/approvals/close-open/${encodeURIComponent(id)}/${path}`, {
        method: "POST",
        headers: { Authorization: withBearer(getToken()) },
      });
      if (!res.ok) throw new Error(`${path} gagal: ${res.status}`);
      toast.success(`Request ${path}`);
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Gagal memproses");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => act("reject")}
        loading={busy === "reject"}
        className="text-rose-700"
      >
        Reject
      </Button>
      <Button
        size="sm"
        onClick={() => act("approve")}
        loading={busy === "approve"}
        className="bg-emerald-600 border-emerald-600 hover:opacity-95"
      >
        Approve
      </Button>
    </div>
  );
}

function defaultGetToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_session") || sessionStorage.getItem("admin_session");
}
function withBearer(token: string | null) {
  return token ? `Bearer ${token}` : "";
}
