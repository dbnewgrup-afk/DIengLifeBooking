import * as React from "react";
import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skel rounded-md", className)} />;
}
