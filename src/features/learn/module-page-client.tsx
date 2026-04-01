"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { isModuleBookmarked } from "@/features/learn/bookmark-state";
import { BookmarkButton } from "@/features/learn/bookmark-button";
import {
  BookmarkFeedbackToast,
  useBookmarkFeedback,
} from "@/features/learn/bookmark-feedback";
import { LearnDetailHeader } from "@/features/learn/components/learn-detail-header";
import {
  getLessonProgress,
  getModuleProgressStatus,
} from "@/features/learn/progress-state";
import {
  formatProgressStatus,
  getCompletionPercent,
  getDisplayStatus,
  getLessonActionLabel,
} from "@/features/learn/learn-shared";
import { useLearnProgress } from "@/features/learn/learn-progress-provider";
import { cn } from "@/lib/utils";
import type { LessonFrontmatter, ModuleSummary } from "@/types/content";

type ModulePageClientProps = {
  learningModule: ModuleSummary;
  lessons: LessonFrontmatter[];
};

export function ModulePageClient({
  learningModule,
  lessons,
}: ModulePageClientProps) {
  const { bookmarkState, setModuleBookmarked, state } = useLearnProgress();
  const { pushToast, toast } = useBookmarkFeedback();
  const moduleStatus = formatProgressStatus(
    getModuleProgressStatus(state, {
      slug: learningModule.slug,
      title: learningModule.title,
      lessons,
    }),
  );

  const completedCount = lessons.filter(
    (lesson) => getLessonProgress(state, learningModule.slug, lesson.slug)?.status === "completed",
  ).length;
  const completionPercent = getCompletionPercent(completedCount, lessons.length);

  const nextLesson =
    lessons.find(
      (lesson) =>
        getLessonProgress(state, learningModule.slug, lesson.slug)?.status !== "completed",
    ) ??
    lessons[0] ??
    null;

  const nextLessonStatus = nextLesson
    ? formatProgressStatus(
        getLessonProgress(state, learningModule.slug, nextLesson.slug)?.status ?? null,
      )
    : null;
  const primaryActionLabel =
    moduleStatus === "Completed"
      ? "Review module"
      : nextLessonStatus === "In Progress"
        ? "Resume lesson"
        : moduleStatus === "In Progress"
          ? "Continue module"
          : "Start module";

  return (
    <div className="learn-tv-screen space-y-3.5 pb-5 sm:space-y-4 sm:pb-7">
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_17.25rem]">
        <section className="learn-tv-panel rounded-[0.9rem] overflow-hidden">
          <div className="bg-surface-high">
            <LearnDetailHeader
              action={
                <BookmarkButton
                  active={isModuleBookmarked(bookmarkState, learningModule.slug)}
                  className="shrink-0"
                  label={
                    isModuleBookmarked(bookmarkState, learningModule.slug)
                      ? `Remove ${learningModule.title} bookmark`
                      : `Bookmark ${learningModule.title}`
                  }
                  onClick={() => {
                    const nextValue = !isModuleBookmarked(bookmarkState, learningModule.slug);
                    setModuleBookmarked(learningModule.slug, nextValue);
                    pushToast(
                      nextValue
                        ? "Added module to bookmarks"
                        : "Removed module from bookmarks",
                    );
                  }}
                  size="md"
                />
              }
              backHref="/app/learn"
              backLabel="Learn"
              kicker="Module view"
              statusLabel={getDisplayStatus(moduleStatus)}
              summary={learningModule.description}
              title={learningModule.title}
              trailItems={[learningModule.topic]}
            >
              <div className="grid grid-cols-1 gap-3 border-y border-outline-variant/70 py-3 sm:grid-cols-3 sm:gap-4 sm:py-3.5">
              <div className="min-w-0">
                <p className="learn-tv-kicker">Duration</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{learningModule.duration}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Lessons</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{lessons.length}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Completion</p>
                <p
                  className={cn(
                    "mt-1 text-[13px] font-semibold",
                    completedCount === lessons.length && lessons.length > 0
                      ? "learn-tv-positive"
                      : completedCount > 0
                        ? "text-primary"
                        : "text-foreground",
                  )}
                >
                  {completionPercent}% complete
                </p>
              </div>
              </div>
            </LearnDetailHeader>

            <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5">
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <p className="learn-tv-kicker">{nextLesson ? "Next lesson" : "Module status"}</p>
                <p className="mt-1.5 break-words text-[13px] font-semibold text-foreground sm:text-sm">
                  {nextLesson ? nextLesson.title : getDisplayStatus(moduleStatus)}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                {nextLesson ? (
                  <Link
                    className="btn-primary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
                    href={`/app/learn/${learningModule.slug}/${nextLesson.slug}`}
                  >
                    {primaryActionLabel}
                  </Link>
                ) : null}
                <Link
                  className="btn-secondary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
                  href="/app/quiz"
                >
                  View quizzes
                </Link>
              </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-3.5">
          <div className="learn-tv-panel learn-tv-panel-muted rounded-[0.9rem] p-3 sm:p-3.5">
            <p className="learn-tv-kicker">Next step</p>
            {nextLesson ? (
              <>
                <p className="mt-2 break-words text-[13px] font-semibold text-foreground sm:text-sm">
                  {nextLesson.title}
                </p>
                <p className="mt-1.5 text-[12px] leading-5 text-muted sm:text-[13px] sm:leading-6">
                  {nextLesson.summary}
                </p>
                <div className="mt-3">
                  <Link
                    className="btn-secondary min-h-8 w-full px-3 py-1.5 text-[11px] sm:min-h-9 sm:text-xs"
                    href={`/app/learn/${learningModule.slug}/${nextLesson.slug}`}
                  >
                    {getLessonActionLabel(nextLessonStatus)}
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">No lessons available yet.</p>
            )}
          </div>

          <div className="learn-tv-panel rounded-[0.9rem] p-3 sm:p-3.5">
            <p className="learn-tv-kicker">Progress</p>
            <p
              className={cn(
                "mt-2 text-[13px] font-semibold sm:text-sm",
                moduleStatus === "Completed"
                  ? "learn-tv-positive"
                  : moduleStatus === "In Progress"
                    ? "text-primary"
                    : "text-foreground",
              )}
            >
              {getDisplayStatus(moduleStatus)}
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-muted sm:text-[13px] sm:leading-6">
              {completedCount}/{lessons.length} lessons complete
            </p>
          </div>
        </aside>
      </div>

      <section className="learn-tv-panel overflow-hidden rounded-[0.9rem]">
        <div className="flex flex-col gap-2.5 border-b border-outline-variant/70 px-3.5 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-4 sm:py-3.5">
          <div>
            <p className="learn-tv-kicker">Study sequence</p>
            <h2 className="mt-1 font-heading text-[1.08rem] font-extrabold tracking-tight text-foreground sm:text-[1.25rem]">
              Lesson ladder
            </h2>
          </div>
          <p className="text-xs text-muted">
            {completedCount}/{lessons.length} complete
          </p>
        </div>

        <div>
          {lessons.map((lesson) => {
            const lessonStatus = getLessonProgress(state, learningModule.slug, lesson.slug);
            const statusLabel = formatProgressStatus(lessonStatus?.status ?? null);

            return (
              <Link
                className="learn-tv-table-row block px-3.5 py-3 sm:px-4 sm:py-3.5"
                href={`/app/learn/${learningModule.slug}/${lesson.slug}`}
                key={lesson.slug}
              >
                <div className="grid gap-2.5 md:grid-cols-[4.5rem_minmax(0,1fr)_6.25rem_5.75rem_auto] md:items-center md:gap-3">
                  <div className="flex items-center gap-2 md:block">
                    <span className="learn-tv-kicker">
                      {String(lesson.order).padStart(2, "0")}
                    </span>
                    <p
                      className={cn(
                        "text-xs font-semibold md:hidden",
                        statusLabel === "Completed"
                          ? "learn-tv-positive"
                          : statusLabel === "In Progress"
                            ? "text-primary"
                            : "text-muted",
                      )}
                    >
                      {getDisplayStatus(statusLabel)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-foreground sm:text-[0.96rem]">
                      {lesson.title}
                    </p>
                    <p className="mt-1 hidden text-[13px] leading-5 text-muted lg:block">
                      {lesson.summary}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-3 md:hidden">
                      <p className="text-[11px] font-medium text-muted">{lesson.duration}</p>
                      <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-foreground">
                        {getLessonActionLabel(statusLabel)}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </span>
                    </div>
                  </div>

                  <p
                    className={cn(
                      "hidden text-sm font-semibold md:block",
                      statusLabel === "Completed"
                        ? "learn-tv-positive"
                        : statusLabel === "In Progress"
                          ? "text-primary"
                          : "text-muted",
                    )}
                  >
                    {getDisplayStatus(statusLabel)}
                  </p>

                  <p className="hidden text-sm font-medium text-foreground md:block">
                    {lesson.duration}
                  </p>

                  <div className="hidden md:flex md:items-center md:justify-end md:gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                      {getLessonActionLabel(statusLabel)}
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <BookmarkFeedbackToast toast={toast} />
    </div>
  );
}
