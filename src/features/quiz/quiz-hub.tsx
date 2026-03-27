import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { quizCatalog } from "@/content/quizzes";

export function QuizHub() {
  const featuredQuiz = quizCatalog[0];

  return (
    <div className="space-y-8">
      <section className="card-surface relative overflow-hidden rounded-[var(--radius-lg)] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[linear-gradient(180deg,rgba(147,197,253,0.08),transparent)] lg:block" />
        <div className="relative grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
          <div className="space-y-4">
            <Badge>Quiz Hub</Badge>
            <div className="space-y-3">
              <h1 className="font-heading text-[2.4rem] font-extrabold tracking-tight sm:text-[3.4rem] sm:leading-[0.98]">
                {featuredQuiz.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                {featuredQuiz.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="glass-strip rounded-full px-4 py-2 text-sm text-muted">{featuredQuiz.category}</span>
              <span className="glass-strip rounded-full px-4 py-2 text-sm text-muted">{featuredQuiz.estimatedMinutes} min</span>
              <span className="glass-strip rounded-full px-4 py-2 text-sm text-muted">{featuredQuiz.recommendedQuestionCount} questions</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href={`/app/quiz/${featuredQuiz.slug}/setup`}>
                Start Quiz
              </Link>
              <Link className="btn-secondary" href="/app/learn">
                View Topics
              </Link>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low/70 p-5">
            <p className="eyebrow">Quiz flow</p>
            <div className="mt-4 h-40 rounded-[var(--radius-md)] border border-outline/10 bg-[linear-gradient(180deg,rgba(147,197,253,0.08),transparent)] p-3">
              <div className="flex h-full items-end gap-2">
                {[52, 46, 64, 72, 58, 88, 96, 84, 112, 104, 126].map((height, index) => (
                  <span
                    className="flex-1 rounded-t-full bg-[linear-gradient(180deg,var(--primary),var(--primary-dim))] opacity-85"
                    key={`${height}-${index}`}
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              {["Setup", "Take", "Results"].map((item, index) => (
                <div className="rounded-[var(--radius-md)] border border-outline/15 bg-surface-high/50 px-4 py-3" key={item}>
                  0{index + 1} · {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">All Quiz Packs</p>
            <h2 className="mt-3 font-heading text-[2rem] font-extrabold tracking-tight">
              Separate routes keep the flow readable
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low/60 px-4 py-3 text-sm text-muted">
            <span>Level: All</span>
            <span>Topic: All</span>
            <span>Format: All</span>
            <span className="ml-auto text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Reset
            </span>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {quizCatalog.map((quiz) => (
            <Card className="flex h-full flex-col justify-between gap-6 p-7" key={quiz.slug}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge>{quiz.difficulty}</Badge>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                    {quiz.questions.length} questions
                  </span>
                </div>
                <div className="space-y-3">
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>{quiz.summary}</CardDescription>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-outline/10 pt-5">
                <div className="flex flex-wrap gap-2 text-[11px] text-muted">
                  <span className="rounded-full border border-outline/15 px-3 py-1">
                    {quiz.category}
                  </span>
                  <span className="rounded-full border border-outline/15 px-3 py-1">
                    {quiz.estimatedMinutes} min
                  </span>
                </div>
                <Link className="font-semibold text-primary" href={`/app/quiz/${quiz.slug}/setup`}>
                  Start
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "Go to Learn", href: "/app/learn" },
          { title: "Try Backtesting", href: "/app/backtesting" },
          { title: "Ask for Help", href: "/app/help" },
        ].map((item) => (
          <Link
            className="card-surface rounded-[var(--radius-lg)] px-5 py-5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/30"
            href={item.href}
            key={item.href}
          >
            {item.title}
          </Link>
        ))}
      </section>
    </div>
  );
}
