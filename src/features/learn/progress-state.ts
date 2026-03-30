export const LEARN_PROGRESS_STORAGE_KEY = "localtradings:learn-progress:v1";

export type LearnLessonStatus = "in_progress" | "completed";

export type LearnLessonProgress = {
  moduleSlug: string;
  lessonSlug: string;
  status: LearnLessonStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type LearnProgressState = {
  lessons: Record<string, LearnLessonProgress>;
  lastLessonKey: string | null;
};

export type LessonDescriptor = {
  moduleSlug: string;
  lessonSlug: string;
  title: string;
  summary: string;
};

export type LearnCatalogModule = {
  slug: string;
  title: string;
  lessons: Array<{
    slug: string;
    title: string;
    summary: string;
    order: number;
  }>;
};

export const emptyProgressState: LearnProgressState = {
  lessons: {},
  lastLessonKey: null,
};

export function createLessonKey(moduleSlug: string, lessonSlug: string) {
  return `${moduleSlug}::${lessonSlug}`;
}

export function createLearnMigrationStorageKey(userId: string) {
  return `localtradings:learn-progress:migrated:${userId}:v1`;
}

function isValidStatus(value: unknown): value is LearnLessonStatus {
  return value === "in_progress" || value === "completed";
}

function sanitizeLessonProgress(
  key: string,
  value: unknown,
): LearnLessonProgress | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const [fallbackModuleSlug, fallbackLessonSlug] = key.split("::");
  const candidate = value as Partial<LearnLessonProgress>;
  const moduleSlug =
    typeof candidate.moduleSlug === "string" && candidate.moduleSlug
      ? candidate.moduleSlug
      : fallbackModuleSlug;
  const lessonSlug =
    typeof candidate.lessonSlug === "string" && candidate.lessonSlug
      ? candidate.lessonSlug
      : fallbackLessonSlug;

  if (
    !moduleSlug ||
    !lessonSlug ||
    !isValidStatus(candidate.status) ||
    typeof candidate.startedAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  return {
    moduleSlug,
    lessonSlug,
    status: candidate.status,
    startedAt: candidate.startedAt,
    updatedAt: candidate.updatedAt,
    completedAt:
      typeof candidate.completedAt === "string" ? candidate.completedAt : undefined,
  };
}

export function deriveLastLessonKey(
  lessons: Record<string, LearnLessonProgress>,
) {
  let latestKey: string | null = null;
  let latestTimestamp = Number.NEGATIVE_INFINITY;

  for (const [key, lesson] of Object.entries(lessons)) {
    const nextTimestamp = Date.parse(lesson.updatedAt);
    if (!Number.isFinite(nextTimestamp)) {
      continue;
    }

    if (nextTimestamp > latestTimestamp) {
      latestTimestamp = nextTimestamp;
      latestKey = key;
    }
  }

  return latestKey;
}

export function createLearnProgressState(
  lessons: Record<string, LearnLessonProgress>,
): LearnProgressState {
  return {
    lessons,
    lastLessonKey: deriveLastLessonKey(lessons),
  };
}

export function normalizeLearnProgressState(input: unknown): LearnProgressState {
  if (!input || typeof input !== "object") {
    return emptyProgressState;
  }

  const candidate = input as Partial<LearnProgressState>;
  const lessons: Record<string, LearnLessonProgress> = {};

  if (candidate.lessons && typeof candidate.lessons === "object") {
    for (const [key, value] of Object.entries(candidate.lessons)) {
      const sanitized = sanitizeLessonProgress(key, value);
      if (!sanitized) {
        continue;
      }

      lessons[createLessonKey(sanitized.moduleSlug, sanitized.lessonSlug)] = sanitized;
    }
  }

  const lastLessonKey = deriveLastLessonKey(lessons);

  return {
    lessons,
    lastLessonKey:
      typeof candidate.lastLessonKey === "string" &&
      candidate.lastLessonKey in lessons
        ? candidate.lastLessonKey
        : lastLessonKey,
  };
}

function getEarlierTimestamp(left?: string, right?: string) {
  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return Date.parse(left) <= Date.parse(right) ? left : right;
}

function getLaterTimestamp(left: string, right: string) {
  return Date.parse(left) >= Date.parse(right) ? left : right;
}

export function mergeLessonProgress(
  current: LearnLessonProgress | null,
  incoming: LearnLessonProgress,
): LearnLessonProgress {
  if (!current) {
    return incoming;
  }

  const status: LearnLessonStatus =
    current.status === "completed" || incoming.status === "completed"
      ? "completed"
      : "in_progress";
  const completedAt =
    status === "completed"
      ? getEarlierTimestamp(current.completedAt, incoming.completedAt) ??
        incoming.updatedAt
      : undefined;

  return {
    moduleSlug: incoming.moduleSlug,
    lessonSlug: incoming.lessonSlug,
    status,
    startedAt: getEarlierTimestamp(current.startedAt, incoming.startedAt) ?? incoming.startedAt,
    updatedAt: getLaterTimestamp(current.updatedAt, incoming.updatedAt),
    completedAt,
  };
}

export function mergeLearnProgressStates(
  current: LearnProgressState,
  incoming: LearnProgressState,
): LearnProgressState {
  const nextLessons = { ...current.lessons };

  for (const [key, lesson] of Object.entries(incoming.lessons)) {
    nextLessons[key] = mergeLessonProgress(nextLessons[key] ?? null, lesson);
  }

  return createLearnProgressState(nextLessons);
}

export function upsertLessonState(
  current: LearnProgressState,
  lesson: LessonDescriptor,
  status: LearnLessonStatus,
) {
  const key = createLessonKey(lesson.moduleSlug, lesson.lessonSlug);
  const now = new Date().toISOString();
  const existing = current.lessons[key];

  if (status === "in_progress" && existing?.status === "in_progress" && current.lastLessonKey === key) {
    return current;
  }

  const nextLesson: LearnLessonProgress =
    existing?.status === "completed" && status === "in_progress"
      ? {
          ...existing,
          updatedAt: now,
        }
      : {
          moduleSlug: lesson.moduleSlug,
          lessonSlug: lesson.lessonSlug,
          status,
          startedAt: existing?.startedAt ?? now,
          updatedAt: now,
          completedAt:
            status === "completed" ? existing?.completedAt ?? now : existing?.completedAt,
        };

  return {
    lessons: {
      ...current.lessons,
      [key]: nextLesson,
    },
    lastLessonKey: key,
  };
}

export function getLessonProgress(
  state: LearnProgressState,
  moduleSlug: string,
  lessonSlug: string,
) {
  return state.lessons[createLessonKey(moduleSlug, lessonSlug)] ?? null;
}

export function getModuleProgressStatus(
  state: LearnProgressState,
  module: LearnCatalogModule,
) {
  const lessonStates = module.lessons
    .map((lesson) => getLessonProgress(state, module.slug, lesson.slug))
    .filter((value): value is LearnLessonProgress => value !== null);

  if (lessonStates.length === 0) {
    return null;
  }

  const completedCount = lessonStates.filter(
    (lesson) => lesson.status === "completed",
  ).length;

  if (completedCount === module.lessons.length) {
    return "completed" as const;
  }

  return "in_progress" as const;
}

export function getContinueLearningLesson(
  state: LearnProgressState,
  modules: LearnCatalogModule[],
) {
  if (!state.lastLessonKey) {
    return null;
  }

  const [moduleSlug, lessonSlug] = state.lastLessonKey.split("::");
  if (!moduleSlug || !lessonSlug) {
    return null;
  }

  const learningModule = modules.find((module) => module.slug === moduleSlug);
  if (!learningModule) {
    return null;
  }

  const currentLesson = learningModule.lessons.find((lesson) => lesson.slug === lessonSlug);
  if (!currentLesson) {
    return null;
  }

  const currentProgress = getLessonProgress(state, moduleSlug, lessonSlug);
  if (currentProgress?.status !== "completed") {
    return {
      module: learningModule,
      lesson: currentLesson,
      status: currentProgress?.status ?? null,
    };
  }

  const nextLesson = learningModule.lessons.find((lesson) => {
    if (lesson.order <= currentLesson.order) {
      return false;
    }

    const lessonProgress = getLessonProgress(state, moduleSlug, lesson.slug);
    return lessonProgress?.status !== "completed";
  });

  if (!nextLesson) {
    const currentModuleIndex = modules.findIndex((module) => module.slug === moduleSlug);

    const remainingModules =
      currentModuleIndex >= 0
        ? [
            ...modules.slice(currentModuleIndex + 1),
            ...modules.slice(0, currentModuleIndex),
          ]
        : modules;

    for (const candidateModule of remainingModules) {
      const firstIncompleteLesson = candidateModule.lessons.find((lesson) => {
        const lessonProgress = getLessonProgress(state, candidateModule.slug, lesson.slug);
        return lessonProgress?.status !== "completed";
      });

      if (firstIncompleteLesson) {
        return {
          module: candidateModule,
          lesson: firstIncompleteLesson,
          status:
            getLessonProgress(
              state,
              candidateModule.slug,
              firstIncompleteLesson.slug,
            )?.status ?? null,
        };
      }
    }

    return null;
  }

  return {
    module: learningModule,
    lesson: nextLesson,
    status: getLessonProgress(state, moduleSlug, nextLesson.slug)?.status ?? null,
  };
}
