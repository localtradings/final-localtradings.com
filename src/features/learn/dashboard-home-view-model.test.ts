import { describe, expect, it } from "vitest";

import { buildDashboardHomeViewModel } from "@/features/learn/dashboard-home-view-model";
import type { DashboardHomeData } from "@/server/dashboard/queries";

const baseDashboard: DashboardHomeData = {
  displayName: "Lance",
  accountSummary: {
    displayName: "Lance",
    email: "lance@example.com",
    fullName: "Lance Trader",
    focusArea: "Risk management",
    isPro: false,
  },
  learningSummary: {
    completedLessons: 4,
    totalLessons: 16,
    completionPercent: 25,
    moduleTitle: "Trading Basics",
    moduleSlug: "trading-basics",
    moduleTopic: "Foundations",
    moduleDuration: "3 lessons",
    moduleCompletedLessons: 1,
    moduleTotalLessons: 3,
    moduleCompletionPercent: 33,
    lessonTitle: "How Orders and Price Work",
    progressLabel: "1/3 complete",
    progressDetail: "Resume your current lesson.",
    ctaHref: "/app/learn/trading-basics/how-orders-and-price-work",
    ctaLabel: "Continue learning",
  },
  quizSummary: {
    attemptCount: 3,
    averageScorePercent: 82,
    recommendedQuiz: {
      slug: "market-basics-check",
      title: "Market Basics Check",
      summary: "Quiz",
      difficulty: "Beginner",
      category: "Foundations",
      recommendedQuestionCount: 5,
      estimatedMinutes: 5,
      questions: [],
    },
    latestQuizTitle: "Market Basics Check",
    latestScorePercent: 80,
    ctaHref: "/app/quiz/market-basics-check/setup",
    ctaLabel: "Take next quiz",
  },
  backtestingSummary: {
    currentBalance: 102500,
    startingBalance: 100000,
    balanceDelta: 2500,
    balanceDeltaPercent: 2.5,
    sessionCount: 7,
    latestSession: null,
    ctaHref: "/app/backtesting",
    ctaLabel: "Open workspace",
  },
  battleSummary: {
    isWorkerConfigured: true,
    isPro: false,
    activePenaltyEndsAt: null,
    openRoomCount: 2,
    recentBattleCount: 1,
    winCount: 0,
    latestResult: null,
    ctaHref: "/app/battle",
    ctaLabel: "Open battle hub",
  },
  recommendedModules: [
    {
      slug: "market-structure",
      title: "Market Structure",
      description: "Read structure cleanly.",
      level: "Beginner",
      duration: "2 lessons",
      outcomes: [],
      lessonSlugs: [],
      topic: "Price Action",
      releaseOrder: 2,
      featured: false,
    },
    {
      slug: "risk-management",
      title: "Risk Management",
      description: "Protect capital.",
      level: "Beginner",
      duration: "2 lessons",
      outcomes: [],
      lessonSlugs: [],
      topic: "Risk",
      releaseOrder: 3,
      featured: false,
    },
  ],
};

describe("dashboard-home-view-model", () => {
  it("builds the expected view model values from dashboard data", () => {
    const viewModel = buildDashboardHomeViewModel(baseDashboard);

    expect(viewModel.overviewName).toBe("Lance");
    expect(viewModel.learnCompletionValue).toBe(25);
    expect(viewModel.moduleCompletionValue).toBe(33);
    expect(viewModel.quizAverageValue).toBe("82%");
    expect(viewModel.quizAverageDetail).toBe("3 saved attempts");
    expect(viewModel.signedBacktestDelta).toBe("+$2,500");
    expect(viewModel.nextModule?.slug).toBe("market-structure");
    expect(viewModel.secondModule?.slug).toBe("risk-management");
  });

  it("uses empty-state copy when quiz data is not available", () => {
    const viewModel = buildDashboardHomeViewModel({
      ...baseDashboard,
      displayName: null,
      quizSummary: {
        ...baseDashboard.quizSummary,
        attemptCount: 0,
        averageScorePercent: null,
      },
    });

    expect(viewModel.overviewName).toBe("Workspace");
    expect(viewModel.quizAverageValue).toBe("No data");
    expect(viewModel.quizAverageDetail).toBe("No quiz attempts yet");
    expect(viewModel.quizGaugeValue).toBe(0);
  });
});
