import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { aboutCopy } from "@/content/marketing/site-copy";

export function MarketingAboutPage() {
  return (
    <main className="theme-marketing">
      <section className="px-6 py-18 sm:py-24">
        <div className="shell-width grid gap-12 lg:grid-cols-[1fr,0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge>About localtradings.com</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
                Built for clarity, not trading theatrics.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                The platform is intentionally learning-first: clear lessons,
                honest scope, and practice tools that reinforce process instead
                of hype.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {aboutCopy.introCards.map((item) => (
                <Card className="p-5" key={item}>
                  <p className="text-sm leading-7 text-muted">{item}</p>
                </Card>
              ))}
            </div>
          </div>
          <Card className="p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Mission
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {aboutCopy.mission}
                </p>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Vision
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {aboutCopy.vision}
                </p>
              </div>
              <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Positioning
                </p>
                <p className="mt-4 text-sm leading-7 text-muted">
                  localtradings.com is not a broker, signal room, or fake social
                  community. It is a structured education product with Learn,
                  Quiz, and Backtesting as its core pillars.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-surface-low/70 px-6 py-20">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="Core values"
            title="The product should feel calm, direct, and maintainable."
            description="Those values apply to the codebase too: thin route files, reusable primitives, and content stored where future humans can update it."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {aboutCopy.values.map((item) => (
              <Card className="p-8" key={item.title}>
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
        <div className="shell-width card-surface rounded-[var(--radius-xl)] px-6 py-10 sm:px-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr,auto] lg:items-center">
            <div className="space-y-4">
              <SectionHeading
                eyebrow="Looking ahead"
                title="The launch stays intentionally narrow."
                description="That means no Community route in v1, no fake counts, and no routes that the cleaned docs explicitly removed."
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/learn">
                Browse Learn
              </Link>
              <Link className="btn-secondary" href="/help">
                Need Help
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
