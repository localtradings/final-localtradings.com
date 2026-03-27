import Link from "next/link";

import { Card } from "@/components/ui/card";
import { moduleCatalog } from "@/content/modules";

const moduleVisuals = {
  "trading-basics": {
    badge: "Core Curriculum",
    badgeClass: "bg-success/14 text-success",
    icon: "auto_stories",
    previewClass:
      "bg-[radial-gradient(circle_at_top,rgba(147,197,253,0.22),transparent_40%),linear-gradient(180deg,#1c2634_0%,#111924_100%)]",
  },
  candlesticks: {
    badge: "Technical",
    badgeClass: "bg-secondary-container/70 text-secondary",
    icon: "candlestick_chart",
    previewClass:
      "bg-[radial-gradient(circle_at_top_left,rgba(244,158,94,0.2),transparent_36%),linear-gradient(180deg,#2b201a_0%,#171c24_100%)]",
  },
  "risk-management": {
    badge: "Important",
    badgeClass: "bg-secondary/14 text-secondary",
    icon: "shield",
    previewClass:
      "bg-[radial-gradient(circle_at_top,rgba(134,239,172,0.18),transparent_34%),linear-gradient(180deg,#16201c_0%,#111924_100%)]",
  },
  "trade-planning": {
    badge: "Workflow",
    badgeClass: "bg-primary/12 text-primary",
    icon: "task_alt",
    previewClass:
      "bg-[radial-gradient(circle_at_top_right,rgba(190,175,247,0.16),transparent_38%),linear-gradient(180deg,#171d29_0%,#111924_100%)]",
  },
} as const;

export function LearnHub() {
  const featuredModule = moduleCatalog[0];

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="flex items-center gap-3 font-heading text-[2.2rem] font-extrabold tracking-tight sm:text-[2.8rem]">
            LEARN <span className="font-light text-primary/35">Learn</span>
          </h1>
        </div>

        <div className="overflow-hidden rounded-[calc(var(--radius-xl)+0.35rem)] border border-outline/15 bg-surface-high shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <div className="grid gap-0 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-6 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                <span className="rounded-full bg-success/14 px-3 py-1 text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-success">
                  Core Curriculum
                </span>
                <span>{featuredModule.lessonSlugs.length} lessons</span>
                <span className="text-outline">•</span>
                <span>35 min</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-balance font-heading text-[2.35rem] font-extrabold tracking-tight sm:text-[3.2rem] sm:leading-[1]">
                  {featuredModule.title}
                </h2>
                <p className="max-w-2xl text-base leading-8 text-muted">
                  {featuredModule.description}
                </p>
              </div>
              <div className="space-y-4">
                {featuredModule.outcomes.map((outcome, index) => (
                  <div className="flex items-center gap-3 text-sm text-foreground/85" key={outcome}>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-[0.65rem] font-extrabold text-primary">
                      0{index + 1}
                    </span>
                    <span className="font-medium">{outcome}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link className="btn-primary" href={`/app/learn/${featuredModule.slug}`}>
                  Start Module
                </Link>
                <Link className="btn-secondary" href={`/app/learn/${featuredModule.slug}`}>
                  View Lessons
                </Link>
              </div>
            </div>

            <div className="relative min-h-72 overflow-hidden border-t border-outline/15 bg-surface-highest lg:min-h-full lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(156,202,255,0.14),transparent_36%)]" />
              <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(9,15,21,0.9))]" />
              <div className="relative flex h-full flex-col justify-between p-8">
                <div className="self-end rounded-[var(--radius-xl)] border border-primary/15 bg-primary/12 px-5 py-4 text-right">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    auto_stories
                  </span>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Module 01
                  </p>
                </div>
                <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface/35 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    Module flow
                  </p>
                  <div className="mt-4 space-y-3">
                    {featuredModule.lessonSlugs.map((slug) => (
                      <div
                        className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-high/90 px-4 py-3 text-sm font-medium text-foreground/88"
                        key={slug}
                      >
                        {slug.split("-").join(" ")}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h3 className="font-heading text-[1.9rem] font-extrabold tracking-tight">
              All Learning Modules
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {["Level: All", "Topic: Core", "Length: Short"].map((filter) => (
              <div
                className="flex min-h-11 items-center rounded-full border border-outline/15 bg-surface-high px-5 text-sm font-semibold text-muted"
                key={filter}
              >
                {filter}
              </div>
            ))}
            <button className="min-h-11 px-3 text-sm font-bold text-primary" type="button">
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {moduleCatalog.map((module) => {
            const visual = moduleVisuals[module.slug as keyof typeof moduleVisuals];

            return (
              <Card
                className="group flex h-full flex-col rounded-[calc(var(--radius-xl)+0.15rem)] border-outline/10 bg-surface-high p-5 transition hover:border-primary/30"
                key={module.slug}
              >
                <div
                  className={`mb-5 aspect-video overflow-hidden rounded-[var(--radius-xl)] border border-outline/15 ${visual.previewClass}`}
                >
                  <div className="flex h-full flex-col justify-between p-5">
                    <span className="material-symbols-outlined text-4xl text-white/75">
                      {visual.icon}
                    </span>
                    <div className="flex items-end gap-2">
                      {[0.34, 0.54, 0.7, 0.5, 0.82].map((value, index) => (
                        <span
                          className="flex-1 rounded-t-full bg-white/70 transition duration-300 group-hover:bg-primary"
                          key={`${module.slug}-${index}`}
                          style={{ height: `${value * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.22em] ${visual.badgeClass}`}
                    >
                      {visual.badge}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {module.duration}
                    </span>
                  </div>
                  <h4 className="font-heading text-[1.45rem] font-extrabold tracking-tight">
                    {module.title}
                  </h4>
                  <p className="mt-3 flex-1 text-sm leading-7 text-muted">
                    {module.description}
                  </p>
                  <Link
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-lg)] border border-outline/10 bg-surface-highest px-4 text-sm font-bold text-foreground transition hover:bg-primary hover:text-black"
                    href={`/app/learn/${module.slug}`}
                  >
                    Start Module
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-black">
            1
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-muted">
            2
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-muted">
            3
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted">
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </span>
        </div>
      </section>
    </div>
  );
}
