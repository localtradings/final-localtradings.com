import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import { cn, formatPercent } from "@/lib/utils";

export type VisualTone = "backtest" | "learn" | "muted" | "negative" | "quiz";

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getToneStops(tone: VisualTone) {
  switch (tone) {
    case "learn":
      return ["#60a5fa", "#22d3ee"] as const;
    case "quiz":
      return ["#fbbf24", "#fb923c"] as const;
    case "backtest":
      return ["#34d399", "#22c55e"] as const;
    case "negative":
      return ["#fda4af", "#ef4444"] as const;
    case "muted":
    default:
      return ["rgba(203,213,225,0.72)", "rgba(148,163,184,0.92)"] as const;
  }
}

function getToneGradient(tone: VisualTone) {
  const [start, end] = getToneStops(tone);
  return `linear-gradient(90deg,${start},${end})`;
}

function getToneConic(tone: VisualTone, angle: number) {
  const [start, end] = getToneStops(tone);
  return `conic-gradient(${start} 0deg, ${end} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`;
}

export function ProgressBar({
  tone = "learn",
  value,
}: {
  tone?: VisualTone;
  value: number;
}) {
  const fillWidth = clampPercent(value);

  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
      <div
        className="h-full rounded-full"
        style={{ background: getToneGradient(tone), width: `${fillWidth}%` }}
      />
    </div>
  );
}

export function SegmentMeter({
  completed,
  tone = "learn",
  total,
}: {
  completed: number;
  tone?: VisualTone;
  total: number;
}) {
  const safeTotal = Math.max(1, total);

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: safeTotal }).map((_, index) => (
        <span
          className={cn(
            "h-1.5 flex-1 rounded-full",
            index < completed ? "" : "bg-[rgba(255,255,255,0.09)]",
          )}
          key={index}
          style={index < completed ? { background: getToneGradient(tone) } : undefined}
        />
      ))}
    </div>
  );
}

export function MiniGauge({
  detail,
  label,
  size = "default",
  tone = "learn",
  value,
}: {
  detail: string;
  label: string;
  size?: "compact" | "default";
  tone?: VisualTone;
  value: number;
}) {
  const safeValue = clampPercent(value);
  const angle = safeValue * 3.6;
  const compact = size === "compact";

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "relative shrink-0 rounded-full",
          compact ? "h-[82px] w-[82px] p-[8px]" : "h-[112px] w-[112px] p-[10px]",
        )}
        style={{ background: getToneConic(tone, angle) }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[rgba(9,10,13,0.98)]">
          <span
            className={cn(
              "font-heading font-extrabold tracking-tight text-foreground",
              compact ? "text-[1.15rem]" : "text-[1.7rem]",
            )}
          >
            {safeValue}%
          </span>
          <span
            className={cn(
              "mt-1 uppercase text-muted",
              compact ? "text-[8px] tracking-[0.24em]" : "text-[10px] tracking-[0.28em]",
            )}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="learn-tv-kicker">Progress</p>
        <p
          className={cn(
            compact
              ? "mt-1 text-[13px] font-semibold text-foreground"
              : "mt-1 text-[15px] font-semibold text-foreground sm:text-[16px]",
          )}
        >
          {detail}
        </p>
        <p
          className={cn(
            compact
              ? "mt-1.5 text-[10px] leading-5 text-muted sm:text-[11px]"
              : "mt-2 text-[11px] leading-5 text-muted sm:text-[12px]",
          )}
        >
          Progress updates use your current Learn activity only.
        </p>
      </div>
    </div>
  );
}

