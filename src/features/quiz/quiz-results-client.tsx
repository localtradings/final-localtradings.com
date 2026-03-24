"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { QuizDefinition } from "@/types/content";

type StoredResult = {
  score: number;
  total: number;
  review: Array<{
    questionId: string;
    prompt: string;
    answerId: string | null;
    correctAnswerId: string;
    explanation: string;
  }>;
};

type QuizResultsClientProps = {
  quiz: QuizDefinition;
  fallbackScore: number;
  fallbackTotal: number;
};

export function QuizResultsClient({
  quiz,
  fallbackScore,
  fallbackTotal,
}: QuizResultsClientProps) {
  const [result] = useState<StoredResult | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(`quiz-result:${quiz.slug}`);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredResult;
    } catch {
      return null;
    }
  });

  const score = result?.score ?? fallbackScore;
  const total = result?.total ?? fallbackTotal;
  const review = result?.review ?? [];

  return (
    <div className="space-y-8">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr,auto] lg:items-end">
          <div className="space-y-4">
            <Badge>Quiz Complete</Badge>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                {quiz.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                Review what you understood, then decide whether to retake the
                quiz or return to the related lessons.
              </p>
            </div>
          </div>
          <Card className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Score
            </p>
            <p className="mt-3 font-heading text-4xl font-extrabold tracking-tight">
              {score}/{total}
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Accuracy
          </p>
          <p className="mt-3 font-heading text-3xl font-extrabold tracking-tight">
            {Math.round((score / Math.max(total, 1)) * 100)}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Category
          </p>
          <p className="mt-3 text-sm text-muted">{quiz.category}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Next best move
          </p>
          <p className="mt-3 text-sm text-muted">
            Review the related lessons if any answer still feels uncertain.
          </p>
        </Card>
      </section>

      {review.length > 0 ? (
        <section className="space-y-4">
          {review.map((item, index) => {
            const chosen = quiz.questions
              .find((question) => question.id === item.questionId)
              ?.options.find((option) => option.id === item.answerId);
            const correct = quiz.questions
              .find((question) => question.id === item.questionId)
              ?.options.find((option) => option.id === item.correctAnswerId);

            return (
              <Card className="p-6" key={item.questionId}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Question 0{index + 1}
                </p>
                <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight">
                  {item.prompt}
                </h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Your answer
                    </p>
                    <p className="mt-2 text-sm text-muted">
                      {chosen?.label ?? "No answer recorded"}
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Correct answer
                    </p>
                    <p className="mt-2 text-sm text-muted">{correct?.label}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {item.explanation}
                </p>
              </Card>
            );
          })}
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link className="btn-primary" href={`/app/quiz/${quiz.slug}/setup`}>
          Retake Quiz
        </Link>
        <Link className="btn-secondary" href="/app/learn">
          Review Lessons
        </Link>
        <Link className="btn-secondary" href="/app/backtesting">
          Try Backtesting
        </Link>
      </div>
    </div>
  );
}
