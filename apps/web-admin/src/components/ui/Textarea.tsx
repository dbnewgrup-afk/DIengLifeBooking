"use client";

import * as React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

const base =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300";
const ok = "border-slate-200";
const err = "border-rose-300 focus:ring-rose-200";

export default React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, containerClassName, id, rows = 4, ...rest },
  ref
) {
  const taId = id || React.useId();
  const describedBy: string[] = [];
  if (hint) describedBy.push(`${taId}-hint`);
  if (error) describedBy.push(`${taId}-error`);

  return (
    <div className={["space-y-1.5", containerClassName].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={taId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={taId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy.join(" ") || undefined}
        className={[base, error ? err : ok, "resize-y", className].filter(Boolean).join(" ")}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${taId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${taId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
