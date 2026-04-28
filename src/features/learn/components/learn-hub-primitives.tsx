"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type SyntheticEvent } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

import { BookmarkButton } from "@/features/learn/bookmark-button";
import { buildFallbackClass, lessonStatusFilters } from "@/features/learn/learn-hub-helpers";
import type {
  LearnLessonEntry,
  LessonSortValue,
  LessonStatusFilterValue,
  ModuleSnapshot,
} from "@/features/learn/learn-hub-types";
import {
  getBoardStatusChipClass,
  getDisplayStatus,
  getLessonActionLabel,
  getStatusTextClass,
  type LearnProgressLabel,
} from "@/features/learn/learn-shared";
import { cn } from "@/lib/utils";

export function HubCardImage({
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

export function Pagination({
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

export function FilterControls({
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

export function ModuleSelector({
  isBookmarked,
  isActive,
  module,
  onBookmarkToggle,
  onSelect,
}: {
  isBookmarked: boolean;
  isActive: boolean;
  module: ModuleSnapshot;
  onBookmarkToggle: () => void;
  onSelect: () => void;
}) {
  const statusLabel = getDisplayStatus(module.progressLabel);

  return (
    <div
      aria-current={isActive ? "true" : undefined}
      className="learn-tv-watchlist-row min-h-[3.35rem] rounded-[0.68rem] px-3 py-2 text-left sm:min-h-[3.48rem] sm:px-3.25 sm:py-2.25"
    >
      <div className="flex items-start gap-2.5">
        <button className="min-w-0 flex-1 text-left" onClick={onSelect} type="button">
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

        <BookmarkButton
          active={isBookmarked}
          className="mt-0.5 shrink-0"
          label={isBookmarked ? `Remove ${module.title} bookmark` : `Bookmark ${module.title}`}
          onClick={onBookmarkToggle}
        />
      </div>
    </div>
  );
}

export function LessonRow({
  eagerImage = false,
  isBookmarked,
  entry,
  onBookmarkToggle,
  progressLabel,
}: {
  eagerImage?: boolean;
  isBookmarked: boolean;
  entry: LearnLessonEntry;
  onBookmarkToggle: () => void;
  progressLabel: LearnProgressLabel;
}) {
  const actionLabel = getLessonActionLabel(progressLabel);
  const statusLabel = getDisplayStatus(progressLabel);

  return (
    <div className="learn-tv-table-row px-3 py-3 sm:px-4 sm:py-3.5">
      <div className="grid gap-3 grid-cols-[4.15rem_minmax(0,1fr)] lg:grid-cols-[5.5rem_minmax(0,1fr)_6rem_6rem_auto] lg:items-center">
        <div className="relative aspect-[5/4] overflow-hidden rounded-[0.9rem] border border-outline-variant/70 bg-surface-highest sm:aspect-[4/3]">
          <HubCardImage
            alt={entry.title}
            eager={eagerImage}
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
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted lg:hidden">
              {entry.level}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted lg:hidden">
              {entry.duration}
            </span>
            <p className={cn("text-xs font-semibold sm:text-sm", getStatusTextClass(statusLabel))}>
              {statusLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookmarkButton
              active={isBookmarked}
              label={isBookmarked ? `Remove ${entry.title} bookmark` : `Bookmark ${entry.title}`}
              onClick={onBookmarkToggle}
            />
            <Link
              className="btn-secondary min-h-8 px-3 py-1.5 text-[11px] sm:min-h-9 sm:px-3.5 sm:text-xs"
              href={entry.href}
            >
              {actionLabel}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
