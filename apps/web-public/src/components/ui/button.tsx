"use client";
import * as React from "react";
import { cn } from "./cn";

type Variant = "brand" | "ghost" | "outline" | "search";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantCls: Record<Variant, string> = {
  brand: "btn btn-brand",
  ghost: "btn btn-ghost",
  outline: "btn border border-[var(--line)] bg-white",
  search: "btn btn-search",
};

const sizeCls: Record<Size, string> = {
  sm: "text-xs px-3 py-2",
  md: "",
  lg: "text-base px-5 py-3",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "brand", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(variantCls[variant], sizeCls[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
