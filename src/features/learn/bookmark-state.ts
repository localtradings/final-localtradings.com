export type LearnBookmarkKind = "lesson" | "module";

export type LearnModuleBookmark = {
  kind: "module";
  moduleSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type LearnLessonBookmark = {
  kind: "lesson";
  moduleSlug: string;
  lessonSlug: string;
  createdAt: string;
  updatedAt: string;
};

export type LearnBookmarkState = {
  modules: Record<string, LearnModuleBookmark>;
  lessons: Record<string, LearnLessonBookmark>;
};

export type LearnBookmarkTarget =
  | {
      kind: "module";
      moduleSlug: string;
    }
  | {
      kind: "lesson";
      moduleSlug: string;
      lessonSlug: string;
    };

export const emptyBookmarkState: LearnBookmarkState = {
  modules: {},
  lessons: {},
};

export function createModuleBookmarkKey(moduleSlug: string) {
  return moduleSlug;
}

export function createLessonBookmarkKey(moduleSlug: string, lessonSlug: string) {
  return `${moduleSlug}:${lessonSlug}`;
}

export function normalizeLearnBookmarkState(
  state: LearnBookmarkState | null | undefined,
): LearnBookmarkState {
  if (!state) {
    return emptyBookmarkState;
  }

  return {
    modules: Object.fromEntries(
      Object.entries(state.modules ?? {}).filter(([, bookmark]) => Boolean(bookmark?.moduleSlug)),
    ),
    lessons: Object.fromEntries(
      Object.entries(state.lessons ?? {}).filter(
        ([, bookmark]) => Boolean(bookmark?.moduleSlug && bookmark?.lessonSlug),
      ),
    ),
  };
}

export function isModuleBookmarked(state: LearnBookmarkState, moduleSlug: string) {
  return Boolean(state.modules[createModuleBookmarkKey(moduleSlug)]);
}

export function isLessonBookmarked(
  state: LearnBookmarkState,
  moduleSlug: string,
  lessonSlug: string,
) {
  return Boolean(state.lessons[createLessonBookmarkKey(moduleSlug, lessonSlug)]);
}

export function setModuleBookmark(
  state: LearnBookmarkState,
  moduleSlug: string,
  bookmarked: boolean,
) {
  const nextState = normalizeLearnBookmarkState(state);
  const key = createModuleBookmarkKey(moduleSlug);

  if (!bookmarked) {
    if (!nextState.modules[key]) {
      return nextState;
    }

    return {
      modules: Object.fromEntries(
        Object.entries(nextState.modules).filter(([entryKey]) => entryKey !== key),
      ),
      lessons: nextState.lessons,
    };
  }

  const now = new Date().toISOString();

  return {
    modules: {
      ...nextState.modules,
      [key]: {
        kind: "module" as const,
        moduleSlug,
        createdAt: nextState.modules[key]?.createdAt ?? now,
        updatedAt: now,
      },
    },
    lessons: nextState.lessons,
  };
}

export function setLessonBookmark(
  state: LearnBookmarkState,
  moduleSlug: string,
  lessonSlug: string,
  bookmarked: boolean,
) {
  const nextState = normalizeLearnBookmarkState(state);
  const key = createLessonBookmarkKey(moduleSlug, lessonSlug);

  if (!bookmarked) {
    if (!nextState.lessons[key]) {
      return nextState;
    }

    return {
      modules: nextState.modules,
      lessons: Object.fromEntries(
        Object.entries(nextState.lessons).filter(([entryKey]) => entryKey !== key),
      ),
    };
  }

  const now = new Date().toISOString();

  return {
    modules: nextState.modules,
    lessons: {
      ...nextState.lessons,
      [key]: {
        kind: "lesson" as const,
        moduleSlug,
        lessonSlug,
        createdAt: nextState.lessons[key]?.createdAt ?? now,
        updatedAt: now,
      },
    },
  };
}
