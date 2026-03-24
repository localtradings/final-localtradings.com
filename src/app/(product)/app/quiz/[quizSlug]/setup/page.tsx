import type { Metadata } from "next";

import { quizCatalog } from "@/content/quizzes";
import { QuizSetupPage } from "@/features/quiz/quiz-setup-page";

type QuizSetupRouteProps = {
  params: Promise<{
    quizSlug: string;
  }>;
};

export async function generateStaticParams() {
  return quizCatalog.map((quiz) => ({
    quizSlug: quiz.slug,
  }));
}

export async function generateMetadata({
  params,
}: QuizSetupRouteProps): Promise<Metadata> {
  const { quizSlug } = await params;
  const quiz = quizCatalog.find((item) => item.slug === quizSlug);
  return {
    title: quiz?.title ?? "Quiz Setup",
  };
}

export default async function QuizSetupRoute({
  params,
}: QuizSetupRouteProps) {
  const { quizSlug } = await params;
  return <QuizSetupPage quizSlug={quizSlug} />;
}
