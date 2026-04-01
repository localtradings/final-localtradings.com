import type { LessonFrontmatter, ModuleSummary } from "@/types/content";
import type { LearnProgressLabel } from "@/features/learn/learn-shared";

export type LearnHubModule = ModuleSummary & {
  lessons: LessonFrontmatter[];
};

export type LearnLessonEntry = {
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

export type ModuleSnapshot = LearnHubModule & {
  code: string;
  completedCount: number;
  completionPercent: number;
  progressLabel: LearnProgressLabel;
  totalLessons: number;
};

export type LessonSortValue = "recommended" | "newest" | "alphabetical" | "popular";
export type LessonStatusFilterValue = "not_started" | "in_progress" | "completed";
export type ModuleBoardFilterValue = "all" | "not_started" | "in_progress" | "completed";

export type ModulePrimaryAction = {
  href: string;
  label: string;
  detailLabel: string;
  detailValue: string;
};

export type SearchSuggestion = {
  id: string;
  kind: "lesson" | "module" | "topic";
  label: string;
  description: string;
  href?: string;
  moduleIndex?: number;
  topicValue?: string;
};

export type BookmarkRailItem =
  | {
      id: string;
      kind: "module";
      href: string;
      label: string;
      meta: string;
      sortValue: string;
      summary: string;
    }
  | {
      id: string;
      kind: "lesson";
      href: string;
      label: string;
      meta: string;
      sortValue: string;
      summary: string;
    };
