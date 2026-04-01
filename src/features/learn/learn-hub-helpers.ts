import {
  getLessonProgress,
  getModuleProgressStatus,
  type LearnProgressState,
} from "@/features/learn/progress-state";
import {
  formatProgressStatus,
  getCompletionPercent,
  getLessonActionLabel,
} from "@/features/learn/learn-shared";
import type {
  LearnHubModule,
  LearnLessonEntry,
  LessonSortValue,
  LessonStatusFilterValue,
  ModuleBoardFilterValue,
  ModulePrimaryAction,
  ModuleSnapshot,
} from "@/features/learn/learn-hub-types";

export const ITEMS_PER_PAGE = 8;

const popularModuleOrder = [
  "candlesticks",
  "risk-management",
  "trading-basics",
  "market-structure",
  "trade-planning",
  "trading-psychology",
  "advanced-indicators",
] as const;

const popularModuleRank = new Map<string, number>(
  popularModuleOrder.map((slug, index) => [slug, index]),
);

export const moduleBoardFilters: Array<{
  value: ModuleBoardFilterValue;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const lessonStatusFilters: Array<{
  value: LessonStatusFilterValue;
  label: string;
}> = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function matchesBoardFilter(
  progressLabel: string | null,
  filterValue: ModuleBoardFilterValue,
) {
  if (filterValue === "all") {
    return true;
  }

  if (filterValue === "not_started") {
    return progressLabel === null;
  }

  if (filterValue === "in_progress") {
    return progressLabel === "In Progress";
  }

  return progressLabel === "Completed";
}

export function getModuleCode(slug: string) {
  const codeMap: Record<string, string> = {
    "trading-basics": "BAS",
    candlesticks: "CDL",
    "market-structure": "STR",
    "risk-management": "RISK",
    "trade-planning": "PLAN",
    "advanced-indicators": "IND",
    "trading-psychology": "PSY",
  };

  return (
    codeMap[slug] ??
    slug
      .split("-")
      .map((segment) => segment[0])
      .join("")
      .slice(0, 4)
      .toUpperCase()
  );
}

export function buildFallbackClass(seed: string) {
  const variants = [
    "bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.07),transparent_34%),linear-gradient(180deg,#15171b_0%,#090a0d_100%)]",
    "bg-[radial-gradient(circle_at_top_right,rgba(168,172,180,0.12),transparent_34%),linear-gradient(180deg,#17191d_0%,#0a0b0d_100%)]",
    "bg-[radial-gradient(circle_at_center_top,rgba(255,255,255,0.05),transparent_34%),linear-gradient(180deg,#14161a_0%,#090a0c_100%)]",
    "bg-[radial-gradient(circle_at_top_left,rgba(120,124,132,0.1),transparent_36%),linear-gradient(180deg,#181a1e_0%,#0a0b0d_100%)]",
  ] as const;

  let hash = 0;
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % variants.length;
  }

  return variants[hash];
}

export function buildTopicOptions(entries: LearnLessonEntry[]) {
  return ["All", ...new Set(entries.map((entry) => entry.topic))];
}

export function matchesLearnQuery(query: string, values: Array<string | undefined>) {
  if (!query) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(query));
}

export function getQueryMatchScore(query: string, values: Array<string | undefined>) {
  if (!query) {
    return 0;
  }

  let bestScore = -1;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalizedValue = value.toLowerCase();
    const normalizedQuery = query.toLowerCase();

    if (normalizedValue === normalizedQuery) {
      bestScore = Math.max(bestScore, 500);
      continue;
    }

    if (normalizedValue.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 400);
      continue;
    }

    if (normalizedValue.includes(` ${normalizedQuery}`)) {
      bestScore = Math.max(bestScore, 320);
      continue;
    }

    const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
    if (queryTerms.length > 1 && queryTerms.every((term) => normalizedValue.includes(term))) {
      bestScore = Math.max(bestScore, 260);
      continue;
    }

    if (normalizedValue.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 220);
    }
  }

  return bestScore;
}

