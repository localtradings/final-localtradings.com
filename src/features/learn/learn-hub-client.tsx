"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  BookmarkFeedbackToast,
  useBookmarkFeedback,
} from "@/features/learn/bookmark-feedback";
import { LearnHubLessonLibrarySection } from "@/features/learn/components/learn-hub-lesson-library-section";
import { LearnHubSavedLibraryRail } from "@/features/learn/components/learn-hub-saved-library-rail";
import { LearnHubSearchBar } from "@/features/learn/components/learn-hub-search-bar";
import { LearnHubSelectedModuleSection } from "@/features/learn/components/learn-hub-selected-module-section";
import {
  buildLessonEntries,
  buildModuleSnapshots,
  buildTopicOptions,
  getModuleNextLesson,
  getModulePrimaryAction,
  getQueryMatchScore,
  getLessonStatusFilterValue,
  ITEMS_PER_PAGE,
  matchesBoardFilter,
  matchesLearnQuery,
  moduleBoardFilters,
  sortLessonEntries,
} from "@/features/learn/learn-hub-helpers";
import type {
  BookmarkRailItem,
  LearnHubModule,
  LearnLessonEntry,
  LessonSortValue,
  LessonStatusFilterValue,
  ModuleBoardFilterValue,
  ModuleSnapshot,
  SearchSuggestion,
} from "@/features/learn/learn-hub-types";
import { formatProgressStatus } from "@/features/learn/learn-shared";
import {
  getContinueLearningLesson,
  getLessonProgress,
} from "@/features/learn/progress-state";
import { useLearnProgress } from "@/features/learn/learn-progress-provider";

