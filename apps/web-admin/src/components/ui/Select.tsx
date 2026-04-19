"use client";

import * as React from "react";

export type Option = { label: string; value: string; disabled?: boolean };

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  options: Option[];
  placeholder?: string;
  containerClassName?: string;
};

const base =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";
const ok = "border-slate-200";
const err = "border-rose-300 focus:ring-rose-200";

export default React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, containerClassName, id, ...rest },
  ref
) {
  const selectId = id || React.useId();
  const describedBy: string[] = [];
  if (hint) describedBy.push(`${selectId}-hint`);
  if (error) describedBy.push(`${selectId}-error`);

  return (
    <div className={["space-y-1.5", containerClassName].filter(Boolean).join(" ")}>
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={describedBy.join(" ") || undefined}
        className={[base, error ? err : ok, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {placeholder ? (
          <option value="" disabled={!!rest.required} hidden={!!rest.required}>
            {placeholder}
          </option>
        ) : null}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error ? (
        <p id={`${selectId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
});
