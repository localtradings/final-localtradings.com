import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BattleShell({
  eyebrow,
  title,
  description,
  aside,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("learn-tradingview", className)}>
      <section className="learn-tv-screen learn-tv-screen--flat space-y-4">
        <div className="learn-tv-frame relative overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_34%),linear-gradient(180deg,rgba(16,18,22,0.99),rgba(10,11,14,1))]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/6" />
          <div className="pointer-events-none absolute inset-y-0 left-[min(38vw,26rem)] w-px bg-white/[0.04]" />
          <div className="pointer-events-none absolute inset-x-0 top-[7.75rem] h-px bg-white/[0.04]" />

          <div className="relative flex flex-col gap-8 px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-[46rem]">
              <p className="learn-tv-kicker text-[0.68rem] tracking-[0.24em]">
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-[14ch] font-heading text-[2.4rem] font-extrabold tracking-[-0.04em] text-white sm:text-[3rem] lg:text-[3.55rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-[38rem] text-sm leading-6 text-muted sm:text-[15px]">
                {description}
              </p>
            </div>
            {aside ? (
              <div className="shrink-0 self-start lg:self-end">
                {aside}
              </div>
            ) : null}
          </div>

          <div className="relative">
            {children}
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
