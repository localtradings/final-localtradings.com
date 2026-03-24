"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuizAttemptRecord } from "@/types/data";

export async function saveQuizAttempt(attempt: QuizAttemptRecord) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" as const };
  }

  const { error } = await supabase.from("quiz_attempts").insert({
    user_id: user.id,
    quiz_slug: attempt.quizSlug,
    score: attempt.score,
    total_questions: attempt.totalQuestions,
    answers: attempt.answers,
  });

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
