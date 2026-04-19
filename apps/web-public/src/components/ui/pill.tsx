"use client";
import * as React from "react";
import { cn } from "./cn";

export type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function Pill({ className, active, ...props }: PillProps) {
  return (
    <button
      className={cn("pill", active && "is-active", className)}
      aria-pressed={active}
      {...props}
    />
  );
}
