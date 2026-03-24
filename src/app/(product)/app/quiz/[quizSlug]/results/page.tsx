import type { Metadata } from "next";

import { quizCatalog } from "@/content/quizzes";
import { QuizResultsPage } from "@/features/quiz/quiz-results-page";

type QuizResultsRouteProps = {
  params: Promise<{
    quizSlug: string;
  }>;
  searchParams: Promise<{
    score?: string;
    total?: string;
  }>;
};

export async function generateStaticParams() {
  return quizCatalog.map((quiz) => ({
    quizSlug: quiz.slug,
  }));
}

export async function generateMetadata({
  params,
}: QuizResultsRouteProps): Promise<Metadata> {
  const { quizSlug } = await params;
  const quiz = quizCatalog.find((item) => item.slug === quizSlug);
  return {
    title: quiz?.title ?? "Quiz Results",
  };
}

export default async function QuizResultsRoute({
  params,
  searchParams,
}: QuizResultsRouteProps) {
  const { quizSlug } = await params;
  const { score, total } = await searchParams;

  return (
    <QuizResultsPage
      quizSlug={quizSlug}
      score={Number(score ?? "0")}
      total={Number(total ?? "0")}
    />
  );
}
