"use server";

import {
  type LearnBookmarkState,
  type LearnBookmarkTarget,
  emptyBookmarkState,
} from "@/features/learn/bookmark-state";
import {
  createLessonKey,
  emptyProgressState,
  mergeLearnProgressStates,
  normalizeLearnProgressState,
  upsertLessonState,
  type LearnProgressState,
  type LearnLessonProgress,
  type LearnLessonStatus,
  type LessonDescriptor,
} from "@/features/learn/progress-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { getLearnBookmarkState, getLearnProgressState } from "./queries";

type LearnProgressActionResult =
  | {
      ok: true;
      state: LearnProgressState;
    }
  | {
      ok: false;
      reason: string;
    };

type LearnBookmarkActionResult =
  | {
      ok: true;
      state: LearnBookmarkState;
    }
  | {
      ok: false;
      reason: string;
    };

function toLessonRow(
  userId: string,
  lesson: LearnLessonProgress,
) {
  return {
    user_id: userId,
    module_slug: lesson.moduleSlug,
    lesson_slug: lesson.lessonSlug,
    status: lesson.status,
    started_at: lesson.startedAt,
    updated_at: lesson.updatedAt,
    completed_at: lesson.completedAt ?? null,
  };
}

function toBookmarkRow(userId: string, target: LearnBookmarkTarget) {
  return {
    user_id: userId,
    item_type: target.kind,
    module_slug: target.moduleSlug,
    lesson_slug: target.kind === "lesson" ? target.lessonSlug : "",
    updated_at: new Date().toISOString(),
  };
}

export async function saveLearnLessonProgress(
  lesson: LessonDescriptor,
  status: LearnLessonStatus,
): Promise<LearnProgressActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const currentState = await getLearnProgressState(user.id);
  const nextState = upsertLessonState(currentState, lesson, status);

  if (nextState === currentState) {
    return { ok: true, state: currentState };
  }

  const lessonKey = createLessonKey(lesson.moduleSlug, lesson.lessonSlug);
  const targetLesson = nextState.lessons[lessonKey];

  const { error } = await supabase.from("learn_lesson_progress").upsert(
    toLessonRow(user.id, targetLesson),
    { onConflict: "user_id,module_slug,lesson_slug" },
  );

  if (error) {
    return { ok: false, reason: error.message };
  }

  return {
    ok: true,
    state: await getLearnProgressState(user.id),
  };
}

export async function importLegacyLearnProgress(
  payload: LearnProgressState,
): Promise<LearnProgressActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const importedState = normalizeLearnProgressState(payload);
  if (Object.keys(importedState.lessons).length === 0) {
    return {
      ok: true,
      state: await getLearnProgressState(user.id),
    };
  }

  const currentState = await getLearnProgressState(user.id);
  const mergedState = mergeLearnProgressStates(currentState, importedState);

  const rows = Object.values(mergedState.lessons).map((lesson) => toLessonRow(user.id, lesson));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("learn_lesson_progress")
      .upsert(rows, { onConflict: "user_id,module_slug,lesson_slug" });

    if (error) {
      return { ok: false, reason: error.message };
    }
  }

  return {
    ok: true,
    state: rows.length > 0 ? await getLearnProgressState(user.id) : currentState ?? emptyProgressState,
  };
}

export async function saveLearnBookmark(
  target: LearnBookmarkTarget,
  bookmarked: boolean,
): Promise<LearnBookmarkActionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  if (bookmarked) {
    const { error } = await supabase
      .from("learn_bookmarks")
      .upsert(toBookmarkRow(user.id, target), {
        onConflict: "user_id,item_type,module_slug,lesson_slug",
      });

    if (error) {
      return { ok: false, reason: error.message };
    }
  } else {
    const query = supabase
      .from("learn_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("item_type", target.kind)
      .eq("module_slug", target.moduleSlug);

    const { error } =
      target.kind === "lesson"
        ? await query.eq("lesson_slug", target.lessonSlug)
        : await query.eq("lesson_slug", "");

    if (error) {
      return { ok: false, reason: error.message };
    }
  }

  return {
    ok: true,
    state: (await getLearnBookmarkState(user.id)) ?? emptyBookmarkState,
  };
}
