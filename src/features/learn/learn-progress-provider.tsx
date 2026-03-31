"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  emptyBookmarkState,
  normalizeLearnBookmarkState,
  setLessonBookmark,
  setModuleBookmark,
  type LearnBookmarkState,
} from "@/features/learn/bookmark-state";
import {
  importLegacyLearnProgress,
  saveLearnBookmark,
  saveLearnLessonProgress,
} from "@/server/learn/actions";

import {
  LEARN_PROGRESS_STORAGE_KEY,
  createLearnMigrationStorageKey,
  emptyProgressState,
  normalizeLearnProgressState,
  upsertLessonState,
  type LearnProgressState,
  type LessonDescriptor,
} from "./progress-state";

type LearnProgressContextValue = {
  bookmarkState: LearnBookmarkState;
  setLessonBookmarked: (moduleSlug: string, lessonSlug: string, bookmarked: boolean) => void;
  setModuleBookmarked: (moduleSlug: string, bookmarked: boolean) => void;
  state: LearnProgressState;
  markLessonOpened: (lesson: LessonDescriptor) => void;
  markLessonCompleted: (lesson: LessonDescriptor) => void;
};

const LearnProgressContext = createContext<LearnProgressContextValue | null>(null);

function readLegacyStoredProgress() {
  if (typeof window === "undefined") {
    return emptyProgressState;
  }

  const raw = window.localStorage.getItem(LEARN_PROGRESS_STORAGE_KEY);
  if (!raw) {
    return emptyProgressState;
  }

  try {
    return normalizeLearnProgressState(JSON.parse(raw));
  } catch {
    return emptyProgressState;
  }
}

type LearnProgressProviderProps = {
  initialBookmarks?: LearnBookmarkState;
  children: ReactNode;
  initialState?: LearnProgressState;
  userId: string;
};

export function LearnProgressProvider({
  children,
  initialBookmarks = emptyBookmarkState,
  initialState = emptyProgressState,
  userId,
}: LearnProgressProviderProps) {
  const normalizedInitialState = useMemo(
    () => normalizeLearnProgressState(initialState),
    [initialState],
  );
  const normalizedInitialBookmarks = useMemo(
    () => normalizeLearnBookmarkState(initialBookmarks),
    [initialBookmarks],
  );
  const [state, setState] = useState(normalizedInitialState);
  const [bookmarkState, setBookmarkState] = useState(normalizedInitialBookmarks);
  const stateRef = useRef(normalizedInitialState);
  const confirmedStateRef = useRef(normalizedInitialState);
  const bookmarkStateRef = useRef(normalizedInitialBookmarks);
  const confirmedBookmarkStateRef = useRef(normalizedInitialBookmarks);
  const writeQueueRef = useRef(Promise.resolve());
  const bookmarkQueueRef = useRef(Promise.resolve());

  const enqueueStateSync = useCallback(
    (lesson: LessonDescriptor, status: "in_progress" | "completed") => {
      writeQueueRef.current = writeQueueRef.current
        .then(async () => {
          const result = await saveLearnLessonProgress(lesson, status);
          if (!result.ok) {
            stateRef.current = confirmedStateRef.current;
            setState(confirmedStateRef.current);
            return;
          }

          const nextState = normalizeLearnProgressState(result.state);
          confirmedStateRef.current = nextState;
          stateRef.current = nextState;
          setState(nextState);
        })
        .catch(() => {
          stateRef.current = confirmedStateRef.current;
          setState(confirmedStateRef.current);
        });
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const migrationKey = createLearnMigrationStorageKey(userId);
    if (window.localStorage.getItem(migrationKey)) {
      return;
    }

    const legacyState = readLegacyStoredProgress();
    if (Object.keys(legacyState.lessons).length === 0) {
      return;
    }

    let isCancelled = false;

    writeQueueRef.current = writeQueueRef.current
      .then(async () => {
        const result = await importLegacyLearnProgress(legacyState);
        if (!result.ok || isCancelled) {
          return;
        }

        const nextState = normalizeLearnProgressState(result.state);
        confirmedStateRef.current = nextState;
        stateRef.current = nextState;
        setState(nextState);
        window.localStorage.setItem(migrationKey, "imported");
        window.localStorage.removeItem(LEARN_PROGRESS_STORAGE_KEY);
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const markLessonOpened = useCallback(
    (lesson: LessonDescriptor) => {
      const nextState = upsertLessonState(stateRef.current, lesson, "in_progress");
      if (nextState === stateRef.current) {
        return;
      }

      stateRef.current = nextState;
      setState(nextState);
      enqueueStateSync(lesson, "in_progress");
    },
    [enqueueStateSync],
  );

  const markLessonCompleted = useCallback(
    (lesson: LessonDescriptor) => {
      const nextState = upsertLessonState(stateRef.current, lesson, "completed");
      stateRef.current = nextState;
      setState(nextState);
      enqueueStateSync(lesson, "completed");
    },
    [enqueueStateSync],
  );

  const enqueueBookmarkSync = useCallback(
    (
      target:
        | {
            kind: "module";
            moduleSlug: string;
          }
        | {
            kind: "lesson";
            moduleSlug: string;
            lessonSlug: string;
          },
      bookmarked: boolean,
    ) => {
      bookmarkQueueRef.current = bookmarkQueueRef.current
        .then(async () => {
          const result = await saveLearnBookmark(target, bookmarked);
          if (!result.ok) {
            bookmarkStateRef.current = confirmedBookmarkStateRef.current;
            setBookmarkState(confirmedBookmarkStateRef.current);
            return;
          }

          const nextState = normalizeLearnBookmarkState(result.state);
          confirmedBookmarkStateRef.current = nextState;
          bookmarkStateRef.current = nextState;
          setBookmarkState(nextState);
        })
        .catch(() => {
          bookmarkStateRef.current = confirmedBookmarkStateRef.current;
          setBookmarkState(confirmedBookmarkStateRef.current);
        });
    },
    [],
  );

  const setModuleBookmarked = useCallback(
    (moduleSlug: string, bookmarked: boolean) => {
      const nextState = setModuleBookmark(bookmarkStateRef.current, moduleSlug, bookmarked);
      bookmarkStateRef.current = nextState;
      setBookmarkState(nextState);
      enqueueBookmarkSync({ kind: "module", moduleSlug }, bookmarked);
    },
    [enqueueBookmarkSync],
  );

  const setLessonBookmarked = useCallback(
    (moduleSlug: string, lessonSlug: string, bookmarked: boolean) => {
      const nextState = setLessonBookmark(
        bookmarkStateRef.current,
        moduleSlug,
        lessonSlug,
        bookmarked,
      );
      bookmarkStateRef.current = nextState;
      setBookmarkState(nextState);
      enqueueBookmarkSync({ kind: "lesson", moduleSlug, lessonSlug }, bookmarked);
    },
    [enqueueBookmarkSync],
  );

  const value = useMemo(
    () => ({
      bookmarkState,
      setLessonBookmarked,
      setModuleBookmarked,
      state,
      markLessonOpened,
      markLessonCompleted,
    }),
    [
      bookmarkState,
      markLessonCompleted,
      markLessonOpened,
      setLessonBookmarked,
      setModuleBookmarked,
      state,
    ],
  );

  return (
    <LearnProgressContext.Provider value={value}>
      {children}
    </LearnProgressContext.Provider>
  );
}

export function useLearnProgress() {
  const context = useContext(LearnProgressContext);
  if (!context) {
    throw new Error("useLearnProgress must be used inside LearnProgressProvider.");
  }

  return context;
}
