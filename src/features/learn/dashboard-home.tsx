import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";

export function DashboardHome() {
  return (
    <div className="space-y-8">
      <section className="card-surface relative overflow-hidden rounded-[var(--radius-lg)] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,197,253,0.14),transparent_42%)]" />
        <div className="relative grid gap-8 xl:grid-cols-[1fr,auto] xl:items-center">
          <div className="space-y-4">
            <Badge>Dashboard</Badge>
            <div className="space-y-3">
              <h1 className="text-balance font-heading text-[2.4rem] font-extrabold tracking-tight sm:text-[3.5rem] sm:leading-[0.98]">
                Welcome
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                Choose where you want to start.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/app/learn">
                Start Learning
              </Link>
              <Link className="btn-secondary" href="/app/learn">
                Browse Topics
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Lessons complete", value: "12" },
              { label: "Average quiz score", value: "82%" },
            ].map((item) => (
              <div
                className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low/80 px-6 py-5"
                key={item.label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                  {item.label}
                </p>
                <p className="mt-3 font-heading text-5xl font-extrabold tracking-tight text-primary">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Learn",
            description:
              "Move through modules and lessons that stay readable on every screen size.",
            icon: "school",
            href: "/app/learn",
          },
          {
            title: "Quiz",
            description:
              "Use separate setup, session, and results routes to test understanding cleanly.",
            icon: "quiz",
            href: "/app/quiz",
          },
          {
            title: "Backtesting",
            description:
              "Replay historical price action, define a trade plan, and review process quality.",
            icon: "query_stats",
            href: "/app/backtesting",
          },
        ].map((item) => (
          <Card className="flex h-full flex-col justify-between gap-7 p-7" key={item.title}>
            <div className="space-y-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary/12 text-primary">
                <span className="material-symbols-outlined text-[1.4rem]">
                  {item.icon}
                </span>
              </span>
              <div className="space-y-3">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </div>
            </div>
            <Link className="font-semibold text-primary" href={item.href}>
              Open
            </Link>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Popular Topics</p>
              <h2 className="mt-3 font-heading text-[2rem] font-extrabold tracking-tight">
                Recommended modules for your level
              </h2>
            </div>
            <Link className="text-sm font-semibold text-primary" href="/app/learn">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {moduleCatalog.slice(0, 4).map((module) => (
              <Link
                className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low p-5 transition hover:border-primary/30 hover:bg-surface-high"
                href={`/app/learn/${module.slug}`}
                key={module.slug}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {module.level}
                </p>
                <h3 className="mt-3 font-heading text-xl font-extrabold tracking-tight">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {module.description}
                </p>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <p className="eyebrow">Quiz queue</p>
          <h2 className="mt-3 font-heading text-[2rem] font-extrabold tracking-tight">
            Recommended checks
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Topic-based quizzes reinforce what you just studied.
          </p>
          <div className="mt-8 space-y-4">
            {quizCatalog.slice(0, 3).map((quiz) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low px-5 py-4 transition hover:border-primary/30 hover:bg-surface-high"
                href={`/app/quiz/${quiz.slug}/setup`}
                key={quiz.slug}
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{quiz.title}</p>
                  <p className="text-sm text-muted">
                    {quiz.estimatedMinutes} min • {quiz.category}
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary">
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
