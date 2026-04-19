"use client";

import * as React from "react";

export type FormFieldProps = {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
};

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const descIds: string[] = [];
  if (hint) descIds.push(`${htmlFor}-hint`);
  if (error) descIds.push(`${htmlFor}-error`);

  return (
    <div className={["space-y-1.5", className || ""].join(" ")}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-slate-700"
        >
          {label} {required ? <span className="text-rose-600">*</span> : null}
        </label>
      ) : null}

      {/* Field slot */}
      <div
        aria-describedby={descIds.join(" ") || undefined}
        aria-invalid={!!error || undefined}
      >
        {children}
      </div>

      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
