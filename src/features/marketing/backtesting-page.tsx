import Link from "next/link";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { backtestingCopy } from "@/content/marketing/site-copy";

export function MarketingBacktestingPage() {
  return (
    <main className="theme-marketing">
      <section className="px-6 py-18 sm:py-24">
        <div className="shell-width grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-7">
            <Badge>Backtesting preview</Badge>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-balance font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">
                Replay the chart, plan the trade, and review the result.
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
                The public page previews the workflow. The signed-in
                backtesting route becomes the actual tool area.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {backtestingCopy.tags.map((tag) => (
                <span
                  className="rounded-[var(--radius-lg)] border border-outline/20 bg-surface-high/70 px-4 py-3 text-sm text-muted"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary" href="/sign-up">
                Start Backtesting
              </Link>
              <Link className="btn-secondary" href="/sign-in">
                Sign In
              </Link>
            </div>
          </div>
          <Card className="overflow-hidden p-6">
            <div className="rounded-[var(--radius-xl)] border border-outline/20 bg-surface-low p-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                <span>Live preview</span>
                <span>EURUSD H1</span>
              </div>
              <div className="mt-6 rounded-[var(--radius-xl)] border border-outline/15 bg-[linear-gradient(180deg,rgba(255,182,144,0.12),transparent)] p-5">
                <div className="flex h-56 items-end gap-2">
                  {[28, 48, 64, 52, 96, 68, 120, 110, 142, 126].map((height) => (
                    <span
                      className="flex-1 rounded-t-full bg-[linear-gradient(180deg,var(--primary),var(--primary-dim))]"
                      key={height}
                      style={{ height }}
                    />
                  ))}
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Entry
                    </p>
                    <p className="mt-2 font-heading text-2xl font-extrabold">1.08542</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Stop
                    </p>
                    <p className="mt-2 font-heading text-2xl font-extrabold">1.08320</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
                      Target
                    </p>
                    <p className="mt-2 font-heading text-2xl font-extrabold">1.09160</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-surface-low/70 px-6 py-20">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="What this tool does"
            title="Replay, plan, and review in a believable v1 scope."
            description="The implementation stays grounded: no fake premium gates, no alerts, no exports, and no heavy journaling features that the product does not actually support."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {backtestingCopy.capabilities.map((item) => (
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
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="Engineered for practice"
            title="Focused controls, not feature bloat."
            description="The docs only support a focused first version, so the launch build keeps the tool area compact and comprehensible."
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {backtestingCopy.featureGrid.map((feature) => (
              <Card className="rounded-[var(--radius-lg)] p-5" key={feature}>
                <p className="font-semibold">{feature}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="shell-width grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <Card className="p-8">
            <SectionHeading
              eyebrow="Locked public preview"
              title="Sign in to use the workstation."
              description="The public page should preview the flow honestly. The actual signed-in route is where trade plan inputs, replay state, and review panels live."
            />
          </Card>
          <Card className="flex flex-col justify-between gap-6 p-8">
            <div className="space-y-3">
              <h3 className="font-heading text-2xl font-extrabold tracking-tight">
                Ready to test your process?
              </h3>
              <p className="text-sm leading-7 text-muted">
                Use account access to move from preview into the actual practice
                workflow.
              </p>
            </div>
            <div className="grid gap-3">
              <Link className="btn-primary" href="/sign-in">
                Sign In
              </Link>
              <Link className="btn-secondary" href="/sign-up">
                Create Free Account
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="px-6 pb-24 pt-6">
        <div className="shell-width grid gap-6 lg:grid-cols-3">
          {backtestingCopy.reasons.map((item) => (
            <Card className="p-8 text-center" key={item.title}>
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
      </section>
    </main>
  );
}
