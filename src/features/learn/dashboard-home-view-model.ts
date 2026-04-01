import type { DashboardHomeData } from "@/server/dashboard/queries";

import {
  clampPercent,
  formatPercent,
  formatSignedMoney,
  getBacktestingActivityPercent,
} from "@/features/learn/dashboard-home-ui";

export function buildDashboardHomeViewModel(dashboard: DashboardHomeData) {
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

  return {
    backtestActivityValue,
    completedSession,
    learnCompletionValue,
    moduleCompletionValue,
    nextModule,
    overviewName,
    quizAverageDetail,
    quizAverageValue,
    quizGaugeValue,
    secondModule,
    signedBacktestDelta: formatSignedMoney(dashboard.backtestingSummary.balanceDelta),
  };
}
