"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import {
  getContinueLearningLesson,
  getLessonProgress,
  getModuleProgressStatus,
} from "@/features/learn/progress-state";
import { useLearnProgress } from "@/features/learn/learn-progress-provider";
import { cn } from "@/lib/utils";
import type { LessonFrontmatter, ModuleSummary } from "@/types/content";

type LearnHubModule = ModuleSummary & {
  lessons: LessonFrontmatter[];
};

type LearnLessonEntry = {
  slug: string;
  moduleSlug: string;
  moduleTitle: string;
  title: string;
  summary: string;
  topic: string;
  duration: string;
  level: ModuleSummary["level"];
  imageSrc?: string;
  href: string;
  releaseOrder: number;
  lessonOrder: number;
};

type ModuleSnapshot = LearnHubModule & {
  code: string;
  completedCount: number;
  completionPercent: number;
  progressLabel: string | null;
  totalLessons: number;
};

type LessonSortValue = "recommended" | "newest" | "alphabetical" | "popular";
type LessonStatusFilterValue = "not_started" | "in_progress" | "completed";
type ModuleBoardFilterValue = "all" | "not_started" | "in_progress" | "completed";

type ModulePrimaryAction = {
  href: string;
  label: string;
  detailLabel: string;
  detailValue: string;
};

type SearchSuggestion = {
  id: string;
  kind: "lesson" | "module" | "topic";
  label: string;
  description: string;
  href?: string;
  moduleIndex?: number;
  topicValue?: string;
};

const ITEMS_PER_PAGE = 8;

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

const moduleBoardFilters: Array<{
  value: ModuleBoardFilterValue;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const lessonStatusFilters: Array<{
  value: LessonStatusFilterValue;
  label: string;
}> = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function formatProgress(status: "in_progress" | "completed" | null) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return null;
}

function getDisplayStatus(progressLabel: string | null) {
  return progressLabel ?? "Not started";
}

function getStatusTextClass(statusLabel: string) {
  if (statusLabel === "Completed") {
    return "learn-tv-positive";
  }

  if (statusLabel === "In Progress") {
    return "text-primary";
  }

  return "text-muted";
}

function getStatusChipClass(statusLabel: string) {
  return cn(
    "learn-tv-chip px-2.5 py-1 text-[0.62rem] tracking-[0.14em]",
    statusLabel === "Completed"
      ? "learn-tv-chip--positive"
      : statusLabel === "In Progress"
        ? "learn-tv-chip--active"
        : "",
  );
}

function getBoardStatusChipClass(statusLabel: string) {
  return cn(
    "learn-tv-chip rounded-[0.6rem] px-2 py-[0.26rem] text-[0.54rem] tracking-[0.11em]",
    statusLabel === "Completed"
      ? "learn-tv-chip--positive"
      : statusLabel === "In Progress"
        ? "learn-tv-chip--active"
        : "",
  );
}

