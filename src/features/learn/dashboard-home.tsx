import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  CircleAlert,
  ClipboardList,
  ShieldCheck,
  Swords,
  UserRound,
} from "lucide-react";

import { formatMoney, formatPercent, formatSignedMoney, getBacktestingStatusLabel } from "@/features/learn/dashboard-home-ui";
import { requireUser } from "@/server/auth/session";
import { getDashboardHomeData } from "@/server/dashboard/queries";

function formatDateTime(value: string | null) {
  if (!value) {
    return "No record";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPenaltyUntil(value: string | null) {
  if (!value) {
    return "Clear";
  }

  return `Restricted until ${formatDateTime(value)}`;
}

function formatQuizScore(value: number | null) {
  return value === null ? "No score yet" : formatPercent(value);
}

function getBattleStatusLabel({
  activePenaltyEndsAt,
  isWorkerConfigured,
  isPro,
}: {
  activePenaltyEndsAt: string | null;
  isWorkerConfigured: boolean;
  isPro: boolean;
}) {
  if (!isWorkerConfigured) {
    return "Unavailable";
  }

  if (activePenaltyEndsAt) {
    return "Penalty active";
  }

  if (!isPro) {
    return "Upgrade required";
  }

  return "Ready";
}

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "danger" | "neutral" | "positive" | "warning";
}) {
  const toneClassName =
    tone === "positive"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
        : tone === "danger"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-200"
          : "border-white/10 bg-white/6 text-white/72";

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClassName}`}
    >
      {label}
    </span>
  );
}

function DashboardPanel({
  action,
  children,
  description,
  icon,
  title,
}: {
  action?: { href: string; label: string };
  children: ReactNode;
  description?: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,25,0.98),rgba(10,13,18,0.98))]">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white/70">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
              {icon}
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/48">
              Dashboard area
            </p>
          </div>
          <h2 className="mt-3 text-[1.08rem] font-semibold tracking-tight text-white sm:text-[1.16rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-[42rem] text-[12px] leading-5 text-white/56 sm:text-[13px]">
              {description}
            </p>
          ) : null}
        </div>

        {action ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/9"
            href={action.href}
          >
            {action.label}
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        ) : null}
      </div>

      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function MetricCell({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
        {label}
      </p>
      <p className="mt-2 text-[1.6rem] font-semibold tracking-tight text-white sm:text-[1.9rem]">
        {value}
      </p>
      <p className="mt-2 text-[12px] leading-5 text-white/56">{detail}</p>
    </div>
  );
}

function DataLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 py-3 last:border-b-0">
      <p className="text-[12px] text-white/50">{label}</p>
      <p className="max-w-[65%] text-right text-[12px] font-medium text-white/86">{value}</p>
    </div>
  );
}

function ActionRow({
  detail,
  href,
  label,
  value,
}: {
  detail: string;
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link
      className="grid gap-2 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
            {label}
          </p>
          <p className="mt-1 text-[15px] font-semibold tracking-tight text-white">{value}</p>
        </div>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/42" strokeWidth={1.8} />
      </div>
      <p className="text-[12px] leading-5 text-white/58">{detail}</p>
    </Link>
  );
}

export async function DashboardHome() {
  const user = await requireUser();
  const dashboard = await getDashboardHomeData(user.id);
  const quizAverage = formatQuizScore(dashboard.quizSummary.averageScorePercent);
  const latestQuizScore = formatQuizScore(dashboard.quizSummary.latestScorePercent);
  const battleTone = dashboard.battleSummary.activePenaltyEndsAt
    ? "danger"
    : dashboard.battleSummary.isWorkerConfigured && dashboard.battleSummary.isPro
      ? "positive"
      : dashboard.battleSummary.isWorkerConfigured
        ? "warning"
        : "danger";

  return (
    <div className="space-y-4 pb-6 sm:space-y-5">
      <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(24,255,149,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(80,160,255,0.12),transparent_30%),linear-gradient(180deg,rgba(13,17,22,1),rgba(8,10,14,1))]">
        <div className="grid gap-6 px-4 py-5 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={dashboard.accountSummary.isPro ? "Pro access" : "Standard access"}
                tone={dashboard.accountSummary.isPro ? "positive" : "neutral"}
              />
              <StatusPill
                label={getBattleStatusLabel(dashboard.battleSummary)}
                tone={battleTone}
              />
              <StatusPill
                label={`${dashboard.learningSummary.completedLessons}/${dashboard.learningSummary.totalLessons} lessons complete`}
              />
            </div>

            <h1 className="mt-4 max-w-[12ch] text-[2.2rem] font-semibold tracking-[-0.04em] text-white sm:text-[3rem] sm:leading-[0.92]">
              Home dashboard
            </h1>
            <p className="mt-3 max-w-[48rem] text-[13px] leading-6 text-white/62 sm:text-[14px]">
              Everything below comes from your current account state: profile, learning progress,
              quiz history, backtesting balance, and battle status.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.1rem] border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                Account owner
              </p>
              <p className="mt-2 text-[1.15rem] font-semibold tracking-tight text-white">
                {dashboard.displayName ?? dashboard.accountSummary.email ?? "Trader"}
              </p>
              <p className="mt-1 text-[12px] text-white/54">
                {dashboard.accountSummary.email ?? "No email loaded"}
              </p>
            </div>

            <div className="grid gap-2.5 text-[12px] text-white/72">
              <div className="flex items-center justify-between gap-3">
                <span>Focus area</span>
                <span className="text-right text-white/92">
                  {dashboard.accountSummary.focusArea ?? "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Current module</span>
                <span className="text-right text-white/92">
                  {dashboard.learningSummary.moduleTitle}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Recommended quiz</span>
                <span className="text-right text-white/92">
                  {dashboard.quizSummary.recommendedQuiz.title}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link className="btn-primary min-h-10 px-4 py-2.5 text-[11px] sm:text-xs" href="/app/profile">
                Update profile
              </Link>
              <Link className="btn-secondary min-h-10 px-4 py-2.5 text-[11px] sm:text-xs" href="/app/learn">
                Open learning hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCell
          detail={`${formatPercent(dashboard.learningSummary.completionPercent)} of the lesson library completed.`}
          label="Learning coverage"
          value={`${dashboard.learningSummary.completedLessons}/${dashboard.learningSummary.totalLessons}`}
        />
        <MetricCell
          detail={`${dashboard.quizSummary.attemptCount} saved attempt${dashboard.quizSummary.attemptCount === 1 ? "" : "s"} in quiz history.`}
          label="Quiz average"
          value={quizAverage}
        />
        <MetricCell
          detail={`${formatSignedMoney(dashboard.backtestingSummary.balanceDelta)} from ${formatMoney(dashboard.backtestingSummary.startingBalance)} start.`}
          label="Backtesting balance"
          value={formatMoney(dashboard.backtestingSummary.currentBalance)}
        />
        <MetricCell
          detail={`${dashboard.battleSummary.winCount} win${dashboard.battleSummary.winCount === 1 ? "" : "s"} across ${dashboard.battleSummary.recentBattleCount} recent result${dashboard.battleSummary.recentBattleCount === 1 ? "" : "s"}.`}
          label="Battle record"
          value={`${dashboard.battleSummary.recentBattleCount}`}
        />
      </section>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
        <div className="grid gap-4">
          <DashboardPanel
            action={{ href: dashboard.learningSummary.ctaHref, label: dashboard.learningSummary.ctaLabel }}
            description="This block shows where the account currently is inside the lesson library and what should be opened next."
            icon={<BookOpen className="h-4.5 w-4.5" strokeWidth={1.9} />}
            title="Learning status"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                  Active module
                </p>
                <h3 className="mt-2 text-[1.2rem] font-semibold tracking-tight text-white">
                  {dashboard.learningSummary.moduleTitle}
                </h3>
                <p className="mt-2 text-[12px] leading-5 text-white/58">
                  {dashboard.learningSummary.lessonTitle
                    ? `${dashboard.learningSummary.lessonTitle}. ${dashboard.learningSummary.progressDetail}`
                    : dashboard.learningSummary.progressDetail}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#4ade80,#22d3ee)]"
                    style={{ width: `${dashboard.learningSummary.moduleCompletionPercent}%` }}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-[12px] text-white/72 sm:grid-cols-3">
                  <span>{dashboard.learningSummary.progressLabel}</span>
                  <span>{dashboard.learningSummary.moduleTopic}</span>
                  <span>{dashboard.learningSummary.moduleDuration}</span>
                </div>
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                  Monitor
                </p>
                <div className="mt-2">
                  <DataLine label="Completed lessons" value={`${dashboard.learningSummary.completedLessons}`} />
                  <DataLine label="Library total" value={`${dashboard.learningSummary.totalLessons}`} />
                  <DataLine
                    label="Library completion"
                    value={formatPercent(dashboard.learningSummary.completionPercent)}
                  />
                  <DataLine
                    label="Current lesson"
                    value={dashboard.learningSummary.lessonTitle ?? "Module overview"}
                  />
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            action={{ href: "/app/quiz", label: "Open quiz hub" }}
            description="Quiz and backtesting are grouped here because they validate whether study work is turning into usable decisions."
            icon={<ClipboardList className="h-4.5 w-4.5" strokeWidth={1.9} />}
            title="Assessment and practice"
          >
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="grid gap-3">
                <ActionRow
                  detail={
                    dashboard.quizSummary.latestQuizTitle
                      ? `Latest saved quiz is ${dashboard.quizSummary.latestQuizTitle} with a latest recorded score of ${latestQuizScore}.`
                      : "No saved quiz attempts yet. Start the first quiz to create history."
                  }
                  href={dashboard.quizSummary.ctaHref}
                  label="Quiz next move"
                  value={dashboard.quizSummary.recommendedQuiz.title}
                />
                <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                    Quiz monitor
                  </p>
                  <div className="mt-2">
                    <DataLine label="Average score" value={quizAverage} />
                    <DataLine label="Latest score" value={latestQuizScore} />
                    <DataLine
                      label="Attempt count"
                      value={`${dashboard.quizSummary.attemptCount}`}
                    />
                    <DataLine
                      label="Latest quiz"
                      value={dashboard.quizSummary.latestQuizTitle ?? "No record"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <ActionRow
                  detail={
                    dashboard.backtestingSummary.latestSession
                      ? `${getBacktestingStatusLabel(dashboard.backtestingSummary.latestSession.status)} on ${dashboard.backtestingSummary.latestSession.symbol} ${dashboard.backtestingSummary.latestSession.timeframe}.`
                      : "No completed backtesting session yet. Open the workspace and log the first one."
                  }
                  href={dashboard.backtestingSummary.ctaHref}
                  label="Backtesting workspace"
                  value={formatMoney(dashboard.backtestingSummary.currentBalance)}
                />
                <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                    Backtesting monitor
                  </p>
                  <div className="mt-2">
                    <DataLine
                      label="Starting balance"
                      value={formatMoney(dashboard.backtestingSummary.startingBalance)}
                    />
                    <DataLine
                      label="Balance delta"
                      value={formatSignedMoney(dashboard.backtestingSummary.balanceDelta)}
                    />
                    <DataLine
                      label="Delta percent"
                      value={formatPercent(Math.round(dashboard.backtestingSummary.balanceDeltaPercent))}
                    />
                    <DataLine
                      label="Completed sessions"
                      value={`${dashboard.backtestingSummary.sessionCount}`}
                    />
                    <DataLine
                      label="Latest session"
                      value={
                        dashboard.backtestingSummary.latestSession
                          ? `${dashboard.backtestingSummary.latestSession.symbol} • ${formatDateTime(dashboard.backtestingSummary.latestSession.finishedAt)}`
                          : "No record"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div className="grid gap-4">
          <DashboardPanel
            action={{ href: "/app/profile", label: "Manage profile" }}
            description="Account fields shown here are the same profile fields already stored for the signed-in user."
            icon={<UserRound className="h-4.5 w-4.5" strokeWidth={1.9} />}
            title="Account snapshot"
          >
            <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill
                  label={dashboard.accountSummary.isPro ? "Pro account" : "Standard account"}
                  tone={dashboard.accountSummary.isPro ? "positive" : "neutral"}
                />
                <StatusPill label={dashboard.accountSummary.focusArea ?? "No focus area"} />
              </div>
              <div className="mt-3">
                <DataLine
                  label="Display name"
                  value={dashboard.accountSummary.displayName ?? "Not set"}
                />
                <DataLine label="Full name" value={dashboard.accountSummary.fullName ?? "Not set"} />
                <DataLine label="Email" value={dashboard.accountSummary.email ?? "Not loaded"} />
                <DataLine
                  label="Focus area"
                  value={dashboard.accountSummary.focusArea ?? "Not set"}
                />
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            action={{ href: dashboard.battleSummary.ctaHref, label: dashboard.battleSummary.ctaLabel }}
            description="Battle visibility belongs on home because users need to know whether they can join, whether rooms exist, and whether penalties or access rules are blocking them."
            icon={<Swords className="h-4.5 w-4.5" strokeWidth={1.9} />}
            title="Battle status"
          >
            <div className="grid gap-3">
              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={getBattleStatusLabel(dashboard.battleSummary)} tone={battleTone} />
                  <StatusPill
                    label={
                      dashboard.battleSummary.isWorkerConfigured ? "Worker online" : "Worker offline"
                    }
                    tone={dashboard.battleSummary.isWorkerConfigured ? "positive" : "danger"}
                  />
                </div>
                <div className="mt-3">
                  <DataLine
                    label="Open rooms right now"
                    value={`${dashboard.battleSummary.openRoomCount}`}
                  />
                  <DataLine
                    label="Recent results tracked"
                    value={`${dashboard.battleSummary.recentBattleCount}`}
                  />
                  <DataLine label="Recent wins" value={`${dashboard.battleSummary.winCount}`} />
                  <DataLine
                    label="Penalty state"
                    value={formatPenaltyUntil(dashboard.battleSummary.activePenaltyEndsAt)}
                  />
                </div>
              </div>

              <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                  Latest result
                </p>
                {dashboard.battleSummary.latestResult ? (
                  <>
                    <p className="mt-2 text-[15px] font-semibold tracking-tight text-white">
                      {dashboard.battleSummary.latestResult.symbol} •{" "}
                      {dashboard.battleSummary.latestResult.timeframe}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-white/58">
                      Winner: {dashboard.battleSummary.latestResult.winnerDisplayName ?? "No winner"}.
                      Ended {formatDateTime(dashboard.battleSummary.latestResult.endedAt)}.
                    </p>
                  </>
                ) : (
                  <p className="mt-2 text-[12px] leading-5 text-white/58">
                    No completed battle results are linked to this account yet.
                  </p>
                )}
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel
            action={{ href: "/app/learn", label: "View modules" }}
            description="These are the next modules already ranked by the dashboard query so the home screen can point users to the next practical study move."
            icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={1.9} />}
            title="Recommended study queue"
          >
            <div className="grid gap-2">
              {dashboard.recommendedModules.map((module) => (
                <Link
                  className="grid gap-1 rounded-[1rem] border border-white/8 bg-white/[0.03] px-4 py-4 transition hover:bg-white/[0.05]"
                  href={`/app/learn/${module.slug}`}
                  key={module.slug}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                        {module.topic}
                      </p>
                      <p className="mt-1 text-[15px] font-semibold tracking-tight text-white">
                        {module.title}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-white/42" />
                  </div>
                  <p className="text-[12px] leading-5 text-white/58">{module.description}</p>
                  <p className="text-[12px] text-white/42">
                    {module.duration} • {module.level}
                  </p>
                </Link>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </div>

      <section className="rounded-[1.15rem] border border-dashed border-white/10 bg-white/[0.025] px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/64">
            <CircleAlert className="h-4.5 w-4.5" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
              Dashboard intent
            </p>
            <p className="mt-2 text-[13px] leading-6 text-white/62">
              This home screen now answers five operational questions immediately: who the user is,
              where they are in Learn, how quizzes are going, how the paper account is performing,
              and whether Battle is available or blocked.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
