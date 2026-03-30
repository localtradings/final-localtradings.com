import Link from "next/link";
import { BarChart3 } from "lucide-react";

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
      className={cn("inline-flex items-center gap-2.5 text-white", className)}
      href={href}
    >
      {compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-heading text-[0.93rem] font-extrabold tracking-[-0.03em] text-foreground">
            localtradings.com
          </span>
          <span className="mt-[0.22rem] text-[9px] uppercase tracking-[0.19em] text-muted">
            Trading workspace
          </span>
        </span>
      ) : (
        <>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-xl)] border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-black/20">
            <BarChart3 className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-[1.05rem] font-extrabold tracking-tight text-foreground">
              localtradings.com
            </span>
            <span className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
              Learn before risking money
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
