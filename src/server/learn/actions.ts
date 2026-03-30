"use server";

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

import { getLearnProgressState } from "./queries";

type LearnProgressActionResult =
  | {
      ok: true;
      state: LearnProgressState;
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
