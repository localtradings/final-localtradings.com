import { notFound } from "next/navigation";

import { getQuizBySlug } from "@/content/quizzes";

import { QuizSessionClient } from "./quiz-session-client";

type QuizSessionPageProps = {
  quizSlug: string;
  questionCount: number;
};

export function QuizSessionPage({
  quizSlug,
  questionCount,
}: QuizSessionPageProps) {
  const quiz = getQuizBySlug(quizSlug);
  if (!quiz) {
    notFound();
  }

  return <QuizSessionClient questionCount={questionCount} quiz={quiz} />;
}
