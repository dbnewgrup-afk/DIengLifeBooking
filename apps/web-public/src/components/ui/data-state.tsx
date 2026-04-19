import * as React from "react";
import { Card, CardDescription, CardTitle } from "./card";
import { cn } from "./cn";

type DataStateTone = "neutral" | "error" | "empty";

const toneClassName: Record<DataStateTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-900",
  error: "border-rose-200 bg-rose-50 text-rose-950",
  empty: "border-amber-200 bg-amber-50 text-amber-950",
};

export function DataState({
  title,
  description,
  tone = "neutral",
  className,
  children,
}: {
  title: string;
  description: string;
  tone?: DataStateTone;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn("space-y-3 rounded-3xl border p-5 shadow-none", toneClassName[tone], className)}>
      <div className="space-y-1">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription
          className={cn(
            "text-sm leading-6",
            tone === "error"
              ? "text-rose-800"
              : tone === "empty"
                ? "text-amber-800"
                : "text-slate-600"
          )}
        >
          {description}
        </CardDescription>
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </Card>
  );
}
