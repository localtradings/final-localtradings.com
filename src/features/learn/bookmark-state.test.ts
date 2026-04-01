import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  emptyBookmarkState,
  isLessonBookmarked,
  isModuleBookmarked,
  normalizeLearnBookmarkState,
  setLessonBookmark,
  setModuleBookmark,
} from "@/features/learn/bookmark-state";

describe("bookmark-state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("normalizes invalid bookmark entries out of persisted state", () => {
    const normalized = normalizeLearnBookmarkState({
      modules: {
        valid: {
          kind: "module",
          moduleSlug: "trading-basics",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        invalid: {
          kind: "module",
          moduleSlug: "",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
      },
      lessons: {
        valid: {
          kind: "lesson",
          moduleSlug: "trading-basics",
          lessonSlug: "market-map-and-sessions",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
        invalid: {
          kind: "lesson",
          moduleSlug: "trading-basics",
          lessonSlug: "",
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-01-01T00:00:00.000Z",
        },
      },
    });

    expect(Object.keys(normalized.modules)).toEqual(["valid"]);
    expect(Object.keys(normalized.lessons)).toEqual(["valid"]);
  });

  it("adds and removes module bookmarks while preserving original createdAt", () => {
    vi.setSystemTime(new Date("2025-02-01T00:00:00.000Z"));
    const created = setModuleBookmark(emptyBookmarkState, "trading-basics", true);

    expect(isModuleBookmarked(created, "trading-basics")).toBe(true);
    expect(created.modules["trading-basics"]?.createdAt).toBe("2025-02-01T00:00:00.000Z");

    vi.setSystemTime(new Date("2025-02-02T00:00:00.000Z"));
    const updated = setModuleBookmark(created, "trading-basics", true);

    expect(updated.modules["trading-basics"]?.createdAt).toBe("2025-02-01T00:00:00.000Z");
    expect(updated.modules["trading-basics"]?.updatedAt).toBe("2025-02-02T00:00:00.000Z");

    const removed = setModuleBookmark(updated, "trading-basics", false);
    expect(isModuleBookmarked(removed, "trading-basics")).toBe(false);
  });

  it("adds and removes lesson bookmarks independently", () => {
    vi.setSystemTime(new Date("2025-03-01T00:00:00.000Z"));
    const bookmarked = setLessonBookmark(
      emptyBookmarkState,
      "trading-basics",
      "how-orders-and-price-work",
      true,
    );

    expect(
      isLessonBookmarked(bookmarked, "trading-basics", "how-orders-and-price-work"),
    ).toBe(true);

    const removed = setLessonBookmark(
      bookmarked,
      "trading-basics",
      "how-orders-and-price-work",
      false,
    );

    expect(
      isLessonBookmarked(removed, "trading-basics", "how-orders-and-price-work"),
    ).toBe(false);
  });
});
