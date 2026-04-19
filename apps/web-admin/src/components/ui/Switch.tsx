"use client";

import * as React from "react";

export type SwitchProps = {
  checked?: boolean;                 // controlled
  defaultChecked?: boolean;          // uncontrolled
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  id?: string;
  className?: string;
};

export default function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  label,
  hint,
  id,
  className,
}: SwitchProps) {
  const inputId = id || React.useId();
  const [internal, setInternal] = React.useState<boolean>(!!defaultChecked);
  const isControlled = typeof checked === "boolean";
  const value = isControlled ? !!checked : internal;

  function toggle() {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  }

  return (
    <div className={["flex items-start gap-3", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-disabled={disabled || undefined}
        onClick={toggle}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors",
          disabled
            ? "border-slate-200 bg-slate-100 opacity-60"
            : value
            ? "border-slate-900 bg-slate-900"
            : "border-slate-200 bg-white hover:bg-slate-50",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none absolute top-0.5 inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
            value ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>

      {(label || hint) && (
        <div className="min-w-0">
          {label ? (
            <label
              htmlFor={inputId}
              className={["block text-sm font-medium", disabled ? "text-slate-400" : "text-slate-700"].join(" ")}
              onClick={e => {
                e.preventDefault();
                toggle();
              }}
            >
              {label}
            </label>
          ) : null}
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
      )}

      {/* input hidden untuk form compatibility */}
      <input
        id={inputId}
        type="checkbox"
        className="sr-only"
        checked={value}
        onChange={e => {
          const v = e.target.checked;
          if (!isControlled) setInternal(v);
          onCheckedChange?.(v);
        }}
        disabled={disabled}
      />
    </div>
  );
}
