"use client";

import * as React from "react";

export type DatePickerProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

const base =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";
const ok = "border-slate-200";
const err = "border-rose-300 focus:ring-rose-200";

export default React.forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, error, hint, className, containerClassName, id, ...rest },
  ref
) {
  const dpId = id || React.useId();
  const describedBy: string[] = [];
  if (hint) describedBy.push(`${dpId}-hint`);
  if (error) describedBy.push(`${dpId}-error`);

  return (
    <div className={["space-y-1.5", containerClassName].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={dpId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={dpId}
        ref={ref}
        type="date"
        aria-invalid={!!error}
        aria-describedby={describedBy.join(" ") || undefined}
        className={[base, error ? err : ok, className].filter(Boolean).join(" ")}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${dpId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${dpId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
