import type { Metadata } from "next";

import { quizCatalog } from "@/content/quizzes";
import { QuizSessionPage } from "@/features/quiz/quiz-session-page";

type QuizTakeRouteProps = {
  params: Promise<{
    quizSlug: string;
  }>;
  searchParams: Promise<{
    count?: string;
  }>;
};

export async function generateStaticParams() {
  return quizCatalog.map((quiz) => ({
    quizSlug: quiz.slug,
  }));
}

export async function generateMetadata({
  params,
}: QuizTakeRouteProps): Promise<Metadata> {
  const { quizSlug } = await params;
  const quiz = quizCatalog.find((item) => item.slug === quizSlug);
  return {
    title: quiz?.title ?? "Quiz Session",
  };
}

export default async function QuizTakeRoute({
  params,
  searchParams,
}: QuizTakeRouteProps) {
  const { quizSlug } = await params;
  const { count } = await searchParams;
  const questionCount = Number(count ?? "5");

  return <QuizSessionPage questionCount={questionCount} quizSlug={quizSlug} />;
}
