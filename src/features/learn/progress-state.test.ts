import { describe, expect, it } from "vitest";

import {
  createLessonKey,
  createLearnProgressState,
  getContinueLearningLesson,
  mergeLearnProgressStates,
  normalizeLearnProgressState,
  upsertLessonState,
  type LearnCatalogModule,
} from "@/features/learn/progress-state";

const modules: LearnCatalogModule[] = [
  {
    slug: "trading-basics",
    title: "Trading Basics",
    lessons: [
      { slug: "market-map", title: "Market Map", summary: "Intro", order: 1 },
      { slug: "orders", title: "Orders", summary: "Orders", order: 2 },
      { slug: "routine", title: "Routine", summary: "Routine", order: 3 },
    ],
  },
];

describe("progress-state", () => {
  it("normalizes persisted state and derives the latest lesson key", () => {
    const normalized = normalizeLearnProgressState({
      lessons: {
        "trading-basics::market-map": {
          moduleSlug: "trading-basics",
          lessonSlug: "market-map",
          status: "completed",
          startedAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
          completedAt: "2025-01-01T00:00:00.000Z",
        },
        bad: {
          moduleSlug: "",
          lessonSlug: "",
          status: "draft",
        },
        "trading-basics::orders": {
          moduleSlug: "trading-basics",
          lessonSlug: "orders",
          status: "in_progress",
          startedAt: "2025-01-02T00:00:00.000Z",
          updatedAt: "2025-01-03T00:00:00.000Z",
        },
      },
    });

    expect(Object.keys(normalized.lessons)).toHaveLength(2);
    expect(normalized.lastLessonKey).toBe("trading-basics::orders");
  });

  it("merges progress states without losing completed status or early timestamps", () => {
    const current = createLearnProgressState({
      [createLessonKey("trading-basics", "market-map")]: {
        moduleSlug: "trading-basics",
        lessonSlug: "market-map",
        status: "in_progress",
        startedAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      },
    });
    const incoming = createLearnProgressState({
      [createLessonKey("trading-basics", "market-map")]: {
        moduleSlug: "trading-basics",
        lessonSlug: "market-map",
        status: "completed",
        startedAt: "2025-01-03T00:00:00.000Z",
        updatedAt: "2025-01-04T00:00:00.000Z",
        completedAt: "2025-01-04T00:00:00.000Z",
      },
    });

    const merged = mergeLearnProgressStates(current, incoming);
    const lesson = merged.lessons["trading-basics::market-map"];

    expect(lesson?.status).toBe("completed");
    expect(lesson?.startedAt).toBe("2025-01-01T00:00:00.000Z");
    expect(lesson?.updatedAt).toBe("2025-01-04T00:00:00.000Z");
    expect(lesson?.completedAt).toBe("2025-01-04T00:00:00.000Z");
  });

  it("returns the current in-progress lesson for continue learning", () => {
    const state = createLearnProgressState({
      [createLessonKey("trading-basics", "orders")]: {
        moduleSlug: "trading-basics",
        lessonSlug: "orders",
        status: "in_progress",
        startedAt: "2025-01-02T00:00:00.000Z",
        updatedAt: "2025-01-03T00:00:00.000Z",
      },
    });

    const result = getContinueLearningLesson(state, modules);

    expect(result?.lesson.slug).toBe("orders");
    expect(result?.status).toBe("in_progress");
  });

  it("moves continue learning to the next unfinished lesson after a completion", () => {
    const initial = createLearnProgressState({});
    const afterFirstLesson = upsertLessonState(
      initial,
      {
        moduleSlug: "trading-basics",
        lessonSlug: "market-map",
        title: "Market Map",
        summary: "Intro",
      },
      "completed",
    );

    const result = getContinueLearningLesson(afterFirstLesson, modules);

    expect(result?.lesson.slug).toBe("orders");
    expect(result?.status).toBe(null);
  });
});
