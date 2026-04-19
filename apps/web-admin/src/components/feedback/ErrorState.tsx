"use client";

import * as React from "react";
import Button from "../ui/Button";

export type ErrorStateProps = {
  title?: string;
  desc?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
};

export default function ErrorState({
  title = "Terjadi kesalahan",
  desc = "Silakan coba lagi beberapa saat.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={[
        "grid place-items-center rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900",
        className || "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="alert"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-2xl">❌</div>
        <div className="text-base font-semibold">{title}</div>
        <p className="max-w-md text-sm opacity-90">{desc}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        ) : null}
      </div>
    </div>
  );
}
