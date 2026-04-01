"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { isLessonBookmarked, isModuleBookmarked } from "@/features/learn/bookmark-state";
import { BookmarkButton } from "@/features/learn/bookmark-button";
import { HubCardImage } from "@/features/learn/components/learn-hub-primitives";
import type { ModulePrimaryAction, ModuleSnapshot } from "@/features/learn/learn-hub-types";
import {
  formatProgressStatus,
  getDisplayStatus,
  getStatusChipClass,
  getStatusTextClass,
} from "@/features/learn/learn-shared";
import type { LearnProgressState } from "@/features/learn/progress-state";
import type { LearnBookmarkState } from "@/features/learn/bookmark-state";
import { getLessonProgress } from "@/features/learn/progress-state";
import { cn } from "@/lib/utils";
import type { LessonFrontmatter } from "@/types/content";

export function LearnHubSelectedModuleSection({
  activeModule,
  activeModuleNextLesson,
  activeModulePrimaryAction,
  bookmarkState,
  onLessonBookmarkToggle,
  onModuleBookmarkToggle,
  state,
}: {
  activeModule: ModuleSnapshot | null;
  activeModuleNextLesson: LessonFrontmatter | null;
  activeModulePrimaryAction: ModulePrimaryAction | null;
  bookmarkState: LearnBookmarkState;
  onLessonBookmarkToggle: (
    moduleSlug: string,
    lessonSlug: string,
    bookmarked: boolean,
  ) => void;
  onModuleBookmarkToggle: (moduleSlug: string, bookmarked: boolean) => void;
  state: LearnProgressState;
}) {
  if (!activeModule) {
    return null;
  }

  return (
    <section className="learn-tv-frame overflow-hidden rounded-[0.9rem]">
      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(268px,0.95fr)]">
        <div className="flex h-full min-w-0 flex-col justify-between gap-3 p-3 sm:p-3.5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="learn-tv-chip learn-tv-chip--active">Selected module</span>
                <span className={getStatusChipClass(getDisplayStatus(activeModule.progressLabel))}>
                  {getDisplayStatus(activeModule.progressLabel)}
                </span>
              </div>
              <BookmarkButton
                active={isModuleBookmarked(bookmarkState, activeModule.slug)}
                className="shrink-0"
                label={
                  isModuleBookmarked(bookmarkState, activeModule.slug)
                    ? `Remove ${activeModule.title} bookmark`
                    : `Bookmark ${activeModule.title}`
                }
                onClick={() =>
                  onModuleBookmarkToggle(
                    activeModule.slug,
                    !isModuleBookmarked(bookmarkState, activeModule.slug),
                  )
                }
              />
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
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-end p-3 sm:p-3.5">
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
                  formatProgressStatus(
                    getLessonProgress(state, activeModule.slug, lesson.slug)?.status ?? null,
                  ),
                );

                const lessonHref = `/app/learn/${activeModule.slug}/${lesson.slug}`;
                const bookmarked = isLessonBookmarked(
                  bookmarkState,
                  activeModule.slug,
                  lesson.slug,
                );

                return (
                  <div
                    className="flex items-start justify-between gap-3 px-0 py-1.5 transition hover:bg-surface-highest/30"
                    key={lesson.slug}
                  >
                    <Link className="min-w-0 flex-1" href={lessonHref}>
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
                    </Link>

                    <div className="flex items-center gap-2">
                      <BookmarkButton
                        active={bookmarked}
                        label={
                          bookmarked
                            ? `Remove ${lesson.title} bookmark`
                            : `Bookmark ${lesson.title}`
                        }
                        onClick={() =>
                          onLessonBookmarkToggle(
                            activeModule.slug,
                            lesson.slug,
                            !bookmarked,
                          )
                        }
                      />
                      <Link
                        className="shrink-0 text-muted transition hover:text-foreground"
                        href={lessonHref}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
