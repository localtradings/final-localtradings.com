import "server-only";

import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";
import {
  getContinueLearningLesson,
  getLessonProgress,
  getModuleProgressStatus,
  type LearnCatalogModule,
} from "@/features/learn/progress-state";
import { getLessonsForModule } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_BACKTEST_ACCOUNT, getBacktestAccount } from "@/server/backtesting/account-queries";
import { getBacktestSessions } from "@/server/backtesting/queries";
import { getLearnProgressState } from "@/server/learn/queries";
import { getCurrentProfile } from "@/server/profile/queries";
import type { BacktestSessionRecord } from "@/features/backtesting/types";
import type { LessonFrontmatter, ModuleSummary, QuizDefinition } from "@/types/content";

type QuizAttemptRow = {
  quiz_slug: string;
  score: number;
  total_questions: number;
  created_at: string;
};

type DashboardLearnModule = {
  slug: string;
  title: string;
  lessons: LessonFrontmatter[];
};

type DashboardQuizSummary = {
  attemptCount: number;
  averageScorePercent: number | null;
  recommendedQuiz: QuizDefinition;
  latestQuizTitle: string | null;
  ctaHref: string;
  ctaLabel: string;
};

type DashboardLearningSummary = {
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  moduleTitle: string;
  moduleSlug: string;
  moduleTopic: string;
  moduleDuration: string;
  moduleCompletedLessons: number;
  moduleTotalLessons: number;
  moduleCompletionPercent: number;
  lessonTitle: string | null;
  progressLabel: string;
  progressDetail: string;
  ctaHref: string;
  ctaLabel: string;
};

type DashboardBacktestingSummary = {
  currentBalance: number;
  startingBalance: number;
  balanceDelta: number;
  balanceDeltaPercent: number;
  sessionCount: number;
  latestSession: BacktestSessionRecord | null;
  ctaHref: string;
  ctaLabel: string;
};

export type DashboardHomeData = {
  displayName: string | null;
  learningSummary: DashboardLearningSummary;
  quizSummary: DashboardQuizSummary;
  backtestingSummary: DashboardBacktestingSummary;
  recommendedModules: ModuleSummary[];
};

async function getDashboardLearnCatalog() {
  return Promise.all(
    moduleCatalog.map(async (module) => ({
      slug: module.slug,
      title: module.title,
      lessons: await getLessonsForModule(module.slug),
    })),
  ) as Promise<DashboardLearnModule[]>;
}

async function getQuizAttempts(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as QuizAttemptRow[];
  }

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("quiz_slug, score, total_questions, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [] as QuizAttemptRow[];
  }

  return data as QuizAttemptRow[];
}

function getCompletionPercent(completedCount: number, totalCount: number) {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((completedCount / totalCount) * 100);
}

function buildLearningSummary(
  learnModules: DashboardLearnModule[],
  progressState: Awaited<ReturnType<typeof getLearnProgressState>>,
): DashboardLearningSummary {
  const completedLessons = Object.values(progressState.lessons).filter(
    (lesson) => lesson.status === "completed",
  ).length;
  const totalLessons = learnModules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completionPercent = getCompletionPercent(completedLessons, totalLessons);
  const continueLesson = getContinueLearningLesson(progressState, learnModules);

  if (continueLesson) {
    const moduleMeta = moduleCatalog.find((module) => module.slug === continueLesson.module.slug);
    const completedCount = continueLesson.module.lessons.filter(
      (lesson) =>
        getLessonProgress(progressState, continueLesson.module.slug, lesson.slug)?.status ===
        "completed",
    ).length;
    const moduleTotalLessons = continueLesson.module.lessons.length;
    const moduleCompletionPercent = getCompletionPercent(completedCount, moduleTotalLessons);

    return {
      completedLessons,
      totalLessons,
      completionPercent,
      moduleTitle: continueLesson.module.title,
      moduleSlug: continueLesson.module.slug,
      moduleTopic: moduleMeta?.topic ?? "Learning",
      moduleDuration: moduleMeta?.duration ?? `${continueLesson.module.lessons.length} lessons`,
      moduleCompletedLessons: completedCount,
      moduleTotalLessons,
      moduleCompletionPercent,
      lessonTitle: continueLesson.lesson.title,
      progressLabel: `${completedCount}/${continueLesson.module.lessons.length} complete`,
      progressDetail:
        continueLesson.status === "in_progress"
          ? "Resume your current lesson."
          : "Open the module and continue with the next lesson.",
      ctaHref:
        continueLesson.status === "in_progress"
          ? `/app/learn/${continueLesson.module.slug}/${continueLesson.lesson.slug}`
          : `/app/learn/${continueLesson.module.slug}`,
      ctaLabel: "Continue learning",
    };
  }

  const starterModule = moduleCatalog.find((module) => module.featured) ?? moduleCatalog[0];
  const starterLessons =
    learnModules.find((module) => module.slug === starterModule?.slug)?.lessons ?? [];

  return {
    completedLessons,
    totalLessons,
    completionPercent,
    moduleTitle: starterModule?.title ?? "Learn",
    moduleSlug: starterModule?.slug ?? "learn",
    moduleTopic: starterModule?.topic ?? "Foundations",
    moduleDuration: starterModule?.duration ?? `${starterLessons.length} lessons`,
    moduleCompletedLessons: 0,
    moduleTotalLessons: starterLessons.length,
    moduleCompletionPercent: 0,
    lessonTitle: starterLessons[0]?.title ?? null,
    progressLabel: `0/${starterLessons.length} complete`,
    progressDetail: "Start with the core foundations module.",
    ctaHref: starterModule ? `/app/learn/${starterModule.slug}` : "/app/learn",
    ctaLabel: "Start learning",
  };
}

