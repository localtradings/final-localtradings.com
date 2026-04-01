import Link from "next/link";
import { ArrowUpRight, Gauge, LineChart } from "lucide-react";

import { buildDashboardHomeViewModel } from "@/features/learn/dashboard-home-view-model";
import {
  ActionStatusCard,
  CompactRing,
  CoverageRow,
  formatMoney,
  formatPercent,
  getBacktestingStatusLabel,
  MetricStripCell,
  MiniGauge,
  ProgressBar,
  QueueLine,
  RecommendedModuleRow,
  SegmentMeter,
} from "@/features/learn/dashboard-home-ui";
import { requireUser } from "@/server/auth/session";
import { getDashboardHomeData } from "@/server/dashboard/queries";

export async function DashboardHome() {
  const user = await requireUser();
  const dashboard = await getDashboardHomeData(user.id);
  const view = buildDashboardHomeViewModel(dashboard);

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
                  {view.overviewName} • Learn, quiz, and backtesting status in one operating view.
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
              value={`${dashboard.learningSummary.completedLessons}`}
              valueToneClassName="text-sky-300"
            />
            <MetricStripCell
              detail={view.quizAverageDetail}
              label="Average quiz score"
              panelClassName="bg-[linear-gradient(180deg,rgba(251,191,36,0.08),transparent_82%)]"
              rail={<ProgressBar tone="quiz" value={view.quizGaugeValue} />}
              value={view.quizAverageValue}
              valueToneClassName="text-amber-300"
            />
            <MetricStripCell
              detail={`${view.signedBacktestDelta} vs starting balance`}
              label="Backtest balance"
              panelClassName="bg-[linear-gradient(180deg,rgba(52,211,153,0.08),transparent_82%)]"
              rail={
                <ProgressBar
                  tone={
                    dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"
                  }
                  value={view.backtestActivityValue}
                />
              }
              value={formatMoney(dashboard.backtestingSummary.currentBalance)}
              valueToneClassName={
                dashboard.backtestingSummary.balanceDelta < 0
                  ? "text-rose-300"
                  : "text-emerald-300"
              }
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
              value={dashboard.learningSummary.moduleTitle}
              valueToneClassName="text-cyan-300"
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
                    value={view.moduleCompletionValue}
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
                    <ProgressBar tone="learn" value={view.moduleCompletionValue} />
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

                {view.nextModule ? (
                  <QueueLine
                    detail={view.nextModule.description}
                    href={`/app/learn/${view.nextModule.slug}`}
                    label="Next module"
                    meta={`${view.nextModule.topic} • ${view.nextModule.duration} • ${view.nextModule.level}`}
                    title={view.nextModule.title}
                  />
                ) : null}

                {view.secondModule ? (
                  <QueueLine
                    detail={view.secondModule.description}
                    href={`/app/learn/${view.secondModule.slug}`}
                    label="After that"
                    meta={`${view.secondModule.topic} • ${view.secondModule.duration} • ${view.secondModule.level}`}
                    title={view.secondModule.title}
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
                metric={<CompactRing label="Score" tone="quiz" value={view.quizGaugeValue} />}
                secondary={dashboard.quizSummary.recommendedQuiz.title}
                title="Take the next quiz"
                value={view.quizAverageValue}
              />

              <ActionStatusCard
                ctaHref={dashboard.backtestingSummary.ctaHref}
                ctaLabel={dashboard.backtestingSummary.ctaLabel}
                detail={
                  view.completedSession
                    ? `${getBacktestingStatusLabel(view.completedSession.status)} on ${view.completedSession.symbol}. Current account balance tracks from your starting paper balance.`
                    : "Open the paper-trading workspace and log the first completed session."
                }
                eyebrow="Backtesting"
                metric={
                  <CompactRing
                    label="Activity"
                    tone={
                      dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"
                    }
                    value={view.backtestActivityValue}
                  />
                }
                secondary={view.signedBacktestDelta + " vs start"}
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
                  <CompactRing label="Learn" tone="learn" value={view.learnCompletionValue} />
                </div>
                <p className="mt-4 learn-tv-kicker text-center">Progress</p>
                <p className="mt-1 text-center text-[14px] font-semibold text-foreground sm:text-[15px]">
                  {dashboard.learningSummary.completedLessons} lessons finished
                </p>
                <p className="mt-2 text-center text-[11px] leading-5 text-muted sm:text-[12px]">
                  Current library completion based on finished lessons only.
                </p>
              </div>

              <div className="grid min-w-0 gap-3">
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
                  value={view.quizGaugeValue}
                  valueLabel={view.quizAverageValue}
                />
                <CoverageRow
                  detail={`${dashboard.backtestingSummary.sessionCount} completed session${dashboard.backtestingSummary.sessionCount === 1 ? "" : "s"} tracked.`}
                  label="Backtest activity"
                  tone={
                    dashboard.backtestingSummary.balanceDelta < 0 ? "negative" : "backtest"
                  }
                  value={view.backtestActivityValue}
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