function matchesBoardFilter(
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

function getModuleCode(slug: string) {
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

function getCompletionPercent(completedCount: number, totalLessons: number) {
  if (totalLessons === 0) {
    return 0;
  }

  return Math.round((completedCount / totalLessons) * 100);
}

function buildFallbackClass(seed: string) {
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

function buildTopicOptions(entries: LearnLessonEntry[]) {
  return ["All", ...new Set(entries.map((entry) => entry.topic))];
}

function matchesLearnQuery(query: string, values: Array<string | undefined>) {
  if (!query) {
    return true;
  }

  return values.some((value) => value?.toLowerCase().includes(query));
}

function getQueryMatchScore(query: string, values: Array<string | undefined>) {
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

function getModuleNextLesson(
  module: LearnHubModule,
  state: ReturnType<typeof useLearnProgress>["state"],
) {
  return (
    module.lessons.find(
      (lesson) => getLessonProgress(state, module.slug, lesson.slug)?.status !== "completed",
    ) ??
    module.lessons[0] ??
    null
  );
}

function getLessonActionLabel(progressLabel: string | null) {
  if (progressLabel === "Completed") {
    return "Review lesson";
  }

  if (progressLabel === "In Progress") {
    return "Resume lesson";
  }

  return "Start lesson";
}

function getLessonStatusFilterValue(progressLabel: string | null): LessonStatusFilterValue {
  if (progressLabel === "Completed") {
    return "completed";
  }

  if (progressLabel === "In Progress") {
    return "in_progress";
  }

  return "not_started";
}

function sortLessonEntries(entries: LearnLessonEntry[], sortBy: LessonSortValue) {
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

function getModulePrimaryAction(
  module: ModuleSnapshot,
  actionLesson: LessonFrontmatter | null,
  state: ReturnType<typeof useLearnProgress>["state"],
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

  const actionStatus = formatProgress(
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

function HubCardImage({
  alt,
  imageSrc,
  seed,
  sizes,
  eager = false,
}: {
  alt: string;
  imageSrc?: string;
  seed: string;
  sizes: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const showFallback = !imageSrc || failed;

  if (showFallback) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-end overflow-hidden",
          buildFallbackClass(seed),
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(10,13,20,0.88))]" />
        <div className="relative p-5">
          <p className="text-base font-bold tracking-tight text-white/88">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className="object-cover"
      fetchPriority={eager ? "high" : undefined}
      fill
      loading={eager ? "eager" : undefined}
      onError={(event: SyntheticEvent<HTMLImageElement>) => {
        event.currentTarget.onerror = null;
        setFailed(true);
      }}
      sizes={sizes}
      src={imageSrc}
    />
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 border-t border-outline-variant/80 px-4 py-4">
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-outline-variant/80 bg-surface-low text-muted transition hover:border-primary/25 hover:bg-surface-highest hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        type="button"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          className={cn(
            "inline-flex h-9 min-w-9 items-center justify-center rounded-[var(--radius-lg)] border px-3 text-xs font-bold transition-colors",
            page === currentPage
              ? "border-primary/30 bg-primary/12 text-primary"
              : "border-outline-variant/80 bg-surface-low text-muted hover:border-primary/20 hover:bg-surface-highest hover:text-foreground",
          )}
          key={page}
          onClick={() => onPageChange(page)}
          type="button"
        >
          {page}
        </button>
      ))}
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-outline-variant/80 bg-surface-low text-muted transition hover:border-primary/25 hover:bg-surface-highest hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        type="button"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function FilterControls({
  topicOptions,
  selectedTopic,
  sortBy,
  selectedStatuses,
  onReset,
  onTopicChange,
  onSortChange,
  onStatusToggle,
}: {
  topicOptions: string[];
  selectedTopic: string;
  sortBy: LessonSortValue;
  selectedStatuses: LessonStatusFilterValue[];
  onReset: () => void;
  onTopicChange: (value: string) => void;
  onSortChange: (value: LessonSortValue) => void;
  onStatusToggle: (value: LessonStatusFilterValue) => void;
}) {
  return (
    <div className="flex w-full items-center gap-2">
      <div className="min-w-0 flex-1 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2 whitespace-nowrap pr-1">
          <select
            className="min-h-8 min-w-[9.25rem] shrink-0 rounded-[0.8rem] border border-outline-variant/70 bg-surface-low px-3 text-[10px] font-semibold text-foreground outline-none transition hover:bg-surface-highest focus:border-primary/20 sm:min-h-9 sm:min-w-[10rem] sm:px-3.5 sm:text-[11px]"
            id="lesson-topic-filter"
            name="lesson_topic_filter"
            onChange={(event) => onTopicChange(event.target.value)}
            value={selectedTopic}
          >
            {topicOptions.map((topic) => (
              <option key={topic} value={topic}>
                {topic === "All" ? "All topics" : topic}
              </option>
            ))}
          </select>

          <select
            className="min-h-8 min-w-[8.4rem] shrink-0 rounded-[0.8rem] border border-outline-variant/70 bg-surface-low px-3 text-[10px] font-semibold text-foreground outline-none transition hover:bg-surface-highest focus:border-primary/20 sm:min-h-9 sm:min-w-[9.25rem] sm:px-3.5 sm:text-[11px]"
            id="lesson-sort-filter"
            name="lesson_sort_filter"
            onChange={(event) => onSortChange(event.target.value as LessonSortValue)}
            value={sortBy}
          >
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="alphabetical">A-Z</option>
            <option value="popular">Popular</option>
          </select>

          {lessonStatusFilters.map((statusOption) => (
            <label
              className="inline-flex min-h-8 shrink-0 items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-low px-3 text-[10px] font-semibold text-foreground sm:min-h-9 sm:px-3.5 sm:text-[11px]"
              htmlFor={`lesson-status-${statusOption.value}`}
              key={statusOption.value}
            >
              <input
                checked={selectedStatuses.includes(statusOption.value)}
                className="h-3.5 w-3.5 rounded border-outline-variant/80 bg-surface-highest accent-[var(--primary)]"
                id={`lesson-status-${statusOption.value}`}
                name={`lesson_status_${statusOption.value}`}
                onChange={() => onStatusToggle(statusOption.value)}
                type="checkbox"
              />
              <span>{statusOption.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-outline-variant/70 bg-surface-low px-3 text-[10px] font-bold text-muted transition hover:border-primary/20 hover:bg-surface-highest hover:text-foreground sm:min-h-9 sm:px-3.5 sm:text-[11px]"
        onClick={onReset}
        type="button"
      >
        Reset
      </button>
    </div>
  );
}

function ModuleSelector({
  isActive,
  module,
  onSelect,
}: {
  isActive: boolean;
  module: ModuleSnapshot;
  onSelect: () => void;
}) {
  const statusLabel = getDisplayStatus(module.progressLabel);

  return (
    <button
      aria-current={isActive ? "true" : undefined}
      className="learn-tv-watchlist-row min-h-[3.35rem] rounded-[0.68rem] px-3 py-2 text-left sm:min-h-[3.48rem] sm:px-3.25 sm:py-2.25"
      onClick={onSelect}
      type="button"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <p className="learn-tv-kicker shrink-0">{module.code}</p>
            <span className={getBoardStatusChipClass(statusLabel)}>{statusLabel}</span>
          </div>
          <p
            className={cn(
              "shrink-0 text-[10.5px] font-semibold leading-none learn-tv-tabular",
              getStatusTextClass(statusLabel),
            )}
          >
            {module.completedCount}/{module.totalLessons}
          </p>
        </div>
        <p className="truncate text-[0.92rem] font-semibold leading-[1.1] text-foreground">
          {module.title}
        </p>
      </div>
    </button>
  );
}

function LessonRow({
  entry,
  progressLabel,
}: {
  entry: LearnLessonEntry;
  progressLabel: string | null;
}) {
  const actionLabel = getLessonActionLabel(progressLabel);
  const statusLabel = getDisplayStatus(progressLabel);

  return (
    <div className="learn-tv-table-row px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="grid gap-3 grid-cols-[4.15rem_minmax(0,1fr)] lg:grid-cols-[5.5rem_minmax(0,1fr)_6rem_6rem_auto] lg:items-center">
        <div className="relative aspect-[5/4] overflow-hidden rounded-[0.9rem] border border-outline-variant/70 bg-surface-highest sm:aspect-[4/3]">
          <HubCardImage
            alt={entry.title}
            imageSrc={entry.imageSrc}
            seed={`${entry.moduleSlug}-${entry.slug}`}
            sizes="(min-width: 1024px) 9rem, 36vw"
          />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="learn-tv-chip">{entry.moduleTitle}</span>
            <span className="learn-tv-chip">{entry.topic}</span>
          </div>
          <h3 className="mt-1.5 break-words text-sm font-semibold tracking-tight text-foreground sm:mt-2 sm:text-[0.96rem]">
            {entry.title}
          </h3>
          <p className="mt-1 hidden text-[13px] leading-5 text-muted xl:block">{entry.summary}</p>
        </div>

        <div className="hidden gap-1 lg:grid">
          <p className="learn-tv-kicker">Level</p>
          <p className="text-sm font-medium text-foreground">{entry.level}</p>
        </div>

        <div className="hidden gap-1 lg:grid">
          <p className="learn-tv-kicker">Duration</p>
          <p className="text-sm font-medium text-foreground">{entry.duration}</p>
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 lg:col-span-1 lg:flex-col lg:items-end">
          <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted lg:hidden">{entry.level}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted lg:hidden">{entry.duration}</span>
            <p className={cn("text-xs font-semibold sm:text-sm", getStatusTextClass(statusLabel))}>
              {statusLabel}
            </p>
          </div>
          <Link className="btn-secondary min-h-8 px-3 py-1.5 text-[11px] sm:min-h-9 sm:px-3.5 sm:text-xs" href={entry.href}>
            {actionLabel}
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LearnHubClient({ modules }: { modules: LearnHubModule[] }) {
  const router = useRouter();
  const { state } = useLearnProgress();
  const activeModuleSectionRef = useRef<HTMLElement | null>(null);

  const [lessonTopic, setLessonTopic] = useState("All");
  const [lessonSort, setLessonSort] = useState<LessonSortValue>("recommended");
  const [lessonStatuses, setLessonStatuses] = useState<LessonStatusFilterValue[]>([
    "not_started",
    "in_progress",
    "completed",
  ]);
  const [lessonPage, setLessonPage] = useState(1);
  const [moduleQuery, setModuleQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<ModuleBoardFilterValue>("all");
  const [isSearchMenuOpen, setIsSearchMenuOpen] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [moduleBoardHeight, setModuleBoardHeight] = useState<number | null>(null);

  const orderedModules = useMemo(
    () => [...modules].sort((left, right) => left.releaseOrder - right.releaseOrder),
    [modules],
  );

  const continueLesson = getContinueLearningLesson(state, modules);

  const lessonEntries = useMemo<LearnLessonEntry[]>(
    () =>
      modules.flatMap((module) =>
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
      ),
    [modules],
  );

  const moduleSnapshots = useMemo<ModuleSnapshot[]>(
    () =>
      orderedModules.map((module) => {
        const completedCount = module.lessons.filter(
          (lesson) => getLessonProgress(state, module.slug, lesson.slug)?.status === "completed",
        ).length;
        const totalLessons = module.lessons.length;

        return {
          ...module,
          code: getModuleCode(module.slug),
          completedCount,
          completionPercent: getCompletionPercent(completedCount, totalLessons),
          progressLabel: formatProgress(getModuleProgressStatus(state, module)),
          totalLessons,
        };
      }),
    [orderedModules, state],
  );

  const featuredModule =
    moduleSnapshots.find((module) => module.featured) ?? moduleSnapshots[0] ?? null;

  const initialModuleIndex = useMemo(() => {
    if (continueLesson) {
      const continueIndex = moduleSnapshots.findIndex(
        (module) => module.slug === continueLesson.module.slug,
      );

      if (continueIndex >= 0) {
        return continueIndex;
      }
    }

    if (featuredModule) {
      const featuredIndex = moduleSnapshots.findIndex(
        (module) => module.slug === featuredModule.slug,
      );

      if (featuredIndex >= 0) {
        return featuredIndex;
      }
    }

    return 0;
  }, [continueLesson, featuredModule, moduleSnapshots]);

  const [activeModuleIndex, setActiveModuleIndex] = useState(initialModuleIndex);
  const hasManualModuleSelectionRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const lessonTopicOptions = useMemo(() => buildTopicOptions(lessonEntries), [lessonEntries]);
  const learnQuery = moduleQuery.trim().toLowerCase();
  const topicCounts = useMemo(() => {
    const nextCounts = new Map<string, number>();

    for (const entry of lessonEntries) {
      nextCounts.set(entry.topic, (nextCounts.get(entry.topic) ?? 0) + 1);
    }

    return nextCounts;
  }, [lessonEntries]);

  const filteredLessonEntries = useMemo(() => {
    if (lessonStatuses.length === 0) {
      return [];
    }

    const scopedEntries =
      lessonTopic === "All"
        ? lessonEntries
        : lessonEntries.filter((entry) => entry.topic === lessonTopic);

    const statusFilteredEntries = scopedEntries.filter((entry) =>
      lessonStatuses.includes(
        getLessonStatusFilterValue(
          formatProgress(getLessonProgress(state, entry.moduleSlug, entry.slug)?.status ?? null),
        ),
      ),
    );

    const queryFilteredEntries = statusFilteredEntries.filter((entry) =>
      matchesLearnQuery(learnQuery, [
        entry.title,
        entry.summary,
        entry.topic,
        entry.moduleTitle,
      ]),
    );

    return sortLessonEntries(queryFilteredEntries, lessonSort);
  }, [learnQuery, lessonEntries, lessonSort, lessonStatuses, lessonTopic, state]);

  const lessonTotalPages = Math.max(1, Math.ceil(filteredLessonEntries.length / ITEMS_PER_PAGE));
  const activeLessonPage = Math.min(lessonPage, lessonTotalPages);
  const paginatedLessons = filteredLessonEntries.slice(
    (activeLessonPage - 1) * ITEMS_PER_PAGE,
    activeLessonPage * ITEMS_PER_PAGE,
  );

  const continueLearningModule =
    continueLesson
      ? moduleSnapshots.find((module) => module.slug === continueLesson.module.slug) ?? null
      : featuredModule;
  const currentModuleSuggestion = moduleSnapshots[activeModuleIndex] ?? null;

  const searchSuggestions = useMemo(() => {
    const topicSuggestionValues = lessonTopicOptions.filter((topic) => topic !== "All");

    if (!learnQuery) {
      const lessonSuggestions = sortLessonEntries(lessonEntries, "recommended")
        .slice(0, 3)
        .map<SearchSuggestion>((entry) => ({
          id: `lesson:${entry.moduleSlug}:${entry.slug}`,
          kind: "lesson",
          label: entry.title,
          description: `${entry.moduleTitle} • ${entry.duration}`,
          href: entry.href,
        }));

      const moduleSuggestions = [currentModuleSuggestion, continueLearningModule, ...moduleSnapshots]
        .filter((module): module is ModuleSnapshot => Boolean(module))
        .filter(
          (module, index, allModules) =>
            allModules.findIndex((candidate) => candidate.slug === module.slug) === index,
        )
        .slice(0, 2)
        .map<SearchSuggestion>((module) => ({
          id: `module:${module.slug}`,
          kind: "module",
          label: module.title,
          description: `${module.topic} • ${module.totalLessons} lessons`,
          moduleIndex: moduleSnapshots.findIndex((entry) => entry.slug === module.slug),
        }));

      const topicSuggestions = topicSuggestionValues.slice(0, 2).map<SearchSuggestion>((topic) => ({
        id: `topic:${topic}`,
        kind: "topic",
        label: topic,
        description: `${topicCounts.get(topic) ?? 0} lessons`,
        topicValue: topic,
      }));

      return {
        lessons: lessonSuggestions,
        modules: moduleSuggestions,
        topics: topicSuggestions,
      };
    }

    const lessonSuggestions = lessonEntries
      .map((entry) => ({
        entry,
        score: getQueryMatchScore(learnQuery, [
          entry.title,
          entry.summary,
          entry.topic,
          entry.moduleTitle,
        ]),
      }))
      .filter(({ score }) => score >= 0)
      .sort((left, right) => right.score - left.score || left.entry.lessonOrder - right.entry.lessonOrder)
      .slice(0, 3)
      .map<SearchSuggestion>(({ entry }) => ({
        id: `lesson:${entry.moduleSlug}:${entry.slug}`,
        kind: "lesson",
        label: entry.title,
        description: `${entry.moduleTitle} • ${entry.duration}`,
        href: entry.href,
      }));

    const moduleSuggestions = moduleSnapshots
      .map((module, index) => ({
        module,
        index,
        score: Math.max(
          getQueryMatchScore(learnQuery, [module.title, module.topic, module.code]),
          module.lessons.some((lesson) =>
            matchesLearnQuery(learnQuery, [lesson.title, lesson.summary, lesson.topic]),
          )
            ? 180
            : -1,
        ),
      }))
      .filter(({ score }) => score >= 0)
      .sort((left, right) => right.score - left.score || left.index - right.index)
      .slice(0, 2)
      .map<SearchSuggestion>(({ module, index }) => ({
        id: `module:${module.slug}`,
        kind: "module",
        label: module.title,
        description: `${module.topic} • ${module.totalLessons} lessons`,
        moduleIndex: index,
      }));

    const topicSuggestions = topicSuggestionValues
      .map((topic) => ({
        topic,
        score: getQueryMatchScore(learnQuery, [topic]),
      }))
      .filter(({ score }) => score >= 0)
      .sort((left, right) => right.score - left.score || left.topic.localeCompare(right.topic))
      .slice(0, 2)
      .map<SearchSuggestion>(({ topic }) => ({
        id: `topic:${topic}`,
        kind: "topic",
        label: topic,
        description: `${topicCounts.get(topic) ?? 0} lessons`,
        topicValue: topic,
      }));

    return {
      lessons: lessonSuggestions,
      modules: moduleSuggestions,
      topics: topicSuggestions,
    };
  }, [
    continueLearningModule,
    currentModuleSuggestion,
    learnQuery,
    lessonEntries,
    lessonTopicOptions,
    moduleSnapshots,
    topicCounts,
  ]);
  const flatSearchSuggestions = useMemo(
    () => [
      ...searchSuggestions.lessons,
      ...searchSuggestions.modules,
      ...searchSuggestions.topics,
    ],
    [searchSuggestions],
  );
  const resolvedHighlightedSuggestionIndex =
    flatSearchSuggestions.length === 0
      ? 0
      : Math.min(highlightedSuggestionIndex, flatSearchSuggestions.length - 1);

  const moduleBoardEntries = useMemo(() => {
    return moduleSnapshots
      .map((module, index) => ({ module, index }))
      .filter(({ module }) => matchesBoardFilter(module.progressLabel, moduleFilter))
      .filter(({ module }) => {
        if (!learnQuery) {
          return true;
        }

        if (matchesLearnQuery(learnQuery, [module.title, module.topic, module.code])) {
          return true;
        }

        return module.lessons.some((lesson) =>
          matchesLearnQuery(learnQuery, [lesson.title, lesson.summary, lesson.topic]),
        );
      });
  }, [learnQuery, moduleFilter, moduleSnapshots]);

  const resolvedActiveModuleIndex =
    moduleBoardEntries.length > 0 &&
    !moduleBoardEntries.some(({ index }) => index === activeModuleIndex)
      ? moduleBoardEntries[0].index
      : activeModuleIndex;
  const activeModule = moduleSnapshots[resolvedActiveModuleIndex] ?? null;
  const activeModuleNextLesson = activeModule ? getModuleNextLesson(activeModule, state) : null;
  const activeModulePrimaryAction =
    activeModule && activeModuleNextLesson
      ? getModulePrimaryAction(activeModule, activeModuleNextLesson, state)
      : activeModule
        ? getModulePrimaryAction(activeModule, null, state)
        : null;

  useEffect(() => {
    setActiveModuleIndex((current) => {
      const maxIndex = Math.max(0, moduleSnapshots.length - 1);
      const clampedCurrent = Math.min(current, maxIndex);

      if (!hasManualModuleSelectionRef.current && clampedCurrent !== initialModuleIndex) {
        return initialModuleIndex;
      }

      return clampedCurrent;
    });
  }, [initialModuleIndex, moduleSnapshots.length]);

  const setActiveModuleFromUser = (nextIndex: number) => {
    hasManualModuleSelectionRef.current = true;
    setActiveModuleIndex(nextIndex);
  };

  const applySearchSuggestion = (suggestion: SearchSuggestion) => {
    setIsSearchMenuOpen(false);

    if (suggestion.kind === "lesson" && suggestion.href) {
      router.push(suggestion.href);
      return;
    }

    if (suggestion.kind === "module" && typeof suggestion.moduleIndex === "number") {
      setActiveModuleFromUser(suggestion.moduleIndex);
      return;
    }

    if (suggestion.kind === "topic" && suggestion.topicValue) {
      setModuleQuery(suggestion.topicValue);
      setLessonTopic(suggestion.topicValue);
      setLessonPage(1);
    }
  };

  useEffect(() => {
    if (!isSearchMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setIsSearchMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isSearchMenuOpen]);

  useEffect(() => {
    const section = activeModuleSectionRef.current;

    if (!section || typeof window === "undefined") {
      return;
    }

    const syncHeight = () => {
      setModuleBoardHeight(Math.round(section.getBoundingClientRect().height));
    };

    const frame = window.requestAnimationFrame(syncHeight);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const observer = new ResizeObserver(() => {
      syncHeight();
    });

    observer.observe(section);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeModule?.slug, moduleBoardEntries.length]);

  return (
    <div className="learn-tv-screen learn-tv-screen--flat space-y-3.5 pb-5 sm:space-y-4 sm:pb-7">
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="relative" ref={searchContainerRef}>
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              strokeWidth={2}
            />
            <input
              autoComplete="off"
              className="h-9 w-full rounded-[0.8rem] border border-outline-variant/70 bg-surface-low py-2 pl-9 pr-3 text-[12px] text-foreground outline-none placeholder:text-muted focus:border-primary/20 sm:h-10 sm:pl-10 sm:text-[13px]"
              id="module-search"
              name="module_search"
              onChange={(event) => {
                setModuleQuery(event.target.value);
                setIsSearchMenuOpen(true);
              }}
              onFocus={() => setIsSearchMenuOpen(true)}
              onKeyDown={(event) => {
                if (!flatSearchSuggestions.length) {
                  if (event.key === "Escape") {
                    setIsSearchMenuOpen(false);
                  }
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setIsSearchMenuOpen(true);
                  setHighlightedSuggestionIndex((current) =>
                    current + 1 >= flatSearchSuggestions.length ? 0 : current + 1,
                  );
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setIsSearchMenuOpen(true);
                  setHighlightedSuggestionIndex((current) =>
                    current - 1 < 0 ? flatSearchSuggestions.length - 1 : current - 1,
                  );
                  return;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearchSuggestion(flatSearchSuggestions[resolvedHighlightedSuggestionIndex]);
                  return;
                }

                if (event.key === "Escape") {
                  setIsSearchMenuOpen(false);
                }
              }}
              placeholder="Search modules, lessons, or topics..."
              type="text"
              value={moduleQuery}
            />
          </label>

          {isSearchMenuOpen ? (
            <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[0.9rem] border border-outline-variant/70 bg-[rgba(14,15,18,0.98)] shadow-[0_18px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl">
              {flatSearchSuggestions.length === 0 ? (
                <div className="px-3.5 py-3 text-sm text-muted">
                  No matching lessons, modules, or topics.
                </div>
              ) : (
                <div className="max-h-[22rem] overflow-y-auto py-2">
                  {[
                    { title: learnQuery ? "Lessons" : "Suggested lessons", items: searchSuggestions.lessons },
                    { title: "Modules", items: searchSuggestions.modules },
                    { title: "Topics", items: searchSuggestions.topics },
                  ].map((group) =>
                    group.items.length > 0 ? (
                      <div className="px-2 pb-1.5" key={group.title}>
                        <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {group.title}
                        </p>
                        <div className="space-y-1">
                          {group.items.map((suggestion) => {
                            const suggestionIndex = flatSearchSuggestions.findIndex(
                              (item) => item.id === suggestion.id,
                            );
                            const isHighlighted =
                              suggestionIndex === resolvedHighlightedSuggestionIndex;

                            return (
                              <button
                                className={cn(
                                  "flex w-full items-start justify-between gap-3 rounded-[0.75rem] px-2 py-2 text-left transition",
                                  isHighlighted
                                    ? "bg-white/[0.05] text-foreground"
                                    : "text-foreground hover:bg-white/[0.035]",
                                )}
                                key={suggestion.id}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  applySearchSuggestion(suggestion);
                                }}
                                onMouseEnter={() => setHighlightedSuggestionIndex(suggestionIndex)}
                                type="button"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-[12px] font-semibold text-foreground sm:text-[13px]">
                                    {suggestion.label}
                                  </p>
                                  <p className="mt-0.5 truncate text-[11px] text-muted">
                                    {suggestion.description}
                                  </p>
                                </div>
                                <span className="learn-tv-chip shrink-0 px-2 py-0.5 text-[0.55rem] tracking-[0.14em]">
                                  {suggestion.kind}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <select
          aria-label="Filter modules by status"
          className="min-h-9 rounded-[0.8rem] border border-outline-variant/70 bg-surface-low px-3 text-[12px] font-semibold text-foreground outline-none transition hover:bg-surface-highest focus:border-primary/20 sm:min-h-10 sm:px-3.5 sm:text-[13px]"
          id="module-status-filter"
          name="module_status_filter"
          onChange={(event) =>
            setModuleFilter(event.target.value as ModuleBoardFilterValue)
          }
          value={moduleFilter}
        >
          {moduleBoardFilters.map((filterOption) => (
            <option key={filterOption.value} value={filterOption.value}>
              {filterOption.value === "all" ? "All modules" : filterOption.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_17.25rem] xl:items-start">
        <div className="space-y-3.5">
          {activeModule ? (
            <section
              className="learn-tv-frame overflow-hidden rounded-[0.9rem]"
              ref={activeModuleSectionRef}
            >
              <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(268px,0.95fr)]">
                <div className="flex h-full min-w-0 flex-col justify-between gap-3 p-3 sm:p-3.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="learn-tv-chip learn-tv-chip--active">Selected module</span>
                      <span className={getStatusChipClass(getDisplayStatus(activeModule.progressLabel))}>
                        {getDisplayStatus(activeModule.progressLabel)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 sm:mt-3.5 sm:space-y-2">
                      <p className="learn-tv-kicker">
                        {activeModule.code} • {activeModule.topic}
                      </p>
                      <h2 className="break-words font-heading text-[1.34rem] font-extrabold leading-[1.02] tracking-tight text-foreground sm:text-[2.02rem]">
                        {activeModule.title}
                      </h2>
                      <p className="max-w-[31rem] text-[12.5px] leading-5 text-[#b3b7c2] sm:text-[14px] sm:leading-6">
                        {activeModule.description}
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-2.5 border-y border-outline-variant/70 py-2 sm:mt-6 sm:grid-cols-3 sm:gap-3 sm:py-2.5">
                      <div className="min-w-0">
                        <p className="learn-tv-kicker">Topic</p>
                        <p className="mt-1 text-[14px] font-semibold text-foreground sm:text-[15px]">
                          {activeModule.topic}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="learn-tv-kicker">Duration</p>
                        <p className="mt-1 text-[14px] font-semibold text-foreground sm:text-[15px]">
                          {activeModule.duration}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="learn-tv-kicker">Progress</p>
                        <p
                          className={cn(
                            "mt-1 text-[14px] font-semibold sm:text-[15px]",
                            getStatusTextClass(getDisplayStatus(activeModule.progressLabel)),
                          )}
                        >
                          {activeModule.completedCount}/{activeModule.totalLessons} complete
                        </p>
                      </div>
                    </div>
                  </div>

                  {activeModulePrimaryAction ? (
                    <div className="border-t border-outline-variant/70 pt-2.5 sm:pt-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 sm:max-w-[16rem]">
                          <p className="learn-tv-kicker">{activeModulePrimaryAction.detailLabel}</p>
                          <p className="mt-1 break-words text-[13px] font-semibold text-foreground sm:text-sm">
                            {activeModulePrimaryAction.detailValue}
                          </p>
                          <p className="mt-1 text-[11px] text-muted sm:text-xs">
                            {activeModuleNextLesson
                              ? `Lesson ${String(activeModuleNextLesson.order).padStart(2, "0")} • ${activeModuleNextLesson.duration}`
                              : `${activeModule.totalLessons} lessons in this module`}
                          </p>
                        </div>

                        <Link
                          className="btn-primary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-9 sm:w-auto sm:px-4 sm:text-sm"
                          href={activeModulePrimaryAction.href}
                        >
                          {activeModulePrimaryAction.label}
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-outline-variant/70 lg:border-l lg:border-t-0">
                  <div className="relative min-h-[104px] overflow-hidden bg-surface-highest sm:min-h-[146px]">
                    <HubCardImage
                      alt={activeModule.title}
                      eager
                      imageSrc={activeModule.imageSrc}
                      seed={activeModule.slug}
                      sizes="(min-width: 1280px) 34vw, (min-width: 768px) 48vw, 100vw"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,13,20,0.08),rgba(10,13,20,0.76))]" />
                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-3 sm:p-3.5">
                      <div className="min-w-0">
                        <p className="learn-tv-kicker text-white/66">Module view</p>
                        <p className="mt-1 break-words text-sm font-semibold text-white/92 sm:text-[0.95rem]">
                          {activeModule.title}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="learn-tv-kicker text-white/66">Completion</p>
                        <p
                          className={cn(
                            "mt-1 text-[0.95rem] font-semibold text-white/92 sm:text-base",
                            getStatusTextClass(getDisplayStatus(activeModule.progressLabel)),
                          )}
                        >
                          {activeModule.completionPercent}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 sm:px-3.5 sm:py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="learn-tv-kicker">Module lessons</p>
                      </div>
                      <p className="shrink-0 text-xs font-semibold learn-tv-tabular text-muted">
                        {activeModule.totalLessons} lessons
                      </p>
                    </div>

                    <div className="mt-1.5 divide-y divide-outline-variant/60">
                      {activeModule.lessons.map((lesson) => {
                        const statusLabel = getDisplayStatus(
                          formatProgress(
                            getLessonProgress(state, activeModule.slug, lesson.slug)?.status ??
                              null,
                          ),
                        );

                        return (
                          <Link
                            className="block px-0 py-1.5 transition hover:bg-surface-highest/30"
                            href={`/app/learn/${activeModule.slug}/${lesson.slug}`}
                            key={lesson.slug}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="learn-tv-kicker">
                                    {String(lesson.order).padStart(2, "0")}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-[11px] font-semibold uppercase tracking-[0.16em]",
                                      getStatusTextClass(statusLabel),
                                    )}
                                  >
                                    {statusLabel}
                                  </span>
                                </div>
                                <p className="mt-1 break-words text-[13px] font-semibold text-foreground sm:text-sm">
                                  {lesson.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-muted">{lesson.duration}</p>
                              </div>
                              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="xl:self-start">
          <section
            className="learn-tv-frame flex flex-col overflow-hidden rounded-[0.9rem]"
            style={moduleBoardHeight ? { height: `${moduleBoardHeight}px` } : undefined}
          >
            <div className="border-b border-outline-variant/70 px-3 py-2.5 text-center sm:px-3.5 sm:py-3">
              <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                Module board
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 pr-2 sm:px-3.5 sm:py-2.5 sm:pr-2.5">
              <div className="space-y-1.5">
              {moduleBoardEntries.length === 0 ? (
                <div className="rounded-[0.9rem] border border-outline-variant/70 bg-surface-low px-4 py-4 text-sm text-muted">
                  No modules match that search right now.
                </div>
              ) : (
                moduleBoardEntries.map(({ module, index }) => (
                  <ModuleSelector
                    isActive={index === resolvedActiveModuleIndex}
                    key={module.slug}
                    module={module}
                    onSelect={() => setActiveModuleFromUser(index)}
                  />
                ))
              )}
              </div>
            </div>

          </section>

        </aside>
      </div>

      <section className="learn-tv-panel overflow-hidden rounded-[0.9rem]">
        <div className="grid gap-3 border-b border-outline-variant/70 px-3.5 py-3 lg:grid-cols-[minmax(12.5rem,15rem)_minmax(0,1fr)] lg:items-end sm:px-4 sm:py-3.5">
          <div className="min-w-0 pr-2">
            <p className="learn-tv-kicker text-[0.58rem] tracking-[0.18em]">Lesson library</p>
            <h2 className="mt-1 font-heading text-[1.14rem] font-extrabold tracking-tight text-foreground sm:text-[1.3rem]">
              All lessons
            </h2>
          </div>

          <FilterControls
            onReset={() => {
              setLessonTopic("All");
              setLessonSort("recommended");
              setLessonStatuses(["not_started", "in_progress", "completed"]);
              setLessonPage(1);
            }}
            onSortChange={(value) => {
              setLessonSort(value);
              setLessonPage(1);
            }}
            onStatusToggle={(value) => {
              setLessonStatuses((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value],
              );
              setLessonPage(1);
            }}
            onTopicChange={(value) => {
              setLessonTopic(value);
              setLessonPage(1);
            }}
            selectedStatuses={lessonStatuses}
            selectedTopic={lessonTopic}
            sortBy={lessonSort}
            topicOptions={lessonTopicOptions}
          />
        </div>

        {paginatedLessons.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted">
            {lessonStatuses.length === 0
              ? "Select at least one lesson status to show results."
              : "No lessons match those filters right now."}
          </div>
        ) : (
          <div>
            {paginatedLessons.map((entry) => (
              <LessonRow
                entry={entry}
                key={`lesson:${entry.moduleSlug}:${entry.slug}`}
                progressLabel={formatProgress(
                  getLessonProgress(state, entry.moduleSlug, entry.slug)?.status ?? null,
                )}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={activeLessonPage}
          onPageChange={setLessonPage}
          totalPages={lessonTotalPages}
        />
      </section>
    </div>
  );
}
