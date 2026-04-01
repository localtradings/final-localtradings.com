"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";

import { ModuleSelector } from "@/features/learn/components/learn-hub-primitives";
import { isModuleBookmarked, type LearnBookmarkState } from "@/features/learn/bookmark-state";
import type { BookmarkRailItem, ModuleSnapshot } from "@/features/learn/learn-hub-types";

export function LearnHubSavedLibraryRail({
  bookmarkState,
  bookmarkedRailItems,
  moduleBoardEntries,
  moduleBoardHeight,
  onModuleBookmarkToggle,
  onModuleSelect,
  resolvedActiveModuleIndex,
}: {
  bookmarkState: LearnBookmarkState;
  bookmarkedRailItems: BookmarkRailItem[];
  moduleBoardEntries: Array<{ module: ModuleSnapshot; index: number }>;
  moduleBoardHeight: number | null;
  onModuleBookmarkToggle: (moduleSlug: string, bookmarked: boolean) => void;
  onModuleSelect: (index: number) => void;
  resolvedActiveModuleIndex: number;
}) {
  return (
    <aside className="xl:self-start">
      <section
        className="learn-tv-frame flex flex-col overflow-hidden rounded-[0.9rem]"
        style={moduleBoardHeight ? { height: `${moduleBoardHeight}px` } : undefined}
      >
        <div className="border-b border-outline-variant/70 px-3 py-2.5 text-center sm:px-3.5 sm:py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Saved library
          </h2>
        </div>

        <div className="flex flex-1 min-h-0 flex-col gap-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 sm:px-3.5 sm:py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="learn-tv-kicker">My bookmarks</p>
              <span className="text-[11px] font-semibold text-muted">
                {bookmarkedRailItems.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-1.5">
              {bookmarkedRailItems.length === 0 ? (
                <div className="rounded-[0.9rem] border border-outline-variant/70 bg-surface-low px-4 py-4 text-sm text-muted">
                  No bookmarks yet. Start bookmarking modules or lessons to save them for later.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {bookmarkedRailItems.map((item) => (
                    <Link
                      className="block rounded-[0.78rem] border border-outline-variant/70 bg-surface-low px-3 py-2.5 transition hover:border-primary/18 hover:bg-surface-highest/55"
                      href={item.href}
                      key={item.id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="learn-tv-kicker">{item.kind}</span>
                            <span className="learn-tv-chip px-2 py-0.5 text-[0.52rem] tracking-[0.12em]">
                              Saved
                            </span>
                          </div>
                          <p className="mt-1 break-words text-[13px] font-semibold text-foreground">
                            {item.label}
                          </p>
                          <p className="mt-1 text-[11px] text-muted">{item.meta}</p>
                        </div>
                        <Bookmark className="mt-0.5 h-4 w-4 shrink-0 fill-current text-[#f3c94d]" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-outline-variant/70" />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-2 sm:px-3.5 sm:py-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="learn-tv-kicker">Explore all modules</p>
              <span className="text-[11px] font-semibold text-muted">
                {moduleBoardEntries.length}
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-1.5">
              {moduleBoardEntries.length === 0 ? (
                <div className="rounded-[0.9rem] border border-outline-variant/70 bg-surface-low px-4 py-4 text-sm text-muted">
                  No modules match that search right now.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {moduleBoardEntries.map(({ module, index }) => (
                    <ModuleSelector
                      isActive={index === resolvedActiveModuleIndex}
                      isBookmarked={isModuleBookmarked(bookmarkState, module.slug)}
                      key={module.slug}
                      module={module}
                      onBookmarkToggle={() =>
                        onModuleBookmarkToggle(
                          module.slug,
                          !isModuleBookmarked(bookmarkState, module.slug),
                        )
                      }
                      onSelect={() => onModuleSelect(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
