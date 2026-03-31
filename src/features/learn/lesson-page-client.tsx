"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { isLessonBookmarked } from "@/features/learn/bookmark-state";
import { BookmarkButton } from "@/features/learn/bookmark-button";
import {
  BookmarkFeedbackToast,
  useBookmarkFeedback,
} from "@/features/learn/bookmark-feedback";
import { getLessonProgress } from "@/features/learn/progress-state";
import { useLearnProgress } from "@/features/learn/learn-progress-provider";
import { cn } from "@/lib/utils";
import type { LessonFrontmatter, ModuleSummary } from "@/types/content";

type LessonPageClientProps = {
  learningModule: ModuleSummary;
  lesson: LessonFrontmatter;
  lessons: LessonFrontmatter[];
  children: ReactNode;
};

function formatStatus(status: "in_progress" | "completed" | null) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "in_progress") {
    return "In Progress";
  }

  return null;
}

function getDisplayStatus(status: "In Progress" | "Completed" | null) {
  return status ?? "Not started";
}

export function LessonPageClient({
  learningModule,
  lesson,
  lessons,
  children,
}: LessonPageClientProps) {
  const {
    bookmarkState,
    markLessonCompleted,
    markLessonOpened,
    setLessonBookmarked,
    state,
  } = useLearnProgress();
  const { pushToast, toast } = useBookmarkFeedback();

  useEffect(() => {
    markLessonOpened({
      moduleSlug: learningModule.slug,
      lessonSlug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
    });
  }, [
    learningModule.slug,
    lesson.slug,
    lesson.summary,
    lesson.title,
    markLessonOpened,
  ]);

  const currentProgress = getLessonProgress(state, learningModule.slug, lesson.slug);
  const currentStatus = formatStatus(currentProgress?.status ?? null);
  const lessonBookmarked = isLessonBookmarked(bookmarkState, learningModule.slug, lesson.slug);

  return (
    <div className="learn-tv-screen space-y-3.5 pb-5 sm:space-y-4 sm:pb-7">
      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_17.25rem]">
        <article className="learn-tv-panel overflow-hidden rounded-[0.9rem]">
          <div className="border-b border-outline-variant/70 px-3.5 py-3.5 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted sm:gap-3 sm:text-sm">
              <Link
                className="inline-flex items-center gap-2 font-semibold text-foreground transition hover:text-primary"
                href={`/app/learn/${learningModule.slug}`}
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                {learningModule.title}
              </Link>
              <span className="text-outline">/</span>
              <span>Lesson {lesson.order}</span>
              {currentStatus ? (
                <>
                  <span className="text-outline">/</span>
                  <span
                    className={cn(
                      currentStatus === "Completed" ? "learn-tv-positive" : "text-primary",
                    )}
                  >
                    {currentStatus}
                  </span>
                </>
              ) : null}
            </div>

            <div className="mt-3.5 sm:mt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 sm:space-y-2.5">
                  <p className="learn-tv-kicker">Lesson view</p>
                  <h1 className="break-words font-heading text-[1.35rem] font-extrabold leading-[1.06] tracking-tight text-foreground sm:text-[2.15rem]">
                    {lesson.title}
                  </h1>
                  <p className="max-w-[38rem] text-[12px] leading-5 text-[#b3b7c2] sm:text-[13px] sm:leading-6">
                    {lesson.summary}
                  </p>
                </div>

                <div className="flex shrink-0 items-center">
                  <BookmarkButton
                    active={lessonBookmarked}
                    label={
                      lessonBookmarked
                        ? `Remove ${lesson.title} bookmark`
                        : `Bookmark ${lesson.title}`
                    }
                    onClick={() => {
                      const nextValue = !lessonBookmarked;
                      setLessonBookmarked(learningModule.slug, lesson.slug, nextValue);
                      pushToast(
                        nextValue
                          ? "Added lesson to bookmarks"
                          : "Removed lesson from bookmarks",
                      );
                    }}
                    size="md"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-y border-outline-variant/70 py-3 sm:grid-cols-5 sm:gap-4 sm:py-3.5">
              <div className="min-w-0">
                <p className="learn-tv-kicker">Module</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{learningModule.title}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Topic</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{lesson.topic}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Duration</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{lesson.duration}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Level</p>
                <p className="mt-1 text-[13px] font-semibold text-foreground">{learningModule.level}</p>
              </div>
              <div className="min-w-0">
                <p className="learn-tv-kicker">Status</p>
                <p
                  className={cn(
                    "mt-1 text-[13px] font-semibold",
                    currentStatus === "Completed"
                      ? "learn-tv-positive"
                      : currentStatus === "In Progress"
                        ? "text-primary"
                      : "text-foreground",
                  )}
                >
                  {getDisplayStatus(currentStatus)}
                </p>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-3.5 sm:px-5 sm:py-5">
            <div className="prose-localtradings max-w-none">{children}</div>
          </div>

          <div className="border-t border-outline-variant/70 px-3.5 py-3.5 sm:px-5 sm:py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                className={
                  currentStatus === "Completed"
                    ? "inline-flex min-h-9 w-full items-center justify-center rounded-[var(--radius-md)] border border-success/20 bg-success/12 px-4 text-xs font-semibold text-success sm:min-h-10 sm:w-auto sm:text-sm"
                    : "btn-primary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
                }
                disabled={currentStatus === "Completed"}
                onClick={() =>
                  markLessonCompleted({
                    moduleSlug: learningModule.slug,
                    lessonSlug: lesson.slug,
                    title: lesson.title,
                    summary: lesson.summary,
                  })
                }
                type="button"
              >
                {currentStatus === "Completed" ? "Completed" : "Mark Complete"}
              </button>

              <Link
                className="btn-secondary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
                href="/app/quiz"
              >
                Take quiz
              </Link>
              <Link
                className="btn-secondary min-h-9 w-full px-3.5 py-2 text-xs sm:min-h-10 sm:w-auto sm:px-4 sm:text-sm"
                href="/app/backtesting"
              >
                Open backtesting
              </Link>
            </div>
          </div>
        </article>

        <aside>
          <div className="learn-tv-panel rounded-[0.9rem] p-3 sm:p-3.5">
            <p className="learn-tv-kicker">Lesson list</p>
            <div className="mt-2.5 divide-y divide-outline-variant/60">
              {lessons.map((item) => {
                const statusLabel = formatStatus(
                  getLessonProgress(state, learningModule.slug, item.slug)?.status ?? null,
                );
                const isCurrent = item.slug === lesson.slug;
                const itemBookmarked = isLessonBookmarked(
                  bookmarkState,
                  learningModule.slug,
                  item.slug,
                );
                const itemHref = `/app/learn/${learningModule.slug}/${item.slug}`;

                return (
                  <div
                    className={cn(
                      "flex items-start justify-between gap-3 px-0 py-3 text-sm transition",
                      isCurrent
                        ? "text-foreground"
                        : "text-foreground hover:bg-surface-highest/30",
                    )}
                    key={item.slug}
                  >
                    <Link className="min-w-0 flex-1" href={itemHref}>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="learn-tv-kicker">
                            {String(item.order).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-[0.16em]",
                              statusLabel === "Completed"
                                ? "learn-tv-positive"
                                : statusLabel === "In Progress"
                                  ? "text-primary"
                                  : "text-muted",
                            )}
                          >
                            {getDisplayStatus(statusLabel)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "break-words text-[13px] font-semibold sm:text-sm",
                            isCurrent ? "text-foreground" : "",
                          )}
                        >
                          {item.title}
                        </p>
                        {isCurrent ? (
                          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                            Current lesson
                          </p>
                        ) : null}
                      </div>
                    </Link>

                    {!isCurrent ? (
                      <BookmarkButton
                        active={itemBookmarked}
                        className="mt-0.5 shrink-0"
                        label={
                          itemBookmarked
                            ? `Remove ${item.title} bookmark`
                            : `Bookmark ${item.title}`
                        }
                        onClick={() => {
                          const nextValue = !itemBookmarked;
                          setLessonBookmarked(learningModule.slug, item.slug, nextValue);
                          pushToast(
                            nextValue
                              ? "Added lesson to bookmarks"
                              : "Removed lesson from bookmarks",
                          );
                        }}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <BookmarkFeedbackToast toast={toast} />
    </div>
  );
}
