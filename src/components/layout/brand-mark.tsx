import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export function BrandMark({
  href = "/",
  className,
  compact = false,
}: BrandMarkProps) {
  return (
    <Link
      className={cn("inline-flex items-center gap-3 text-foreground", className)}
      href={href}
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-xl)] border border-primary/20 bg-primary/10 text-primary">
        <span className="material-symbols-outlined text-[1.15rem]">
          candlestick_chart
        </span>
      </span>
      <span className="flex flex-col">
        <span className="font-heading text-sm font-extrabold uppercase tracking-[0.28em] text-primary">
          localtradings.com
        </span>
        {!compact ? (
          <span className="text-xs text-muted">
            Learn, quiz, and backtest with clarity.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