export function LearnHubClient({ modules }: { modules: LearnHubModule[] }) {
  const router = useRouter();
  const { bookmarkState, setLessonBookmarked, setModuleBookmarked, state } =
    useLearnProgress();
  const { pushToast, toast } = useBookmarkFeedback();

  const activeModuleSectionRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const hasManualModuleSelectionRef = useRef(false);

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
    () => buildLessonEntries(modules),
    [modules],
  );

  const moduleSnapshots = useMemo<ModuleSnapshot[]>(
    () => buildModuleSnapshots(orderedModules, state),
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

  const lessonTopicOptions = useMemo(() => buildTopicOptions(lessonEntries), [lessonEntries]);
  const learnQuery = moduleQuery.trim().toLowerCase();

  const topicCounts = useMemo(() => {
    const nextCounts = new Map<string, number>();

    for (const entry of lessonEntries) {
      nextCounts.set(entry.topic, (nextCounts.get(entry.topic) ?? 0) + 1);
    }

    return nextCounts;
  }, [lessonEntries]);

  const bookmarkedRailItems = useMemo<BookmarkRailItem[]>(() => {
    const moduleItems = Object.values(bookmarkState.modules).flatMap<BookmarkRailItem>(
      (bookmark) => {
        const matchedModule = moduleSnapshots.find(
          (entry) => entry.slug === bookmark.moduleSlug,
        );
        if (!matchedModule) {
          return [];
        }

        return [
          {
            id: `module:${matchedModule.slug}`,
            kind: "module",
            href: `/app/learn/${matchedModule.slug}`,
            label: matchedModule.title,
            meta: `${matchedModule.topic} • ${matchedModule.totalLessons} lessons`,
            sortValue: bookmark.updatedAt,
            summary: matchedModule.description,
          },
        ];
      },
    );

    const lessonItems = Object.values(bookmarkState.lessons).flatMap<BookmarkRailItem>(
      (bookmark) => {
        const lesson = lessonEntries.find(
          (entry) =>
            entry.moduleSlug === bookmark.moduleSlug && entry.slug === bookmark.lessonSlug,
        );
        if (!lesson) {
          return [];
        }

        return [
          {
            id: `lesson:${lesson.moduleSlug}:${lesson.slug}`,
            kind: "lesson",
            href: lesson.href,
            label: lesson.title,
            meta: `${lesson.moduleTitle} • ${lesson.duration}`,
            sortValue: bookmark.updatedAt,
            summary: lesson.summary,
          },
        ];
      },
    );

    return [...moduleItems, ...lessonItems]
      .filter((item) =>
        !learnQuery
          ? true
          : matchesLearnQuery(learnQuery, [item.label, item.summary, item.meta]),
      )
      .sort((left, right) => right.sortValue.localeCompare(left.sortValue));
  }, [bookmarkState.lessons, bookmarkState.modules, learnQuery, lessonEntries, moduleSnapshots]);

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
          formatProgressStatus(getLessonProgress(state, entry.moduleSlug, entry.slug)?.status ?? null),
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

      const topicSuggestions = topicSuggestionValues
        .slice(0, 2)
        .map<SearchSuggestion>((topic) => ({
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

  const setActiveModuleFromUser = (nextIndex: number) => {
    hasManualModuleSelectionRef.current = true;
    setActiveModuleIndex(nextIndex);
  };

  const handleModuleBookmarkToggle = (moduleSlug: string, bookmarked: boolean) => {
    setModuleBookmarked(moduleSlug, bookmarked);
    pushToast(bookmarked ? "Added module to bookmarks" : "Removed module from bookmarks");
  };

  const handleLessonBookmarkToggle = (
    moduleSlug: string,
    lessonSlug: string,
    bookmarked: boolean,
  ) => {
    setLessonBookmarked(moduleSlug, lessonSlug, bookmarked);
    pushToast(bookmarked ? "Added lesson to bookmarks" : "Removed lesson from bookmarks");
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

  return (
    <div className="learn-tv-screen learn-tv-screen--flat space-y-3.5 pb-5 sm:space-y-4 sm:pb-7">
      <div ref={searchContainerRef}>
        <LearnHubSearchBar
          flatSearchSuggestions={flatSearchSuggestions}
          highlightedSuggestionIndex={highlightedSuggestionIndex}
          isSearchMenuOpen={isSearchMenuOpen}
          moduleBoardFilters={moduleBoardFilters}
          moduleFilter={moduleFilter}
          moduleQuery={moduleQuery}
          onApplySuggestion={applySearchSuggestion}
          onFilterChange={setModuleFilter}
          onHighlightedSuggestionChange={setHighlightedSuggestionIndex}
          onQueryChange={setModuleQuery}
          onSearchMenuOpenChange={setIsSearchMenuOpen}
          searchSuggestions={searchSuggestions}
        />
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_17.25rem] xl:items-start">
        <div className="space-y-3.5">
          <div ref={activeModuleSectionRef}>
            <LearnHubSelectedModuleSection
              activeModule={activeModule}
              activeModuleNextLesson={activeModuleNextLesson}
              activeModulePrimaryAction={activeModulePrimaryAction}
              bookmarkState={bookmarkState}
              onLessonBookmarkToggle={handleLessonBookmarkToggle}
              onModuleBookmarkToggle={handleModuleBookmarkToggle}
              state={state}
            />
          </div>
        </div>

        <LearnHubSavedLibraryRail
          bookmarkState={bookmarkState}
          bookmarkedRailItems={bookmarkedRailItems}
          moduleBoardEntries={moduleBoardEntries}
          moduleBoardHeight={moduleBoardHeight}
          onModuleBookmarkToggle={handleModuleBookmarkToggle}
          onModuleSelect={setActiveModuleFromUser}
          resolvedActiveModuleIndex={resolvedActiveModuleIndex}
        />
      </div>

      <LearnHubLessonLibrarySection
        activeLessonPage={activeLessonPage}
        bookmarkState={bookmarkState}
        lessonSort={lessonSort}
        lessonStatuses={lessonStatuses}
        lessonTopic={lessonTopic}
        lessonTopicOptions={lessonTopicOptions}
        lessonTotalPages={lessonTotalPages}
        onLessonBookmarkToggle={handleLessonBookmarkToggle}
        onLessonPageChange={setLessonPage}
        onLessonSortChange={(value) => {
          setLessonSort(value);
          setLessonPage(1);
        }}
        onLessonStatusToggle={(value) => {
          setLessonStatuses((current) =>
            current.includes(value)
              ? current.filter((item) => item !== value)
              : [...current, value],
          );
          setLessonPage(1);
        }}
        onLessonTopicChange={(value) => {
          setLessonTopic(value);
          setLessonPage(1);
        }}
        onReset={() => {
          setLessonTopic("All");
          setLessonSort("recommended");
          setLessonStatuses(["not_started", "in_progress", "completed"]);
          setLessonPage(1);
        }}
        paginatedLessons={paginatedLessons}
        state={state}
      />

      <BookmarkFeedbackToast toast={toast} />
    </div>
  );
}
