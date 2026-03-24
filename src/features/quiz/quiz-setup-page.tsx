import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getQuizBySlug } from "@/content/quizzes";

import { QuizSetupForm } from "./quiz-setup-form";

type QuizSetupPageProps = {
  quizSlug: string;
};

export function QuizSetupPage({ quizSlug }: QuizSetupPageProps) {
  const quiz = getQuizBySlug(quizSlug);
  if (!quiz) {
    notFound();
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr,0.9fr]">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="space-y-5">
          <Badge>Quiz Setup</Badge>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              {quiz.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted">
              {quiz.summary}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Difficulty
              </p>
              <p className="mt-3 text-sm text-muted">{quiz.difficulty}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Category
              </p>
              <p className="mt-3 text-sm text-muted">{quiz.category}</p>
            </Card>
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Estimated time
              </p>
              <p className="mt-3 text-sm text-muted">{quiz.estimatedMinutes} minutes</p>
            </Card>
          </div>
        </div>
      </section>
      <Card className="h-fit p-8">
        <QuizSetupForm
          quizSlug={quiz.slug}
          recommendedQuestionCount={quiz.recommendedQuestionCount}
        />
      </Card>
    </div>
  );
}
