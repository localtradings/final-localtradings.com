import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Gauge, LineChart } from "lucide-react";

import { formatPercent } from "@/lib/utils";
import { requireUser } from "@/server/auth/session";
import { getDashboardHomeData } from "@/server/dashboard/queries";

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatSignedMoney(value: number) {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatMoney(Math.abs(value))}`;
}

function getBacktestingStatusLabel(status: string) {
  const labels: Record<string, string> = {
    target_hit: "Target hit",
    stop_hit: "Stop hit",
    manual_close: "Manual close",
    breakeven: "Breakeven",
  };

  return labels[status] ?? "Completed";
}

function getBacktestingActivityPercent(sessionCount: number) {
  return Math.min(100, sessionCount * 20);
}

type VisualTone = "backtest" | "learn" | "muted" | "negative" | "quiz";

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

  switch (tone) {
    default:
      return `conic-gradient(${start} 0deg, ${end} ${angle}deg, rgba(255,255,255,0.08) ${angle}deg 360deg)`;
  }
}

function ProgressBar({
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

function SegmentMeter({
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
          className={[
            "h-1.5 flex-1 rounded-full",
            index < completed ? "" : "bg-[rgba(255,255,255,0.09)]",
          ].join(" ")}
          key={index}
          style={index < completed ? { background: getToneGradient(tone) } : undefined}
        />
      ))}
    </div>
  );
}

function MiniGauge({
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
        className={[
          "relative shrink-0 rounded-full",
          compact ? "h-[82px] w-[82px] p-[8px]" : "h-[112px] w-[112px] p-[10px]",
        ].join(" ")}
        style={{
          background: getToneConic(tone, angle),
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[rgba(9,10,13,0.98)]">
          <span
            className={[
              "font-heading font-extrabold tracking-tight text-foreground",
              compact ? "text-[1.15rem]" : "text-[1.7rem]",
            ].join(" ")}
          >
            {safeValue}%
          </span>
          <span
            className={[
              "mt-1 uppercase text-muted",
              compact ? "text-[8px] tracking-[0.24em]" : "text-[10px] tracking-[0.28em]",
            ].join(" ")}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="min-w-0">
        <p className="learn-tv-kicker">Progress</p>
        <p className={compact ? "mt-1 text-[13px] font-semibold text-foreground" : "mt-1 text-[15px] font-semibold text-foreground sm:text-[16px]"}>
          {detail}
        </p>
        <p className={compact ? "mt-1.5 text-[10px] leading-5 text-muted sm:text-[11px]" : "mt-2 text-[11px] leading-5 text-muted sm:text-[12px]"}>
          Progress updates use your current Learn activity only.
        </p>
      </div>
    </div>
  );
}

function CompactRing({
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
      style={{
        background: getToneConic(tone, angle),
      }}
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

function MetricStripCell({
  detail,
  label,
  panelClassName,
  rail,
  valueToneClassName,
  valueClassName,
  value,
}: {
  detail: string;
  label: string;
  panelClassName?: string;
  rail: ReactNode;
  valueToneClassName?: string;
  valueClassName?: string;
  value: string;
}) {
  return (
    <div
      className={[
        "border-b border-outline-variant/70 px-4 py-4 sm:px-5 xl:border-b-0 xl:border-r xl:last:border-r-0",
        panelClassName ?? "",
      ].join(" ")}
    >
      <p className="learn-tv-kicker">{label}</p>
      <p
        className={[
          "mt-2 font-heading text-[1.8rem] font-extrabold tracking-tight text-foreground sm:text-[2rem]",
          valueToneClassName ?? "",
          valueClassName ?? "",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted sm:text-[12px]">{detail}</p>
      <div className="mt-3">{rail}</div>
    </div>
  );
}

function QueueLine({
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

function ActionStatusCard({
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
  metric: React.ReactNode;
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

function CoverageRow({
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

function RecommendedModuleRow({
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

export async function DashboardHome() {
  const user = await requireUser();
  const dashboard = await getDashboardHomeData(user.id);

  const overviewName = dashboard.displayName ?? "Workspace";
  const nextModule = dashboard.recommendedModules[0] ?? null;
  const secondModule = dashboard.recommendedModules[1] ?? null;
  const completedSession = dashboard.backtestingSummary.latestSession;
  const quizAverageValue =
    dashboard.quizSummary.averageScorePercent === null
      ? "No data"
      : formatPercent(dashboard.quizSummary.averageScorePercent);
  const quizAverageDetail =
    dashboard.quizSummary.attemptCount > 0
      ? `${dashboard.quizSummary.attemptCount} saved attempt${dashboard.quizSummary.attemptCount === 1 ? "" : "s"}`
      : "No quiz attempts yet";
  const quizGaugeValue = dashboard.quizSummary.averageScorePercent ?? 0;
  const learnCompletionValue = clampPercent(dashboard.learningSummary.completionPercent);
  const moduleCompletionValue = clampPercent(dashboard.learningSummary.moduleCompletionPercent);
  const backtestActivityValue = getBacktestingActivityPercent(
    dashboard.backtestingSummary.sessionCount,
  );

  return (
    <div className="learn-tradingview">
      <div className="learn-tv-screen learn-tv-screen--flat space-y-3.5 pb-5 sm:space-y-4 sm:pb-7">
        <section className="learn-tv-frame overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_12%,transparent)_0%,transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_28%),linear-gradient(180deg,rgba(16,18,22,0.99),rgba(10,11,14,1))]">
          <div className="border-b border-outline-variant/70 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <p className="learn-tv-kicker">Dashboard</p>
                <h1 className="mt-2 max-w-[10ch] font-heading text-[2.25rem] font-extrabold tracking-tight text-foreground sm:text-[3rem] sm:leading-[0.94]">
                  Workspace dashboard
                </h1>
                <p className="mt-2 max-w-[35rem] text-[13px] leading-6 text-muted sm:text-[14px]">
                  {overviewName} • Learn, quiz, and backtesting status in one operating view.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="learn-tv-chip learn-tv-chip--active">
                  {dashboard.learningSummary.moduleTitle}
                </span>
                <span className="learn-tv-chip">
                  {dashboard.learningSummary.lessonTitle ?? dashboard.learningSummary.progressLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-4">
            <MetricStripCell
              detail={`${formatPercent(dashboard.learningSummary.completionPercent)} of the lesson library`}
              label="Lessons complete"
              panelClassName="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_82%)]"
              rail={<ProgressBar tone="learn" value={dashboard.learningSummary.completionPercent} />}
              valueToneClassName="text-sky-300"
              value={`${dashboard.learningSummary.completedLessons}`}
            />
            <MetricStripCell
              detail={quizAverageDetail}
              label="Average quiz score"
              panelClassName="bg-[linear-gradient(180deg,rgba(251,191,36,0.08),transparent_82%)]"
              rail={<ProgressBar tone="quiz" value={quizGaugeValue} />}
              valueToneClassName="text-amber-300"
              value={quizAverageValue}
            />
            <MetricStripCell
              detail={`${formatSignedMoney(dashboard.backtestingSummary.balanceDelta)} vs starting balance`}
              label="Backtest balance"
              panelClassName="bg-[linear-gradient(180deg,rgba(52,211,153,0.08),transparent_82%)]"
              rail={<ProgressBar tone={dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"} value={backtestActivityValue} />}
              valueToneClassName={
                dashboard.backtestingSummary.balanceDelta < 0 ? "text-rose-300" : "text-emerald-300"
              }
              value={formatMoney(dashboard.backtestingSummary.currentBalance)}
            />
            <MetricStripCell
              detail={`${dashboard.learningSummary.moduleDuration} • ${dashboard.learningSummary.progressLabel}`}
              label="Active module"
              panelClassName="bg-[linear-gradient(180deg,rgba(96,165,250,0.08),transparent_78%)]"
              rail={
                <SegmentMeter
                  completed={dashboard.learningSummary.moduleCompletedLessons}
                  tone="learn"
                  total={dashboard.learningSummary.moduleTotalLessons}
                />
              }
              valueToneClassName="text-cyan-300"
              value={dashboard.learningSummary.moduleTitle}
            />
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.34fr)_minmax(18rem,0.66fr)] xl:items-start">
          <section className="learn-tv-panel overflow-hidden rounded-[1rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_40%),linear-gradient(180deg,rgba(18,25,34,0.98),rgba(11,16,22,0.98))]">
            <div className="border-b border-outline-variant/70 px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="learn-tv-kicker">Continue learning</p>
                  <h2 className="mt-2 break-words font-heading text-[1.5rem] font-extrabold tracking-tight text-[color-mix(in_srgb,var(--primary)_68%,white_32%)] sm:text-[1.72rem]">
                    {dashboard.learningSummary.moduleTitle}
                  </h2>
                  <p className="mt-2 max-w-[36rem] text-[12px] leading-6 text-muted sm:text-[13px]">
                    {dashboard.learningSummary.lessonTitle
                      ? `${dashboard.learningSummary.lessonTitle}. ${dashboard.learningSummary.progressDetail}`
                      : dashboard.learningSummary.progressDetail}
                  </p>
                </div>

                <div className="hidden shrink-0 xl:block">
                  <MiniGauge
                    detail={`${dashboard.learningSummary.moduleCompletedLessons} of ${dashboard.learningSummary.moduleTotalLessons} module lessons complete`}
                    label="Module"
                    tone="learn"
                    value={moduleCompletionValue}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[minmax(0,1.04fr)_minmax(18rem,0.96fr)]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),rgba(255,255,255,0.02))] px-3.5 py-3">
                    <p className="learn-tv-kicker">Current lesson</p>
                    <p className="mt-1 break-words text-[14px] font-semibold text-foreground">
                      {dashboard.learningSummary.lessonTitle ?? dashboard.learningSummary.moduleTitle}
                    </p>
                  </div>
                  <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[rgba(255,255,255,0.018)] px-3.5 py-3">
                    <p className="learn-tv-kicker">Topic</p>
                    <p className="mt-1 break-words text-[14px] font-semibold text-foreground">
                      {dashboard.learningSummary.moduleTopic}
                    </p>
                  </div>
                  <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[rgba(255,255,255,0.018)] px-3.5 py-3">
                    <p className="learn-tv-kicker">Duration</p>
                    <p className="mt-1 break-words text-[14px] font-semibold text-foreground">
                      {dashboard.learningSummary.moduleDuration}
                    </p>
                  </div>
                </div>

                <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_7%,transparent),rgba(255,255,255,0.01))] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="learn-tv-kicker">Module progress</p>
                      <p className="mt-1 text-[15px] font-semibold text-foreground sm:text-[16px]">
                        {dashboard.learningSummary.progressLabel}
                      </p>
                    </div>
                    <Link
                      className="btn-primary min-h-10 px-4 py-2.5 text-[11px] sm:text-xs"
                      href={dashboard.learningSummary.ctaHref}
                    >
                      {dashboard.learningSummary.ctaLabel}
                    </Link>
                  </div>

                  <div className="mt-4">
                    <ProgressBar tone="learn" value={moduleCompletionValue} />
                  </div>

                  <div className="mt-3">
                    <SegmentMeter
                      completed={dashboard.learningSummary.moduleCompletedLessons}
                      tone="learn"
                      total={dashboard.learningSummary.moduleTotalLessons}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-[0.98rem] border border-outline-variant/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.012))]">
                <div className="border-b border-outline-variant/70 px-4 py-3">
                  <p className="learn-tv-kicker">Queue</p>
                  <p className="mt-1 text-[15px] font-semibold text-foreground sm:text-[16px]">
                    Current and next study moves
                  </p>
                </div>

                <QueueLine
                  detail={dashboard.learningSummary.progressDetail}
                  href={dashboard.learningSummary.ctaHref}
                  label="Active module"
                  meta={`${dashboard.learningSummary.moduleTopic} • ${dashboard.learningSummary.moduleDuration} • ${dashboard.learningSummary.progressLabel}`}
                  title={dashboard.learningSummary.moduleTitle}
                />

                {nextModule ? (
                  <QueueLine
                    detail={nextModule.description}
                    href={`/app/learn/${nextModule.slug}`}
                    label="Next module"
                    meta={`${nextModule.topic} • ${nextModule.duration} • ${nextModule.level}`}
                    title={nextModule.title}
                  />
                ) : null}

                {secondModule ? (
                  <QueueLine
                    detail={secondModule.description}
                    href={`/app/learn/${secondModule.slug}`}
                    label="After that"
                    meta={`${secondModule.topic} • ${secondModule.duration} • ${secondModule.level}`}
                    title={secondModule.title}
                  />
                ) : null}
              </div>
            </div>
          </section>

          <section className="learn-tv-panel overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,rgba(18,25,34,0.95),rgba(11,16,22,0.98))]">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/70 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="learn-tv-kicker">Workspace actions</p>
                <h2 className="mt-2 font-heading text-[1.2rem] font-extrabold tracking-tight text-foreground sm:text-[1.3rem]">
                  Quiz and backtesting
                </h2>
              </div>
              <div className="mt-0.5 shrink-0 text-muted">
                <ArrowUpRight className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
            </div>

            <div className="divide-y divide-outline-variant/70">
              <ActionStatusCard
                ctaHref={dashboard.quizSummary.ctaHref}
                ctaLabel={dashboard.quizSummary.ctaLabel}
                detail={
                  dashboard.quizSummary.averageScorePercent === null
                    ? "Start the first quiz check and begin building a score history."
                    : `Average score across saved attempts. Latest quiz: ${dashboard.quizSummary.latestQuizTitle ?? dashboard.quizSummary.recommendedQuiz.title}.`
                }
                eyebrow="Quiz"
                metric={
                  <CompactRing label="Score" tone="quiz" value={quizGaugeValue} />
                }
                secondary={dashboard.quizSummary.recommendedQuiz.title}
                title="Take the next quiz"
                value={quizAverageValue}
              />

              <ActionStatusCard
                ctaHref={dashboard.backtestingSummary.ctaHref}
                ctaLabel={dashboard.backtestingSummary.ctaLabel}
                detail={
                  completedSession
                    ? `${getBacktestingStatusLabel(completedSession.status)} on ${completedSession.symbol}. Current account balance tracks from your starting paper balance.`
                    : "Open the paper-trading workspace and log the first completed session."
                }
                eyebrow="Backtesting"
                metric={
                  <CompactRing
                    label="Activity"
                    tone={dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"}
                    value={backtestActivityValue}
                  />
                }
                secondary={`${formatSignedMoney(dashboard.backtestingSummary.balanceDelta)} vs start`}
                title="Paper-trading workspace"
                value={formatMoney(dashboard.backtestingSummary.currentBalance)}
              />
            </div>
          </section>
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-start">
          <section className="learn-tv-panel overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,rgba(18,25,34,0.95),rgba(11,16,22,0.98))]">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant/70 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="learn-tv-kicker">Coverage board</p>
                <h2 className="mt-2 font-heading text-[1.22rem] font-extrabold tracking-tight text-foreground sm:text-[1.34rem]">
                  Progress and activity
                </h2>
              </div>
              <div className="mt-0.5 shrink-0 text-muted">
                <Gauge className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </div>
            </div>

            <div className="grid gap-4 px-4 py-4 sm:px-5 xl:grid-cols-[14rem_minmax(0,1fr)] xl:items-start">
              <div className="rounded-[0.95rem] border border-outline-variant/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_8%,transparent),rgba(255,255,255,0.015))] px-4 py-4">
                <div className="flex justify-center">
                  <CompactRing label="Learn" tone="learn" value={learnCompletionValue} />
                </div>
                <p className="mt-4 learn-tv-kicker text-center">Progress</p>
                <p className="mt-1 text-center text-[14px] font-semibold text-foreground sm:text-[15px]">
                  {dashboard.learningSummary.completedLessons} lessons finished
                </p>
                <p className="mt-2 text-center text-[11px] leading-5 text-muted sm:text-[12px]">
                  Current library completion based on finished lessons only.
                </p>
              </div>

              <div className="grid gap-3 min-w-0">
                <CoverageRow
                  detail={`${dashboard.learningSummary.moduleTitle} is the active module.`}
                  label="Learn coverage"
                  value={dashboard.learningSummary.completionPercent}
                  valueLabel={formatPercent(dashboard.learningSummary.completionPercent)}
                />
                <CoverageRow
                  detail={
                    dashboard.quizSummary.attemptCount > 0
                      ? `${dashboard.quizSummary.attemptCount} quiz attempt${dashboard.quizSummary.attemptCount === 1 ? "" : "s"} saved so far.`
                      : "No saved quiz attempts yet."
                  }
                  label="Quiz readiness"
                  value={quizGaugeValue}
                  valueLabel={quizAverageValue}
                />
                <CoverageRow
                  detail={`${dashboard.backtestingSummary.sessionCount} completed session${dashboard.backtestingSummary.sessionCount === 1 ? "" : "s"} tracked.`}
                  label="Backtest activity"
                  tone={dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"}
                  value={backtestActivityValue}
                  valueLabel={`${dashboard.backtestingSummary.sessionCount}`}
                />
              </div>
            </div>
          </section>

          <section className="learn-tv-panel overflow-hidden rounded-[1rem] bg-[linear-gradient(180deg,rgba(18,25,34,0.94),rgba(11,16,22,0.98))]">
            <div className="flex items-end justify-between gap-3 border-b border-outline-variant/70 px-4 py-4 sm:px-5">
              <div>
                <p className="learn-tv-kicker">Recommended modules</p>
                <h2 className="mt-2 font-heading text-[1.22rem] font-extrabold tracking-tight text-foreground sm:text-[1.34rem]">
                  Next study moves
                </h2>
              </div>
              <Link className="text-xs font-semibold text-primary sm:text-sm" href="/app/learn">
                View all
              </Link>
            </div>

            <div className="grid gap-0">
              {dashboard.recommendedModules.map((module, index) => (
                <RecommendedModuleRow
                  href={`/app/learn/${module.slug}`}
                  index={index + 1}
                  key={module.slug}
                  level={`${module.duration} • ${module.level}`}
                  summary={module.description}
                  title={module.title}
                  topic={module.topic}
                />
              ))}
            </div>

            <div className="border-t border-outline-variant/70 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/70 bg-[rgba(255,255,255,0.02)] text-muted">
                  <LineChart className="h-4.5 w-4.5" strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <p className="learn-tv-kicker">Module board</p>
                  <p className="mt-1 text-[13px] leading-5 text-muted sm:text-[14px]">
                    Keep the queue tight: finish the active module, then move into the next recommendation.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
