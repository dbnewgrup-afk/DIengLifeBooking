import * as React from "react";
import { cn } from "./cn";

type As = "label" | "div" | "span";

/** Polymorphic label: bisa jadi <label> / <div> / <span> sesuai kebutuhan */
type PolymorphicProps<A extends As> =
  Omit<React.ComponentPropsWithoutRef<A>, "as" | "className"> & {
    as?: A;
    className?: string;
  };

export function Label<A extends As = "label">({
  as,
  className,
  ...props
}: PolymorphicProps<A>) {
  const Comp = (as ?? "label") as React.ElementType;
  return <Comp className={cn("block text-sm text-[var(--text)]", className)} {...props} />;
}
