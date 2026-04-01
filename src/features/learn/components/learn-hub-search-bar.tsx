"use client";

import { Search } from "lucide-react";

import type {
  ModuleBoardFilterValue,
  SearchSuggestion,
} from "@/features/learn/learn-hub-types";
import { cn } from "@/lib/utils";

export function LearnHubSearchBar({
  flatSearchSuggestions,
  highlightedSuggestionIndex,
  isSearchMenuOpen,
  moduleBoardFilters,
  moduleFilter,
  moduleQuery,
  onApplySuggestion,
  onFilterChange,
  onHighlightedSuggestionChange,
  onQueryChange,
  onSearchMenuOpenChange,
  searchSuggestions,
}: {
  flatSearchSuggestions: SearchSuggestion[];
  highlightedSuggestionIndex: number;
  isSearchMenuOpen: boolean;
  moduleBoardFilters: Array<{ value: ModuleBoardFilterValue; label: string }>;
  moduleFilter: ModuleBoardFilterValue;
  moduleQuery: string;
  onApplySuggestion: (suggestion: SearchSuggestion) => void;
  onFilterChange: (value: ModuleBoardFilterValue) => void;
  onHighlightedSuggestionChange: (index: number) => void;
  onQueryChange: (value: string) => void;
  onSearchMenuOpenChange: (open: boolean) => void;
  searchSuggestions: {
    lessons: SearchSuggestion[];
    modules: SearchSuggestion[];
    topics: SearchSuggestion[];
  };
}) {
  const resolvedHighlightedSuggestionIndex =
    flatSearchSuggestions.length === 0
      ? 0
      : Math.min(highlightedSuggestionIndex, flatSearchSuggestions.length - 1);

  return (
    <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="relative">
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
              onQueryChange(event.target.value);
              onSearchMenuOpenChange(true);
            }}
            onFocus={() => onSearchMenuOpenChange(true)}
            onKeyDown={(event) => {
              if (!flatSearchSuggestions.length) {
                if (event.key === "Escape") {
                  onSearchMenuOpenChange(false);
                }
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                onSearchMenuOpenChange(true);
                onHighlightedSuggestionChange(
                  highlightedSuggestionIndex + 1 >= flatSearchSuggestions.length
                    ? 0
                    : highlightedSuggestionIndex + 1,
                );
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                onSearchMenuOpenChange(true);
                onHighlightedSuggestionChange(
                  highlightedSuggestionIndex - 1 < 0
                    ? flatSearchSuggestions.length - 1
                    : highlightedSuggestionIndex - 1,
                );
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                onApplySuggestion(flatSearchSuggestions[resolvedHighlightedSuggestionIndex]);
                return;
              }

              if (event.key === "Escape") {
                onSearchMenuOpenChange(false);
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
                  {
                    title: moduleQuery.trim()
                      ? "Lessons"
                      : "Suggested lessons",
                    items: searchSuggestions.lessons,
                  },
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
                                onApplySuggestion(suggestion);
                              }}
                              onMouseEnter={() =>
                                onHighlightedSuggestionChange(suggestionIndex)
                              }
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
        onChange={(event) => onFilterChange(event.target.value as ModuleBoardFilterValue)}
        value={moduleFilter}
      >
        {moduleBoardFilters.map((filterOption) => (
          <option key={filterOption.value} value={filterOption.value}>
            {filterOption.value === "all" ? "All modules" : filterOption.label}
          </option>
        ))}
      </select>
    </div>
  );
}
