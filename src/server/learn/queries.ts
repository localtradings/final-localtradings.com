import "server-only";

import {
  createLearnProgressState,
  createLessonKey,
  emptyProgressState,
  type LearnLessonProgress,
  type LearnProgressState,
} from "@/features/learn/progress-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LearnLessonProgressRow = {
  user_id: string;
  module_slug: string;
  lesson_slug: string;
  status: "in_progress" | "completed";
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

function normalizeLearnLessonProgressRow(
  row: LearnLessonProgressRow,
): LearnLessonProgress {
  return {
    moduleSlug: row.module_slug,
    lessonSlug: row.lesson_slug,
    status: row.status,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export async function getLearnProgressState(
  userId: string | null | undefined,
): Promise<LearnProgressState> {
  if (!userId) {
    return emptyProgressState;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return emptyProgressState;
  }

  const { data, error } = await supabase
    .from("learn_lesson_progress")
    .select(
      "user_id, module_slug, lesson_slug, status, started_at, updated_at, completed_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return emptyProgressState;
  }

  const lessons = (data as LearnLessonProgressRow[]).reduce<
    Record<string, LearnLessonProgress>
  >((accumulator, row) => {
    const progress = normalizeLearnLessonProgressRow(row);
    accumulator[createLessonKey(progress.moduleSlug, progress.lessonSlug)] = progress;
    return accumulator;
  }, {});

  return createLearnProgressState(lessons);
}