export function CompactRing({
  label,
  tone = "learn",
  value,
}: {
  label: string;
  tone?: VisualTone;
  value: number;
}) {
  const safeValue = clampPercent(value);
  const angle = safeValue * 3.6;

  return (
    <div
      className="relative h-[76px] w-[76px] shrink-0 rounded-full p-[7px]"
      style={{ background: getToneConic(tone, angle) }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[rgba(9,10,13,0.98)]">
        <span className="font-heading text-[1.1rem] font-extrabold tracking-tight text-foreground">
          {safeValue}%
        </span>
        <span className="mt-1 text-[8px] uppercase tracking-[0.22em] text-muted">{label}</span>
      </div>
    </div>
  );
}

export function MetricStripCell({
  detail,
  label,
  panelClassName,
  rail,
  valueToneClassName,
  value,
}: {
  detail: string;
  label: string;
  panelClassName?: string;
  rail: ReactNode;
  valueToneClassName?: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "border-b border-outline-variant/70 px-4 py-4 sm:px-5 xl:border-b-0 xl:border-r xl:last:border-r-0",
        panelClassName,
      )}
    >
      <p className="learn-tv-kicker">{label}</p>
      <p
        className={cn(
          "mt-2 font-heading text-[1.8rem] font-extrabold tracking-tight text-foreground sm:text-[2rem]",
          valueToneClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted sm:text-[12px]">{detail}</p>
      <div className="mt-3">{rail}</div>
    </div>
  );
}

export function QueueLine({
  detail,
  href,
  label,
  meta,
  title,
}: {
  detail: string;
  href: string;
  label: string;
  meta: string;
  title: string;
}) {
  return (
    <Link
      className="group grid gap-2 border-b border-outline-variant/70 px-4 py-3.5 transition hover:bg-surface-high/18 last:border-b-0"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="learn-tv-kicker">{label}</p>
          <p className="mt-1 break-words text-[14px] font-semibold text-foreground">{title}</p>
        </div>

        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-hover:text-foreground" />
      </div>

      <p className="max-w-[32rem] text-[11px] leading-5 text-muted sm:text-[12px]">{detail}</p>
      <p className="text-[11px] text-muted sm:text-[12px]">{meta}</p>
    </Link>
  );
}

export function ActionStatusCard({
  ctaHref,
  ctaLabel,
  detail,
  eyebrow,
  metric,
  secondary,
  title,
  value,
}: {
  ctaHref: string;
  ctaLabel: string;
  detail: string;
  eyebrow: string;
  metric: ReactNode;
  secondary: string;
  title: string;
  value: string;
}) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:px-5 sm:grid-cols-[84px_minmax(0,1fr)] sm:items-start">
      <div className="shrink-0">{metric}</div>

      <div className="min-w-0">
        <p className="learn-tv-kicker">{eyebrow}</p>
        <h3 className="mt-1 break-words text-[1.02rem] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[12px]">
          {value}
        </p>
        <p className="mt-2 max-w-[24rem] text-[11px] leading-5 text-muted sm:text-[12px]">
          {detail}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="max-w-[18rem] text-[11px] text-muted sm:text-[12px]">{secondary}</span>
          <Link className="btn-primary min-h-9 px-3.5 py-2 text-[11px] sm:px-4 sm:text-xs" href={ctaHref}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CoverageRow({
  detail,
  label,
  tone = "learn",
  value,
  valueLabel,
}: {
  detail: string;
  label: string;
  tone?: VisualTone;
  value: number;
  valueLabel: string;
}) {
  return (
    <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[rgba(255,255,255,0.015)] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-muted">{label}</p>
        <span className="text-[12px] font-semibold text-foreground">{valueLabel}</span>
      </div>
      <div className="mt-2">
        <ProgressBar tone={tone} value={value} />
      </div>
      <p className="mt-2 text-[11px] leading-5 text-muted sm:text-[12px]">{detail}</p>
    </div>
  );
}

export function RecommendedModuleRow({
  href,
  index,
  level,
  summary,
  title,
  topic,
}: {
  href: string;
  index: number;
  level: string;
  summary: string;
  title: string;
  topic: string;
}) {
  return (
    <Link
      className="group grid gap-2 border-b border-outline-variant/70 px-4 py-4 transition hover:bg-surface-high/18 last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:items-start sm:px-5"
      href={href}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/18 bg-primary/8 text-[12px] font-semibold text-primary/85">
        {String(index).padStart(2, "0")}
      </span>

      <div className="min-w-0">
        <p className="learn-tv-kicker">{topic}</p>
        <h3 className="mt-1 break-words text-[1rem] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="mt-2 max-w-[30rem] text-[11px] leading-5 text-muted sm:text-[12px]">
          {summary}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted sm:text-[12px]">{level}</span>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition group-hover:text-primary" />
      </div>
    </Link>
  );
}

export function getBacktestingStatusLabel(status: string) {
  const labels: Record<string, string> = {
    target_hit: "Target hit",
    stop_hit: "Stop hit",
    manual_close: "Manual close",
    breakeven: "Breakeven",
  };

  return labels[status] ?? "Completed";
}

export function getBacktestingActivityPercent(sessionCount: number) {
  return Math.min(100, sessionCount * 20);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatMoney(Math.abs(value))}`;
}

export { formatPercent };
