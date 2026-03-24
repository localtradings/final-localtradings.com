import { notFound } from "next/navigation";

import { getQuizBySlug } from "@/content/quizzes";

import { QuizResultsClient } from "./quiz-results-client";

type QuizResultsPageProps = {
  quizSlug: string;
  score: number;
  total: number;
};

export function QuizResultsPage({
  quizSlug,
  score,
  total,
}: QuizResultsPageProps) {
  const quiz = getQuizBySlug(quizSlug);
  if (!quiz) {
    notFound();
  }

  return <QuizResultsClient fallbackScore={score} fallbackTotal={total} quiz={quiz} />;
}
