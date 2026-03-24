import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";

export function DashboardHome() {
  return (
    <div className="space-y-10">
      <section className="card-surface relative overflow-hidden rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_16%,transparent),transparent_38%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr,auto] lg:items-end">
          <div className="space-y-5">
            <Badge>Dashboard</Badge>
            <div className="space-y-3">
              <h1 className="text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                Choose where to continue: Learn, Quiz, or Backtesting.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                This signed-in home keeps the same cool-dark product language as
                the Stitch dashboard while using the final launch scope from the
                docs.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link className="btn-primary" href="/app/learn">
              Learn
            </Link>
            <Link className="btn-secondary" href="/app/quiz">
              Quiz
            </Link>
            <Link className="btn-secondary" href="/app/backtesting">
              Backtesting
            </Link>
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
          <Card className="flex h-full flex-col justify-between gap-8 p-8" key={item.title}>
            <div className="space-y-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-primary/12 text-primary">
                <span className="material-symbols-outlined text-[1.55rem]">
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
          <SectionHeading
            eyebrow="Popular Topics"
            title="Start with the core learning modules."
            description="The dashboard points directly into the content catalog instead of showing fake community or notification widgets."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {moduleCatalog.slice(0, 4).map((module) => (
              <Link
                className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5 transition hover:border-primary/30 hover:bg-surface-high"
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
          <SectionHeading
            eyebrow="Quiz Queue"
            title="Recommended checks"
            description="Topic-based quizzes reinforce what you just studied."
          />
          <div className="mt-8 space-y-4">
            {quizCatalog.slice(0, 3).map((quiz) => (
              <Link
                className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-5 py-4 transition hover:border-primary/30 hover:bg-surface-high"
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
