"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function LearnDetailHeader({
  action,
  backHref,
  backLabel,
  kicker,
  statusLabel,
  summary,
  title,
  trailItems,
  children,
}: {
  action?: ReactNode;
  backHref: string;
  backLabel: string;
  kicker: string;
  statusLabel?: string | null;
  summary: string;
  title: string;
  trailItems: string[];
  children: ReactNode;
}) {
  return (
    <div className="border-b border-outline-variant/70 px-3.5 py-3.5 sm:px-5 sm:py-5">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted sm:gap-3 sm:text-sm">
        <Link
          className="inline-flex items-center gap-2 font-semibold text-foreground transition hover:text-primary"
          href={backHref}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          {backLabel}
        </Link>

        {trailItems.map((item) => (
          <div className="contents" key={item}>
            <span className="text-outline">/</span>
            <span>{item}</span>
          </div>
        ))}

        {statusLabel ? (
          <>
            <span className="text-outline">/</span>
            <span
              className={cn(
                statusLabel === "Completed"
                  ? "learn-tv-positive"
                  : statusLabel === "In Progress"
                    ? "text-primary"
                    : "text-muted",
              )}
            >
              {statusLabel}
            </span>
          </>
        ) : null}
      </div>

      <div className="mt-3.5 sm:mt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 sm:space-y-2.5">
            <p className="learn-tv-kicker">{kicker}</p>
            <h1 className="break-words font-heading text-[1.35rem] font-extrabold leading-[1.06] tracking-tight text-foreground sm:text-[2.15rem]">
              {title}
            </h1>
            <p className="max-w-[38rem] text-[12px] leading-5 text-[#b3b7c2] sm:text-[13px] sm:leading-6">
              {summary}
            </p>
          </div>

          {action ? <div className="flex shrink-0 items-center">{action}</div> : null}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
