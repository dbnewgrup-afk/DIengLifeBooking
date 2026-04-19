import * as React from "react";
import { cn } from "./cn";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return <span className={cn("badge", className)} {...props} />;
}
