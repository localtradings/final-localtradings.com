"use client";

import { isLessonBookmarked, type LearnBookmarkState } from "@/features/learn/bookmark-state";
import {
  FilterControls,
  LessonRow,
  Pagination,
} from "@/features/learn/components/learn-hub-primitives";
import type {
  LearnLessonEntry,
  LessonSortValue,
  LessonStatusFilterValue,
} from "@/features/learn/learn-hub-types";
import { formatProgressStatus } from "@/features/learn/learn-shared";
import type { LearnProgressState } from "@/features/learn/progress-state";
import { getLessonProgress } from "@/features/learn/progress-state";

export function LearnHubLessonLibrarySection({
  activeLessonPage,
  bookmarkState,
  lessonSort,
  lessonStatuses,
  lessonTopic,
  lessonTopicOptions,
  lessonTotalPages,
  onLessonBookmarkToggle,
  onLessonPageChange,
  onLessonSortChange,
  onLessonStatusToggle,
  onLessonTopicChange,
  onReset,
  paginatedLessons,
  state,
}: {
  activeLessonPage: number;
  bookmarkState: LearnBookmarkState;
  lessonSort: LessonSortValue;
  lessonStatuses: LessonStatusFilterValue[];
  lessonTopic: string;
  lessonTopicOptions: string[];
  lessonTotalPages: number;
  onLessonBookmarkToggle: (
    moduleSlug: string,
    lessonSlug: string,
    bookmarked: boolean,
  ) => void;
  onLessonPageChange: (page: number) => void;
  onLessonSortChange: (value: LessonSortValue) => void;
  onLessonStatusToggle: (value: LessonStatusFilterValue) => void;
  onLessonTopicChange: (value: string) => void;
  onReset: () => void;
  paginatedLessons: LearnLessonEntry[];
  state: LearnProgressState;
}) {
  return (
    <section className="learn-tv-panel overflow-hidden rounded-[0.9rem]">
      <div className="grid gap-3 border-b border-outline-variant/70 px-3.5 py-3 lg:grid-cols-[minmax(12.5rem,15rem)_minmax(0,1fr)] lg:items-end sm:px-4 sm:py-3.5">
        <div className="min-w-0 pr-2">
          <p className="learn-tv-kicker text-[0.58rem] tracking-[0.18em]">Lesson library</p>
          <h2 className="mt-1 font-heading text-[1.14rem] font-extrabold tracking-tight text-foreground sm:text-[1.3rem]">
            All lessons
          </h2>
        </div>

        <FilterControls
          onReset={onReset}
          onSortChange={onLessonSortChange}
          onStatusToggle={onLessonStatusToggle}
          onTopicChange={onLessonTopicChange}
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
              isBookmarked={isLessonBookmarked(bookmarkState, entry.moduleSlug, entry.slug)}
              key={`lesson:${entry.moduleSlug}:${entry.slug}`}
              onBookmarkToggle={() =>
                onLessonBookmarkToggle(
                  entry.moduleSlug,
                  entry.slug,
                  !isLessonBookmarked(bookmarkState, entry.moduleSlug, entry.slug),
                )
              }
              progressLabel={formatProgressStatus(
                getLessonProgress(state, entry.moduleSlug, entry.slug)?.status ?? null,
              )}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={activeLessonPage}
        onPageChange={onLessonPageChange}
        totalPages={lessonTotalPages}
      />
    </section>
  );
}
