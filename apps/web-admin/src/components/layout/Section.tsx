import type { HTMLAttributes, ReactNode } from "react";

type ElementTag = "section" | "div" | "article";

export type SectionProps = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  as?: ElementTag;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** @deprecated gunakan `subtitle` */
  description?: ReactNode;
  right?: ReactNode;
  /** @deprecated gunakan `right` */
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  noHeaderBorder?: boolean;
  /** Kontrol padding seragam header+body */
  padding?: "sm" | "md" | "lg";
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function Section({
  as = "section",
  title,
  subtitle,
  description,
  right,
  action,
  children,
  className,
  noHeaderBorder,
  padding = "md",
  ...rest
}: SectionProps) {
  const Tag = as;
  const headerSubtitle = subtitle ?? description;
  const headerRight = right ?? action;
  const hasHeader = Boolean(title || headerSubtitle || headerRight);

  const pad = {
    sm: "px-3 py-3 sm:px-4",
    md: "px-4 py-4 sm:px-6",
    lg: "px-6 py-6 sm:px-8",
  }[padding];

  return (
    <Tag
      className={cx(
        "mb-6 rounded-2xl border shadow-sm",
        // Panel semi-transparan agar gradasi global terlihat
        "bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85",
        // Dark memakai token yang ada
        "dark:bg-[color:var(--panel)]/92",
        "border-[color:var(--line,#e6ecf7)]",
        className
      )}
      {...rest}
    >
      {hasHeader && (
        <div
          className={cx(
            "flex items-start gap-3",
            pad,
            !noHeaderBorder && "border-b border-[color:var(--line,#e6ecf7)]/80"
          )}
        >
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="truncate text-base font-semibold text-[color:var(--text,#0f172a)]">
                {title}
              </h2>
            ) : null}
            {headerSubtitle ? (
              <p className="mt-0.5 text-sm text-[color:var(--text-muted,#475569)]">
                {headerSubtitle}
              </p>
            ) : null}
          </div>
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
        </div>
      )}
      <div className={pad}>{children}</div>
    </Tag>
  );
}
