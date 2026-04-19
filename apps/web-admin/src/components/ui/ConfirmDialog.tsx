"use client";

import * as React from "react";
import Modal from "./Modal";
import Button from "./Button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /** Gaya berbahaya (merah) */
  danger?: boolean;
  /** Loading state saat confirm */
  confirming?: boolean;
  onConfirm?: () => void | Promise<void>;
};

export default function ConfirmDialog({
  open,
  onOpenChange,
  title = "Konfirmasi",
  description = "Tindakan ini tidak bisa dibatalkan.",
  confirmText = "Ya, lanjut",
  cancelText = "Batal",
  danger = true,
  confirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={confirming}>
            {cancelText}
          </Button>
          <Button
            variant={danger ? "primary" : "outline"}
            className={danger ? "bg-rose-600 border-rose-600 hover:opacity-95" : ""}
            onClick={async () => {
              if (!onConfirm) return onOpenChange(false);
              await Promise.resolve(onConfirm());
              onOpenChange(false);
            }}
            loading={confirming}
          >
            {confirmText}
          </Button>
        </div>
      }
    />
  );
}
