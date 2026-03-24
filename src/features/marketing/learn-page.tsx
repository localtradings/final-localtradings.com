import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { StatsRow } from "@/components/patterns/stats-row";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { moduleCatalog } from "@/content/modules";
import { learnCopy } from "@/content/marketing/site-copy";

export function MarketingLearnPage() {
  return (
    <main className="theme-marketing">
      <section className="px-6 py-18 sm:py-24">
        <div className="shell-width grid gap-12 lg:grid-cols-[1fr,0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge>Public Learn preview</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
                Learn the mechanics before you chase setups.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                The public Learn page previews the curriculum and tone. The
                signed-in Learn hub is where modules, lessons, and progress
                live.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {learnCopy.heroPoints.map((point) => (
                <div
                  className="rounded-[var(--radius-xl)] border border-outline/20 bg-surface-high/70 px-4 py-4 text-sm leading-7 text-muted"
                  key={point}
                >
                  {point}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/sign-up">
                Start Learning
              </Link>
              <Link className="btn-secondary" href="/help">
                Read Help
              </Link>
            </div>
          </div>
          <Card className="p-6">
            <StatsRow
              items={[
                { label: "Launch modules", value: `${moduleCatalog.length}` },
                { label: "Lesson format", value: "MDX" },
                { label: "Quiz path", value: "Separate" },
                { label: "Tone", value: "Beginner" },
              ]}
            />
          </Card>
        </div>
      </section>

      <section className="bg-surface-low/70 px-6 py-20">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="What you’ll see inside"
            title="A calm curriculum built for consistent review."
            description="The structure follows the docs: content-driven modules, thin route files, and no invented database complexity for lesson bodies."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {learnCopy.previewBenefits.map((item) => (
              <Card className="p-6" key={item.title}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary/12 text-primary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </span>
                <CardTitle className="mt-5">{item.title}</CardTitle>
                <CardDescription className="mt-3">
                  {item.description}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="Topics you can learn"
            title="Preview the launch curriculum."
            description="These module cards use the same content catalog that powers the signed-in Learn experience."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {moduleCatalog.map((module) => (
              <Card className="flex h-full flex-col justify-between gap-8 p-8" key={module.slug}>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>{module.level}</Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      {module.duration}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                  <ul className="grid gap-2">
                    {module.outcomes.map((outcome) => (
                      <li
                        className="flex items-start gap-3 text-sm leading-7 text-muted"
                        key={outcome}
                      >
                        <span className="material-symbols-outlined mt-1 text-base text-primary">
                          done
                        </span>
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link className="font-semibold text-primary" href="/sign-up">
                  Unlock this module
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card className="p-8">
            <SectionHeading
              eyebrow="Inside your account"
              title="Learn connects directly to quiz and backtesting."
              description="Public pages introduce the structure. Signed-in routes carry the real module pages, lesson pages, quiz setup, and practice workflows."
            />
          </Card>
          <Card className="p-8">
            <h3 className="font-heading text-2xl font-extrabold tracking-tight">
              FAQ
            </h3>
            <div className="mt-6 space-y-5">
              {learnCopy.faq.map((item) => (
                <div className="space-y-2" key={item.question}>
                  <h4 className="font-semibold text-foreground">{item.question}</h4>
                  <p className="text-sm leading-7 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
