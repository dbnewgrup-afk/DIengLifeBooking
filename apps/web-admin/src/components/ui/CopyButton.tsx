"use client";

import * as React from "react";
import { toast } from "./Toast";

export type CopyButtonProps = {
  value: string;
  className?: string;
  label?: React.ReactNode;
  copiedLabel?: React.ReactNode;
  ms?: number;
};

export default function CopyButton({
  value,
  className,
  label = "Copy",
  copiedLabel = "Copied",
  ms = 2000,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Tersalin ke clipboard");
      setTimeout(() => setCopied(false), ms);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={[
        "inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      title="Salin ke clipboard"
    >
      {copied ? (
        <>
          <span className="mr-1">✔️</span> {copiedLabel}
        </>
      ) : (
        <>
          <span className="mr-1">📋</span> {label}
        </>
      )}
    </button>
  );
}
