"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { saveQuizAttempt } from "@/server/quiz/actions";
import type { QuizDefinition } from "@/types/content";

type QuizSessionClientProps = {
  quiz: QuizDefinition;
  questionCount: number;
};

export function QuizSessionClient({
  quiz,
  questionCount,
}: QuizSessionClientProps) {
  const router = useRouter();
  const questions = useMemo(
    () => quiz.questions.slice(0, Math.min(questionCount, quiz.questions.length)),
    [questionCount, quiz.questions],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[index];
  const isLastQuestion = index === questions.length - 1;
  const selectedAnswer = answers[currentQuestion.id];

  function handleFinish() {
    const score = questions.reduce((total, question) => {
      return total + Number(answers[question.id] === question.answerId);
    }, 0);

    const review = questions.map((question) => ({
      questionId: question.id,
      prompt: question.prompt,
      answerId: answers[question.id] ?? null,
      correctAnswerId: question.answerId,
      explanation: question.explanation,
    }));

    localStorage.setItem(
      `quiz-result:${quiz.slug}`,
      JSON.stringify({
        score,
        total: questions.length,
        review,
      }),
    );

    startTransition(async () => {
      await saveQuizAttempt({
        quizSlug: quiz.slug,
        score,
        totalQuestions: questions.length,
        answers: questions.map((question) => ({
          questionId: question.id,
          answerId: answers[question.id] ?? "",
          isCorrect: answers[question.id] === question.answerId,
        })),
      });
    });

    router.push(`/app/quiz/${quiz.slug}/results?score=${score}&total=${questions.length}`);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr,0.8fr]">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Quiz Session
              </p>
              <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                {quiz.title}
              </h1>
            </div>
            <p className="text-sm text-muted">
              Question {index + 1} of {questions.length}
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface-low">
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,var(--primary),var(--primary-dim))]"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
          <Card className="p-6">
            <p className="text-lg font-semibold leading-8 text-foreground">
              {currentQuestion.prompt}
            </p>
            <div className="mt-6 grid gap-3">
              {currentQuestion.options.map((option) => (
                <button
                  className={`rounded-[var(--radius-xl)] border px-4 py-4 text-left text-sm transition ${
                    selectedAnswer === option.id
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-outline/15 bg-surface-low text-muted hover:border-primary/25 hover:bg-surface-high"
                  }`}
                  key={option.id}
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: option.id,
                    }))
                  }
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Card>
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              disabled={index === 0}
              onClick={() => setIndex((current) => Math.max(current - 1, 0))}
              type="button"
              variant="secondary"
            >
              Previous
            </Button>
            {isLastQuestion ? (
              <Button disabled={!selectedAnswer} onClick={handleFinish} type="button">
                Finish Quiz
              </Button>
            ) : (
              <Button
                disabled={!selectedAnswer}
                onClick={() =>
                  setIndex((current) => Math.min(current + 1, questions.length - 1))
                }
                type="button"
              >
                Next Question
              </Button>
            )}
          </div>
        </div>
      </section>
      <Card className="h-fit p-8">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">
          Session cues
        </h2>
        <ul className="mt-5 grid gap-3">
          {[
            "Answer based on the lesson logic, not speed.",
            "Use the explanation review to close knowledge gaps.",
            "Retry weak topics after reviewing the related lesson.",
          ].map((item) => (
            <li
              className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-4 py-4 text-sm leading-7 text-muted"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
