import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { moduleCatalog } from "@/content/modules";

export function LearnHub() {
  const featuredModule = moduleCatalog[0];

  return (
    <div className="space-y-10">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-5">
            <Badge>Learn Hub</Badge>
            <div className="space-y-3">
              <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
                {featuredModule.title}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted">
                {featuredModule.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {featuredModule.outcomes.map((outcome, index) => (
                <div
                  className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-4 text-sm leading-7 text-muted"
                  key={outcome}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    0{index + 1}
                  </p>
                  <p className="mt-2">{outcome}</p>
                </div>
              ))}
            </div>
            <Link className="btn-primary" href={`/app/learn/${featuredModule.slug}`}>
              Start Module
            </Link>
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Module flow
              </p>
              {featuredModule.lessonSlugs.map((slug) => (
                <div
                  className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-4 py-4 text-sm text-muted"
                  key={slug}
                >
                  {slug.split("-").join(" ")}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="All Learning Modules"
          title="Module cards stay content-driven and easy to maintain."
          description="These cards extend the signed-in Learn visual language used for derived module and lesson routes."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          {moduleCatalog.map((module) => (
            <Card className="flex h-full flex-col justify-between gap-6 p-8" key={module.slug}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge>{module.level}</Badge>
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {module.duration}
                  </span>
                </div>
                <div className="space-y-3">
                  <CardTitle>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted">
                  {module.lessonSlugs.length} lessons
                </p>
                <Link className="font-semibold text-primary" href={`/app/learn/${module.slug}`}>
                  Open module
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
