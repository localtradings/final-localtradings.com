import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, ClipboardCheck, Timer, Trophy } from "lucide-react";

import { quizCatalog } from "@/content/quizzes";

function QuizMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-white/10 px-4 py-3 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <div className="flex items-center gap-2 text-white/52">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</p>
      </div>
      <p className="mt-2 text-[1.45rem] font-semibold tracking-normal text-white">{value}</p>
    </div>
  );
}

export function QuizHub() {
  const featuredQuiz = quizCatalog[0];
  const totalQuestions = quizCatalog.reduce((total, quiz) => total + quiz.questions.length, 0);
  const totalMinutes = quizCatalog.reduce((total, quiz) => total + quiz.estimatedMinutes, 0);

  return (
    <div className="space-y-4 pb-6">
      <section className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,17,22,0.98),rgba(8,10,14,0.98))]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="px-4 py-5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                Quiz hub
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-sky-300/20 bg-sky-300/10 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100">
                Learn linked
              </span>
            </div>
            <h1 className="mt-4 max-w-[15ch] text-[2.15rem] font-semibold tracking-normal text-white sm:text-[3rem] sm:leading-[0.92]">
              Check the lessons before you trade them.
            </h1>
            <p className="mt-3 max-w-[48rem] text-[13px] leading-6 text-white/64 sm:text-[14px]">
              Every quiz maps back to Learn topics. Use setup, take, and results routes to expose weak
              context before you move into backtesting or Battle.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="btn-primary min-h-10 px-4 py-2.5 text-xs" href={`/app/quiz/${featuredQuiz.slug}/setup`}>
                Start recommended quiz
              </Link>
              <Link className="btn-secondary min-h-10 px-4 py-2.5 text-xs" href="/app/learn">
                Open Learn context
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/18 xl:border-l xl:border-t-0">
            <QuizMetric
              icon={<ClipboardCheck className="h-4 w-4" strokeWidth={1.9} />}
              label="Quiz packs"
              value={`${quizCatalog.length}`}
            />
            <QuizMetric
              icon={<BookOpen className="h-4 w-4" strokeWidth={1.9} />}
              label="Questions"
              value={`${totalQuestions}`}
            />
            <QuizMetric
              icon={<Timer className="h-4 w-4" strokeWidth={1.9} />}
              label="Total time"
              value={`${totalMinutes}m`}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,25,0.98),rgba(10,13,18,0.98))]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
              Available checks
            </p>
            <h2 className="mt-1 text-[1.08rem] font-semibold tracking-normal text-white">
              Pick a topic, take the quiz, then review results.
            </h2>
          </div>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/9"
            href="/app/learn"
          >
            Study topics
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>

        <div className="divide-y divide-white/8">
          {quizCatalog.map((quiz) => (
            <Link
              className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.035] sm:grid-cols-[minmax(0,1fr)_10rem_7rem_auto] sm:items-center sm:px-5"
              href={`/app/quiz/${quiz.slug}/setup`}
              key={quiz.slug}
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/46">
                  {quiz.category} / {quiz.difficulty}
                </p>
                <h3 className="mt-1 text-[1rem] font-semibold tracking-normal text-white">
                  {quiz.title}
                </h3>
                <p className="mt-1 max-w-[42rem] text-[12px] leading-5 text-white/58">
                  {quiz.summary}
                </p>
              </div>
              <span className="text-[12px] text-white/66">{quiz.questions.length} questions</span>
              <span className="text-[12px] text-white/66">{quiz.estimatedMinutes} min</span>
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-amber-100">
                Start
                <Trophy className="h-4 w-4" strokeWidth={1.8} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        {[
          { title: "Study context", detail: "Read the lesson before checking recall.", href: "/app/learn" },
          { title: "Practice execution", detail: "Apply the idea in the backtesting workspace.", href: "/app/backtesting" },
          { title: "Battle pressure", detail: "Compete only after the concept is clear.", href: "/app/battle" },
        ].map((item) => (
          <Link
            className="rounded-[1rem] border border-white/10 bg-white/[0.025] px-4 py-4 transition hover:bg-white/[0.045]"
            href={item.href}
            key={item.href}
          >
            <p className="text-[14px] font-semibold tracking-normal text-white">{item.title}</p>
            <p className="mt-1 text-[12px] leading-5 text-white/58">{item.detail}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