function buildQuizSummary(
  attempts: QuizAttemptRow[],
  recommendedQuiz: QuizDefinition,
): DashboardQuizSummary {
  const attemptCount = attempts.length;
  const totalPercent = attempts.reduce((sum, attempt) => {
    const scorePercent =
      attempt.total_questions > 0 ? (attempt.score / attempt.total_questions) * 100 : 0;
    return sum + scorePercent;
  }, 0);
  const averageScorePercent =
    attemptCount > 0 ? Math.round(totalPercent / attemptCount) : null;
  const latestQuizTitle =
    attempts.length > 0
      ? quizCatalog.find((quiz) => quiz.slug === attempts[0]?.quiz_slug)?.title ?? null
      : null;

  return {
    attemptCount,
    averageScorePercent,
    recommendedQuiz,
    latestQuizTitle,
    ctaHref: `/app/quiz/${recommendedQuiz.slug}/setup`,
    ctaLabel: attemptCount > 0 ? "Take next quiz" : "Start first quiz",
  };
}

function buildBacktestingSummary(
  account: Awaited<ReturnType<typeof getBacktestAccount>>,
  sessions: BacktestSessionRecord[],
): DashboardBacktestingSummary {
  const accountState = account ?? DEFAULT_BACKTEST_ACCOUNT;
  const startingBalance = accountState.startingBalance;
  const currentBalance = accountState.currentBalance;
  const balanceDelta = currentBalance - startingBalance;
  const balanceDeltaPercent =
    startingBalance > 0 ? Math.round((balanceDelta / startingBalance) * 10000) / 100 : 0;

  return {
    currentBalance,
    startingBalance,
    balanceDelta,
    balanceDeltaPercent,
    sessionCount: sessions.length,
    latestSession: sessions[0] ?? null,
    ctaHref: "/app/backtesting",
    ctaLabel: sessions.length > 0 ? "Open workspace" : "Start backtesting",
  };
}

function getRecommendedModules(
  learnModules: LearnCatalogModule[],
  progressState: Awaited<ReturnType<typeof getLearnProgressState>>,
  activeModuleSlug: string,
) {
  const learnCatalogModules = learnModules as LearnCatalogModule[];
  const ranked = moduleCatalog
    .filter((module) => module.slug !== activeModuleSlug)
    .sort((left, right) => {
      const leftCompleted = getModuleProgressStatus(
        progressState,
        learnCatalogModules.find((module) => module.slug === left.slug) ?? {
          slug: left.slug,
          title: left.title,
          lessons: [],
        },
      );
      const rightCompleted = getModuleProgressStatus(
        progressState,
        learnCatalogModules.find((module) => module.slug === right.slug) ?? {
          slug: right.slug,
          title: right.title,
          lessons: [],
        },
      );

      if (leftCompleted === "completed" && rightCompleted !== "completed") {
        return 1;
      }

      if (rightCompleted === "completed" && leftCompleted !== "completed") {
        return -1;
      }

      if (Boolean(left.featured) !== Boolean(right.featured)) {
        return left.featured ? -1 : 1;
      }

      return left.releaseOrder - right.releaseOrder;
    });

  return ranked.slice(0, 2);
}

export async function getDashboardHomeData(userId: string): Promise<DashboardHomeData> {
  const [profile, learnModules, progressState, quizAttempts, account, sessions] =
    await Promise.all([
      getCurrentProfile(userId),
      getDashboardLearnCatalog(),
      getLearnProgressState(userId),
      getQuizAttempts(userId),
      getBacktestAccount(userId),
      getBacktestSessions(userId),
    ]);

  const learningSummary = buildLearningSummary(learnModules, progressState);
  const attemptedQuizSlugs = new Set(quizAttempts.map((attempt) => attempt.quiz_slug));
  const learningModule = learnModules.find(
    (module) => module.slug === learningSummary.moduleSlug,
  );
  const learningQuiz =
    learningSummary.lessonTitle
      ? learningModule?.lessons.find((lesson) => lesson.title === learningSummary.lessonTitle)
          ?.quizSlug
      : undefined;
  const recommendedQuiz =
    (learningQuiz ? quizCatalog.find((quiz) => quiz.slug === learningQuiz) : undefined) ??
    quizCatalog.find((quiz) => !attemptedQuizSlugs.has(quiz.slug)) ??
    quizCatalog.find((quiz) => quiz.slug === quizAttempts[0]?.quiz_slug) ??
    quizCatalog[0];

  return {
    displayName:
      profile?.displayName.trim() || profile?.fullName.trim() || null,
    learningSummary,
    quizSummary: buildQuizSummary(quizAttempts, recommendedQuiz),
    backtestingSummary: buildBacktestingSummary(account, sessions),
    recommendedModules: getRecommendedModules(
      learnModules,
      progressState,
      learningSummary.moduleSlug,
    ),
  };
}
