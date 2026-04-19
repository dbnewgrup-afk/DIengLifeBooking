"use client";

import * as React from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed";
const variants: Record<Variant, string> = {
  primary:
    "bg-slate-900 text-white hover:opacity-95 disabled:opacity-60 border border-slate-900",
  outline:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 disabled:opacity-60",
  ghost:
    "bg-transparent text-slate-900 hover:bg-slate-50 border border-transparent disabled:opacity-60",
};
const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
  lg: "text-base px-5 py-2.5 gap-2.5",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[base, variants[variant], sizes[size], className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Spinner />
      ) : leftIcon ? (
        <span className="grid h-4 w-4 place-items-center">{leftIcon}</span>
      ) : null}
      <span className="whitespace-nowrap">{children}</span>
      {rightIcon ? <span className="grid h-4 w-4 place-items-center">{rightIcon}</span> : null}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="mr-1 h-4 w-4 animate-spin text-current"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-100"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