export function getModuleNextLesson(module: LearnHubModule, state: LearnProgressState) {
  return (
    module.lessons.find(
      (lesson) => getLessonProgress(state, module.slug, lesson.slug)?.status !== "completed",
    ) ??
    module.lessons[0] ??
    null
  );
}

export function getLessonStatusFilterValue(progressLabel: string | null): LessonStatusFilterValue {
  if (progressLabel === "Completed") {
    return "completed";
  }

  if (progressLabel === "In Progress") {
    return "in_progress";
  }

  return "not_started";
}

export function sortLessonEntries(entries: LearnLessonEntry[], sortBy: LessonSortValue) {
  const nextEntries = [...entries];

  nextEntries.sort((left, right) => {
    if (sortBy === "popular") {
      const leftRank = popularModuleRank.get(left.moduleSlug) ?? Number.MAX_SAFE_INTEGER;
      const rightRank = popularModuleRank.get(right.moduleSlug) ?? Number.MAX_SAFE_INTEGER;

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.lessonOrder - right.lessonOrder;
    }

    if (sortBy === "alphabetical") {
      return left.title.localeCompare(right.title);
    }

    if (sortBy === "newest") {
      if (right.releaseOrder !== left.releaseOrder) {
        return right.releaseOrder - left.releaseOrder;
      }

      return right.lessonOrder - left.lessonOrder;
    }

    if (left.releaseOrder !== right.releaseOrder) {
      return left.releaseOrder - right.releaseOrder;
    }

    return left.lessonOrder - right.lessonOrder;
  });

  return nextEntries;
}

export function getModulePrimaryAction(
  module: ModuleSnapshot,
  actionLesson: LearnHubModule["lessons"][number] | null,
  state: LearnProgressState,
): ModulePrimaryAction {
  if (module.progressLabel === "Completed") {
    return {
      href: `/app/learn/${module.slug}`,
      label: "Review module",
      detailLabel: "Progress",
      detailValue: `All ${module.totalLessons} lessons completed`,
    };
  }

  if (!actionLesson) {
    return {
      href: `/app/learn/${module.slug}`,
      label: "View module",
      detailLabel: "Overview",
      detailValue: "Open the module overview and browse every lesson.",
    };
  }

  const actionStatus = formatProgressStatus(
    getLessonProgress(state, module.slug, actionLesson.slug)?.status ?? null,
  );

  if (actionStatus === "In Progress") {
    return {
      href: `/app/learn/${module.slug}/${actionLesson.slug}`,
      label: "Resume lesson",
      detailLabel: "Current lesson",
      detailValue: actionLesson.title,
    };
  }

  if (module.progressLabel === "In Progress") {
    return {
      href: `/app/learn/${module.slug}`,
      label: "Continue module",
      detailLabel: "Next lesson",
      detailValue: actionLesson.title,
    };
  }

  return {
    href: `/app/learn/${module.slug}`,
    label: "Start module",
    detailLabel: "Starts with",
    detailValue: actionLesson.title,
  };
}

export function buildLessonEntries(modules: LearnHubModule[]): LearnLessonEntry[] {
  return modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      slug: lesson.slug,
      moduleSlug: module.slug,
      moduleTitle: module.title,
      title: lesson.title,
      summary: lesson.summary,
      topic: lesson.topic,
      duration: lesson.duration,
      level: module.level,
      imageSrc: lesson.imageSrc ?? module.imageSrc,
      href: `/app/learn/${module.slug}/${lesson.slug}`,
      releaseOrder: module.releaseOrder,
      lessonOrder: lesson.order,
    })),
  );
}

export function buildModuleSnapshots(
  orderedModules: LearnHubModule[],
  state: LearnProgressState,
): ModuleSnapshot[] {
  return orderedModules.map((module) => {
    const completedCount = module.lessons.filter(
      (lesson) => getLessonProgress(state, module.slug, lesson.slug)?.status === "completed",
    ).length;
    const totalLessons = module.lessons.length;

    return {
      ...module,
      code: getModuleCode(module.slug),
      completedCount,
      completionPercent: getCompletionPercent(completedCount, totalLessons),
      progressLabel: formatProgressStatus(getModuleProgressStatus(state, module)),
      totalLessons,
    };
  });
}

export { getLessonActionLabel };
