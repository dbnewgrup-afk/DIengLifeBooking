import * as React from "react";
import { cn } from "./cn";

export function SectionHeader({
  title,
  action,
  className,
  titleId,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
      {action ? <div className="text-sm text-[var(--muted)]">{action}</div> : null}
    </div>
  );
}
