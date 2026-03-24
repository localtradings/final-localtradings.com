import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { quizCatalog } from "@/content/quizzes";

export function QuizHub() {
  const featuredQuiz = quizCatalog[0];

  return (
    <div className="space-y-10">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-5">
            <Badge>Quiz Hub</Badge>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                {featuredQuiz.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                {featuredQuiz.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full border border-outline/15 bg-surface-low px-4 py-2 text-sm text-muted">
                {featuredQuiz.category}
              </span>
              <span className="rounded-full border border-outline/15 bg-surface-low px-4 py-2 text-sm text-muted">
                {featuredQuiz.estimatedMinutes} min
              </span>
            </div>
            <Link className="btn-primary" href={`/app/quiz/${featuredQuiz.slug}/setup`}>
              Start Quiz
            </Link>
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Quiz flow
            </p>
            <div className="mt-5 grid gap-3">
              {["Setup", "Take", "Results"].map((item, index) => (
                <div
                  className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-4 py-4 text-sm text-muted"
                  key={item}
                >
                  0{index + 1} · {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="All Quiz Packs"
          title="Separate routes keep the quiz flow readable."
          description="Quiz setup, quiz-taking, and results are intentionally separate screens in the final route map."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {quizCatalog.map((quiz) => (
            <Card className="flex h-full flex-col justify-between gap-6 p-8" key={quiz.slug}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge>{quiz.difficulty}</Badge>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {quiz.category}
                  </span>
                </div>
                <div className="space-y-3">
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.summary}</CardDescription>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  {quiz.recommendedQuestionCount} questions
                </p>
                <Link className="font-semibold text-primary" href={`/app/quiz/${quiz.slug}/setup`}>
                  Open setup
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
