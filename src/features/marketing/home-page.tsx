import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { StatsRow } from "@/components/patterns/stats-row";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { homeCopy } from "@/content/marketing/site-copy";

export function MarketingHomePage() {
  return (
    <main className="theme-marketing theme-home">
      <section className="hero-grid relative overflow-hidden px-6 py-18 sm:py-24">
        <div className="shell-width grid items-center gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-7">
            <Badge>{homeCopy.hero.eyebrow}</Badge>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-balance font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
                {homeCopy.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                {homeCopy.hero.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href={homeCopy.hero.primaryCta.href}>
                {homeCopy.hero.primaryCta.label}
              </Link>
              <Link className="btn-secondary" href={homeCopy.hero.secondaryCta.href}>
                {homeCopy.hero.secondaryCta.label}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3">
              {homeCopy.platformHighlights.map((item) => (
                <span
                  className="rounded-full border border-outline/20 bg-surface-high/70 px-4 py-2 text-sm text-muted"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
          <Card className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_44%)]" />
            <div className="relative space-y-6">
              <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-outline/20 bg-surface-low/80 px-4 py-3 text-sm text-muted">
                <span>Structured study path</span>
                <span>Phone to desktop ready</span>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-outline/20 bg-surface-low p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                      Lesson focus
                    </p>
                    <p className="mt-4 font-heading text-2xl font-extrabold">
                      Learn
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Understand context before you jump to setups.
                    </p>
                  </div>
                  <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                      Checkpoint
                    </p>
                    <p className="mt-4 font-heading text-2xl font-extrabold">
                      Quiz
                    </p>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      Use quick feedback to catch weak spots early.
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-[var(--radius-lg)] border border-outline/15 bg-surface-high p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Practice bridge
                  </p>
                  <div className="mt-5 h-40 rounded-[var(--radius-lg)] border border-outline/15 bg-[linear-gradient(180deg,rgba(228,102,9,0.12),transparent)] p-4">
                    <div className="flex h-full items-end gap-2">
                      {[44, 76, 54, 96, 68, 120, 88, 132].map((height) => (
                        <span
                          className="flex-1 rounded-t-full bg-[linear-gradient(180deg,var(--primary),var(--primary-dim))]"
                          key={height}
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width grid gap-12 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
          <div className="space-y-5">
            <SectionHeading
              eyebrow="Cross-platform rhythm"
              title="Mobile first for structure, stronger on desktop for scanning."
              description="The experience starts stacked and readable on phones, then expands into clearer grids, broader cards, and wider study surfaces on larger screens."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {homeCopy.whyItWorks.map((item, index) => (
              <Card className="p-5" key={item}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">{item}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="What you can do here"
            title="Three pillars, one clear learning path."
            description="The public site introduces the product honestly. Signed-in routes handle the actual study, quiz, and practice workflows."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {homeCopy.pillars.map((pillar) => (
              <Card className="flex h-full flex-col justify-between gap-8 p-8" key={pillar.title}>
                <div className="space-y-4">
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-xl)] bg-primary/12 text-primary">
                    <span className="material-symbols-outlined text-[1.6rem]">
                      {pillar.icon}
                    </span>
                  </span>
                  <div className="space-y-3">
                    <CardTitle>{pillar.title}</CardTitle>
                    <CardDescription>{pillar.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                    {pillar.stat}
                  </span>
                  <Link className="font-semibold text-primary" href={pillar.href}>
                    Explore
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width space-y-8">
          <SectionHeading
            eyebrow="Launch structure"
            title="Docs-exact scope, Stitch-exact visual direction."
            description="The site ships only the routes and behaviors defined in the cleaned package, while keeping the dark, high-contrast Stitch rhythm for each scope."
          />
          <StatsRow items={homeCopy.stats} />
        </div>
      </section>

      <section className="px-6 pb-24 pt-10">
        <div className="shell-width card-surface rounded-[var(--radius-xl)] px-6 py-10 sm:px-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr,auto] lg:items-center">
            <div className="space-y-4">
              <Badge>Ready to start</Badge>
              <h2 className="max-w-3xl text-balance font-heading text-4xl font-extrabold tracking-tight">
                Build understanding first, then move into quiz and backtesting practice.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-muted">
                localtradings.com keeps the path simple and believable for v1.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/sign-up">
                Create Free Account
              </Link>
              <Link className="btn-secondary" href="/learn">
                Browse Learn
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
