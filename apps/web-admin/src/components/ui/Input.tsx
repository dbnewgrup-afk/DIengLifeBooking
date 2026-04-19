"use client";

import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
};

const inputBase =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300";
const inputOk = "border-slate-200";
const inputErr = "border-rose-300 focus:ring-rose-200";

export default React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, containerClassName, id, ...rest },
  ref
) {
  const inputId = id || React.useId();
  const describedBy: string[] = [];
  if (hint) describedBy.push(`${inputId}-hint`);
  if (error) describedBy.push(`${inputId}-error`);

  return (
    <div className={["space-y-1.5", containerClassName].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy.join(" ") || undefined}
        className={[inputBase, error ? inputErr : inputOk, className].filter(Boolean).join(" ")}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
