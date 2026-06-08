import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { SymbolIcon, type SymbolIconName } from "@/components/ui/symbol-icon";
import { learnCopy } from "@/content/marketing/site-copy";
import { moduleCatalog } from "@/content/modules";

const insideAccountItems = [
  "Full launch lessons and modules",
  "Interactive quiz access",
  "Signed-in learning dashboard",
  "Backtesting tool integration",
  "Profile and study preferences",
  "Help center access",
];

const learnBenefits = [
  {
    title: "Simple",
    description:
      "No overloaded jargon. Core trading concepts are explained in plain language so you can focus on understanding the chart.",
    icon: "bolt",
  },
  {
    title: "Organized",
    description:
      "A clear path from beginner basics into more structured modules, without bouncing between random resources.",
    icon: "format_list_bulleted",
  },
  {
    title: "Practical",
    description:
      "Each topic connects to quizzes or practice so the learning flow leads somewhere useful.",
    icon: "construction",
  },
] satisfies Array<{ title: string; description: string; icon: SymbolIconName }>;

export function MarketingLearnPage() {
  return (
    <main className="theme-marketing pb-24">
      <section className="px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="shell-width grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <Reveal className="space-y-6" y={30}>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Learn
            </span>
            <h1 className="font-heading text-6xl font-extrabold tracking-[-0.04em] text-foreground sm:text-7xl">
              Learn
            </h1>
            <p className="max-w-md text-lg leading-8 text-muted">
              Candlesticks, market structure, risk, quizzes, and backtesting
              basics. Simplified for the modern trader.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link className="btn-primary px-8 py-3 text-base" href="/sign-up">
                Start Learning
              </Link>
              <Link className="btn-secondary px-8 py-3 text-base" href="#modules">
                Browse Modules
              </Link>
            </div>
          </Reveal>

          <Reveal
            className="rounded-[var(--radius-xl)] border border-outline-variant/15 bg-[rgba(54,52,49,0.6)] p-8 backdrop-blur-[20px]"
            delay={0.08}
          >
            <div className="relative overflow-hidden">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <h2 className="relative mb-6 font-heading text-xl font-bold text-primary">
                What&apos;s inside
              </h2>
              <ul className="relative space-y-4">
                {[
                  "Short lessons",
                  "Quick quizzes",
                  "Simple trading terms",
                  "Chart practice preview",
                  "Beginner-friendly structure",
	                ].map((item) => (
	                  <li className="flex items-center gap-3 text-muted" key={item}>
	                    <SymbolIcon name="check_circle" className="text-lg text-primary" />
	                    {item}
	                  </li>
	                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface-lowest px-6 py-24">
        <div className="shell-width">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-bold tracking-tight">
              What you&apos;ll see inside
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
	            {([
	              {
                title: "Lessons",
                description:
                  "Bite-sized, jargon-controlled modules designed for quick consumption.",
                icon: "menu_book",
              },
              {
                title: "Quizzes",
                description:
                  "Test your understanding immediately after each topic with short checks.",
                icon: "quiz",
              },
              {
                title: "Key Terms",
                description:
                  "Important trading language explained in simpler terms and grounded examples.",
                icon: "terminal",
              },
              {
                title: "Practice",
                description:
                  "Preview how study flows into chart review and basic decision-making practice.",
                icon: "monitoring",
              },
		            ] as const).map((item) => (
	              <Card
	                className="rounded-[var(--radius-lg)] border-outline-variant/10 bg-surface-high p-8 text-center transition hover:bg-surface-highest md:text-left"
	                key={item.title}
	              >
	                <SymbolIcon name={item.icon} className="mb-4 text-3xl text-primary" />
	                <h3 className="font-heading text-lg font-bold">{item.title}</h3>
	                <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
	              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-low px-6 py-24" id="modules">
        <div className="shell-width">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-bold tracking-tight">
              Topics you can learn
            </h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
            {moduleCatalog.map((module) => (
              <Card
                className="group flex flex-col justify-between rounded-[var(--radius-lg)] border-outline-variant/10 bg-surface-high p-8"
                key={module.slug}
              >
                <div>
                  <h3 className="font-heading text-xl font-bold transition-colors group-hover:text-primary">
                    {module.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    {module.description}
                  </p>
                </div>
                <Link
                  className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-primary/75 transition hover:text-primary"
                  href="/sign-up"
	                >
	                  Unlock
	                  <SymbolIcon name="lock" className="text-xs" />
	                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="shell-width">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-outline-variant/15 bg-surface-high">
            <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
              <Badge>Preview</Badge>
              <span className="text-sm text-muted">Module 1.1</span>
            </div>
            <div className="flex flex-col gap-12 p-8 md:p-12 lg:flex-row">
              <div className="max-w-3xl flex-1">
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  What is a candlestick?
                </h2>
                <div className="mb-12 mt-6 space-y-4 text-muted">
                  <p>
                    A candlestick is a way of displaying how price moved during a
                    specific time period. It helps traders read the market
                    quickly from just a few bars.
                  </p>
                  <p>
                    Each candle shows the open, high, low, and close. The body
                    represents the gap between the open and close, while the
                    wicks show the extremes reached during that period.
                  </p>
                </div>

                <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-outline-variant/10 bg-surface-lowest p-8">
	                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[var(--radius-lg)] bg-surface-lowest/80 px-4 text-center backdrop-blur-[2px]">
	                    <SymbolIcon name="lock" className="mb-3 text-4xl text-primary" />
	                    <p className="mb-4 text-lg font-bold text-foreground">
	                      Module quiz is locked
                    </p>
                    <p className="mb-6 text-sm text-muted">
                      Create an account to answer quizzes and track your
                      progress.
                    </p>
                    <Link className="btn-primary px-8 py-3 text-sm" href="/sign-up">
                      Sign Up Now
                    </Link>
                  </div>

                  <div className="opacity-10 select-none">
                    <p className="mb-4 font-bold">
                      What does the candle body represent?
                    </p>
                    <div className="space-y-2">
                      <div className="rounded border border-outline-variant/20 p-3">
                        A) The difference between High and Low
                      </div>
                      <div className="rounded border border-outline-variant/20 p-3">
                        B) The difference between Open and Close
                      </div>
                      <div className="rounded border border-outline-variant/20 p-3">
                        C) The volume of the trade
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="soft-grid flex min-h-[400px] items-end gap-2 rounded-[var(--radius-xl)] border border-outline-variant/15 bg-[linear-gradient(180deg,#0f151d,#112432)] p-6 shadow-2xl shadow-black/25">
                  {[46, 92, 70, 132, 104, 164, 132, 182, 148, 204].map((height, index) => (
                    <span
                      className={
                        index % 2 === 0
                          ? "flex-1 rounded-t-full bg-[#e46609]/85"
                          : "flex-1 rounded-t-full bg-[#4aa3d8]/80"
                      }
                      key={`${height}-${index}`}
                      style={{ height }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-lowest px-6 py-24">
        <div className="shell-width text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight">
            Why this learn area is useful
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {learnBenefits.map((item) => (
	              <div className="p-6" key={item.title}>
	                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
	                  <SymbolIcon name={item.icon} className="text-3xl text-primary" />
	                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="shell-width max-w-5xl">
          <div className="rounded-[var(--radius-xl)] border border-outline-variant/10 bg-surface-high p-12 text-center">
            <Reveal>
              <h2 className="font-heading text-3xl font-bold tracking-tight">
                Inside your account
              </h2>
            </Reveal>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-x-12 gap-y-2 text-left md:grid-cols-2">
              {insideAccountItems.map((item) => (
                <div
                  className="flex items-center gap-3 border-b border-outline-variant/10 py-3"
                  key={item}
	                >
	                  <SymbolIcon name="lock" className="text-sm text-muted/40" />
	                  <span className="font-medium text-foreground">{item}</span>
	                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-lowest px-6 py-24">
        <div className="shell-width max-w-3xl">
          <Reveal>
            <h2 className="text-center font-heading text-3xl font-bold tracking-tight">
              FAQ
            </h2>
          </Reveal>
          <div className="mt-12 space-y-6">
            {learnCopy.faq.map((item) => (
              <div
                className="rounded-[var(--radius-lg)] border border-outline-variant/10 bg-surface p-6"
                key={item.question}
              >
                <h3 className="font-bold">{item.question}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-32 text-center">
        <div className="shell-width relative max-w-4xl">
          <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl" />
          <Reveal className="relative z-10">
            <h2 className="font-heading text-5xl font-extrabold tracking-tight">
              Start learning today
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-muted">
              Create an account to access lessons, quizzes, and practice tools
              built for a cleaner trading learning path.
            </p>
            <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="btn-primary px-12 py-4 text-lg" href="/sign-up">
                Sign Up Now
              </Link>
              <Link className="btn-secondary px-12 py-4 text-lg" href="/sign-in">
                Sign In
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
