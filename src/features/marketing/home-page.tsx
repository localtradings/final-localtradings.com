import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { homeCopy } from "@/content/marketing/site-copy";
import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";

const foundationCards = [
  {
    title: "Clear progression",
    description:
      "Lessons, quizzes, and backtesting are connected so each step reinforces the next one.",
    icon: "conversion_path",
  },
  {
    title: "No fake pressure",
    description:
      "No broker theatrics, fake reviews, or invented live results pushing people into bad decisions.",
    icon: "verified",
  },
  {
    title: "Built for review",
    description:
      "The platform is designed to help you read, test, and practice before real money is involved.",
    icon: "fact_check",
  },
];

export function MarketingHomePage() {
  const featuredModule = moduleCatalog[0];
  const featuredQuiz = quizCatalog[0];

  return (
    <main className="theme-marketing theme-home relative overflow-hidden pb-24">
      <div className="relative z-10">
        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pb-24 sm:pt-20">
        <div className="shell-width relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(30rem,38rem)] lg:items-start lg:gap-10">
          <Reveal className="order-1 max-w-[52rem] space-y-7 lg:pt-8" y={30}>
            <div className="space-y-5">
              <h1 className="text-balance font-heading text-[3rem] font-black tracking-tight text-foreground sm:text-[4.8rem] sm:leading-[0.94] lg:text-[5.2rem]">
                Learn trading
                <br />
                <span className="text-primary">
                  before risking real money
                </span>
              </h1>
              <p className="max-w-xl text-lg font-light leading-8 text-muted sm:text-xl">
                {homeCopy.hero.description}
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link className="btn-primary px-8 py-4 text-base" href={homeCopy.hero.primaryCta.href}>
                {homeCopy.hero.primaryCta.label}
              </Link>
              <Link
                className="btn-secondary px-8 py-4 text-base"
                href={homeCopy.hero.secondaryCta.href}
              >
                {homeCopy.hero.secondaryCta.label}
              </Link>
            </div>

            <p className="text-xs italic text-muted/75">
              For educational purposes only. Trading involves risk.
            </p>
          </Reveal>

          <div className="order-2 w-full lg:col-start-2 lg:row-start-1 lg:justify-self-end">
            <div className="relative z-10 mx-auto w-full max-w-[38rem] pt-2 sm:max-w-[34rem] lg:ml-auto lg:mr-0 lg:pt-6">
              <div className="rounded-[var(--radius-xl)] border border-outline-variant/20 bg-surface-high p-4 shadow-2xl shadow-black/35">
                <div className="rounded-[var(--radius-lg)] border border-outline/10 bg-[#efe7df] p-4">
                  <div className="flex h-[22rem] flex-col rounded-[var(--radius-lg)] border border-[#d8cec6] bg-white p-4 sm:h-[24rem] lg:h-[25rem]">
                    <div className="h-2 w-16 rounded-full bg-[#d8cec6]" />
                    <div className="mt-5 grid flex-1 gap-4 md:grid-cols-[1.15fr,0.85fr]">
                      <div className="rounded-[var(--radius-md)] bg-[linear-gradient(180deg,#f3f6fb,#d7e3f4)] p-4">
                        <div className="h-full rounded-[var(--radius-md)] bg-[linear-gradient(180deg,#c0d7ec,#668cb8)]" />
                      </div>
                      <div className="grid gap-4">
                        <div className="rounded-[var(--radius-md)] bg-[#eef3fb] p-4" />
                        <div className="rounded-[var(--radius-md)] bg-[#eef3fb] p-4" />
                        <div className="rounded-[var(--radius-md)] bg-[#eef3fb] p-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-8 left-2 w-28 rotate-3 rounded-[1rem] border border-outline-variant/20 bg-[#ffd7be] p-2 shadow-2xl shadow-black/35 sm:-left-4 sm:w-32">
                <div className="aspect-[0.62/1.18] rounded-[0.8rem] border border-[#efb789] bg-[linear-gradient(180deg,#fff4ea,#f5b37f)] p-2">
                  <div className="grid h-full gap-2 rounded-[0.7rem] bg-white/60 p-2">
                    <div className="rounded-[0.45rem] bg-white/80" />
                    <div className="rounded-[0.45rem] bg-white/70" />
                    <div className="rounded-[0.45rem] bg-white/60" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section className="border-y border-outline-variant/10 bg-surface-low/35 px-6 py-24 backdrop-blur-[2px]">
        <div className="shell-width grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative order-2 lg:order-1">
            <div className="rounded-[var(--radius-xl)] border border-outline-variant/20 bg-surface-low/80 p-4 shadow-2xl shadow-black/35">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-outline-variant/20 bg-surface-high soft-grid">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full opacity-60"
                  viewBox="0 0 400 300"
                >
                  <path
                    d="M0 250 L50 220 L100 240 L150 180 L200 200 L250 120 L300 150 L350 80 L400 100"
                    fill="none"
                    stroke="#E46609"
                    strokeWidth="2"
                  />
                  <path
                    d="M0 200 L80 180 L160 210 L240 140 L320 160 L400 110"
                    fill="none"
                    stroke="#A89B91"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                </svg>

                <div className="absolute left-4 top-4 space-y-2">
                  <div className="rounded bg-black/60 px-2 py-1 text-[10px] font-mono text-primary">
                    Learn: {featuredModule.title}
                  </div>
                  <div className="rounded bg-black/60 px-2 py-1 text-[10px] font-mono text-muted">
                    Quiz flow connected
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 rounded border border-primary/20 bg-surface/90 p-3">
                  <span className="text-[8px] uppercase tracking-[0.18em] text-muted">
                    Preview only
                  </span>
                  <p className="mt-1 text-sm font-black text-primary">
                    Study, test, then practice
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Reveal className="order-1 space-y-6 lg:order-2" delay={0.05}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="material-symbols-outlined text-xs text-primary">devices</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Cross-platform performance
              </span>
            </div>
            <div className="space-y-5">
              <h2 className="font-heading text-[2.6rem] font-black tracking-tight sm:text-[3.6rem] sm:leading-[0.96]">
                Learn anywhere,
                <br />
                <span className="text-primary">on any screen size.</span>
              </h2>
              <p className="max-w-xl text-lg leading-8 text-muted">
                Start mobile-first with a clean stacked layout. On tablet and
                desktop the interface opens up into stronger grids, clearer card
                hierarchy, and wider chart areas that make review easier.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              {[
                { icon: "desktop_windows", label: "Desktop-ready workspace" },
                { icon: "smartphone", label: "Mobile-first reading flow" },
                { icon: "sync", label: "Same account across devices" },
              ].map((item) => (
                <div className="flex items-center gap-3" key={item.label}>
                  <span className="material-symbols-outlined text-primary">
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
        </section>

        <section className="px-6 py-24">
        <div className="shell-width">
          <Reveal className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-heading text-[2.25rem] font-black tracking-tight sm:text-[3rem]">
                What you can do here:
              </h2>
              <p className="mt-4 text-base leading-8 text-muted">
                Explore lessons, test your knowledge, and practice with simple
                trading tools designed for learning.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <Card className="group relative overflow-hidden bg-surface-low p-8 md:col-span-8">
              <div className="relative z-10 max-w-md">
                <span className="material-symbols-outlined mb-6 text-4xl text-primary">
                  school
                </span>
                <h3 className="font-heading text-2xl font-black tracking-tight">
                  Education Academy
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Learn trading basics through simple lessons, guides, and
                  structured modules that stay easy to scan.
                </p>
                <div className="mt-8 flex gap-4">
                  <span className="rounded-[var(--radius-md)] border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    Beginners
                  </span>
                  <span className="rounded-[var(--radius-md)] border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    Intermediate
                  </span>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between bg-surface-low p-8 md:col-span-4">
              <div>
                <span className="material-symbols-outlined mb-6 text-4xl text-primary">
                  verified_user
                </span>
                <h3 className="font-heading text-2xl font-black tracking-tight">
                  Quizzes
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Test your trading knowledge with simple quizzes across launch
                  topics.
                </p>
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-outline-variant/10 pt-8">
                <span className="text-sm font-semibold text-primary">
                  {quizCatalog.length} launch quizzes
                </span>
                <span className="material-symbols-outlined text-primary">
                  arrow_forward
                </span>
              </div>
            </Card>

            <Card className="flex flex-col justify-between bg-surface-low p-8 md:col-span-4">
              <div>
                <span className="material-symbols-outlined mb-6 text-4xl text-primary">
                  history
                </span>
                <h3 className="font-heading text-2xl font-black tracking-tight">
                  Backtesting
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  Practice trade decisions with replay, entries, stop loss, and
                  exit planning inside a focused workstation.
                </p>
              </div>
              <div className="mt-8 flex h-20 items-end gap-1">
                {[50, 75, 35, 52, 100].map((height, index) => (
                  <div
                    className="w-full rounded-t-sm bg-primary/60"
                    key={`${height}-${index}`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden bg-surface-low p-8 md:col-span-8">
              <div className="flex h-full flex-col gap-8 md:flex-row md:items-center">
                <div className="flex-1">
                  <h3 className="font-heading text-2xl font-black tracking-tight">
                    Structured study flow
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    Move from lessons to quizzes, then into backtesting. The
                    public site previews the flow honestly without inventing
                    extra routes or fake social features.
                  </p>
                  <Link className="mt-6 inline-flex items-center gap-2 font-bold text-primary" href="/learn">
                    Browse the learning path
                    <span className="material-symbols-outlined text-base">
                      trending_flat
                    </span>
                  </Link>
                </div>
                <div className="grid min-w-0 flex-1 gap-3">
                  {homeCopy.platformHighlights.map((item) => (
                    <div
                      className="rounded-[var(--radius-lg)] border border-outline-variant/10 bg-surface-high px-4 py-4 text-sm text-muted"
                      key={item}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
        </section>

        <section className="relative overflow-hidden px-6 py-32">
        <div className="shell-width grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-[var(--radius-xl)] border border-outline-variant/20 bg-surface/70 shadow-[0_32px_64px_-16px_rgba(10,8,6,0.9)] backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row">
              <div className="w-full border-b border-outline-variant/30 bg-surface-low/60 p-6 md:w-48 md:border-b-0 md:border-r">
                <div className="mb-6">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                    {featuredQuiz.category}
                  </div>
                  <h3 className="font-heading text-lg font-black">{featuredQuiz.title}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-primary">
                      timer
                    </span>
                    <span className="text-[10px] font-black text-foreground">
                      {featuredQuiz.estimatedMinutes} min
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-high">
                    <div className="h-full w-[65%] bg-primary" />
                  </div>
                </div>
                <div className="mt-6 rounded-[var(--radius-md)] border border-outline-variant/20 bg-surface-high p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-primary">
                      lightbulb
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                      Study tip
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-foreground">
                    Take the quiz after the lesson while the concepts are still
                    fresh.
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-[linear-gradient(135deg,rgba(10,8,6,0.9),rgba(20,17,14,0.9))] p-6 md:p-8">
                <h4 className="mb-6 font-heading text-lg font-black">
                  {featuredQuiz.questions[0]?.prompt}
                </h4>
                <div className="space-y-3">
                  {featuredQuiz.questions[0]?.options.map((option, index) => {
                    const selected = index === 1;
                    const label = String.fromCharCode(65 + index);

                    return (
                      <div
                        className={`flex items-center rounded-[var(--radius-md)] border p-3 text-left text-xs transition ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-outline-variant/30 hover:bg-surface-highest/50"
                        }`}
                        key={option.id}
                      >
                        <span
                          className={`mr-3 inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${
                            selected
                              ? "bg-primary text-black"
                              : "border border-outline-variant text-muted"
                          }`}
                        >
                          {label}
                        </span>
                        <span className={selected ? "font-black text-foreground" : "text-muted"}>
                          {option.label}
                        </span>
                        {selected ? (
                          <span className="material-symbols-outlined ml-auto text-lg text-primary">
                            check_circle
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end border-t border-outline-variant/10 pt-6">
                  <button
                    className="rounded-[var(--radius-md)] bg-primary px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-black"
                    type="button"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Interactive quizzes
              </span>
            </div>
            <h2 className="font-heading text-[2.5rem] font-black tracking-tight sm:text-[3.5rem] sm:leading-[0.98]">
              Test your knowledge
            </h2>
            <p className="max-w-lg text-lg leading-8 text-muted">
              Challenge yourself with topic-based quizzes designed to make
              trading concepts easier to retain. The flow stays clean: setup,
              take, then review the result.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-foreground">
                  {quizCatalog.length}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Launch quizzes
                </span>
              </div>
              <div className="h-10 w-px bg-outline-variant/30" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-foreground">
                  {featuredQuiz.recommendedQuestionCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                  Questions per check
                </span>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section className="relative overflow-hidden px-6 py-32">
        <div className="shell-width grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="order-2 flex flex-col gap-6 lg:order-1">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Simple backtesting
              </span>
            </div>
            <h2 className="font-heading text-[2.5rem] font-black tracking-tight sm:text-[3.5rem] sm:leading-[0.98]">
              Simple backtesting
            </h2>
            <p className="max-w-lg text-lg leading-8 text-muted">
              Use a focused backtesting workspace to replay price, plan entries,
              set risk, and review how your process holds up under repetition.
            </p>
            <Link className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary" href="/backtesting">
              Enter the lab
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

          <div className="order-1 overflow-hidden rounded-[var(--radius-xl)] border border-outline-variant/20 bg-black/60 shadow-[0_32px_64px_-16px_rgba(10,8,6,0.9)] backdrop-blur-2xl lg:order-2">
            <div className="flex items-center justify-between border-b border-outline-variant/20 bg-surface-high/80 px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-danger/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-secondary/50" />
                  <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
                </div>
                <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-foreground">
                  LOCALTRADINGS_TERM
                </span>
              </div>
              <span className="text-[9px] font-mono font-black uppercase text-primary">
                Replay mode
              </span>
            </div>

            <div className="flex h-[300px]">
              <div className="relative flex-1 soft-grid p-6">
                <div className="pointer-events-none absolute inset-0 flex items-end justify-around px-8 pb-12 opacity-85">
                  <div className="h-[40%] w-2 bg-danger/60" />
                  <div className="h-[45%] w-2 bg-danger/80" />
                  <div className="h-[38%] w-2 bg-success/60" />
                  <div className="relative h-[55%] w-2 bg-primary">
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 border border-primary px-1 text-[7px] font-black text-primary">
                      BUY
                    </div>
                  </div>
                  <div className="h-[70%] w-2 bg-success" />
                </div>
                <div className="w-fit rounded border border-primary/30 bg-surface/90 px-3 py-1.5">
                  <span className="text-[9px] font-black text-primary font-mono">
                    Entry / Stop / Target
                  </span>
                </div>
              </div>

              <div className="w-32 border-l border-outline-variant/30 bg-surface-low/80 p-4">
                <h5 className="mb-3 text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                  Review
                </h5>
                <div className="space-y-3">
                  <div>
                    <div className="text-[8px] font-bold uppercase text-muted">Direction</div>
                    <div className="text-xs font-black text-foreground">Long</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-bold uppercase text-muted">Risk plan</div>
                    <div className="text-xs font-black text-primary">1.50R</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-outline-variant/10 bg-surface-highest/90 p-4">
              <div className="flex gap-4">
                <button className="material-symbols-outlined text-lg text-muted hover:text-primary" type="button">
                  fast_rewind
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-black"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm font-black">
                    play_arrow
                  </span>
                </button>
                <button className="material-symbols-outlined text-lg text-muted hover:text-primary" type="button">
                  fast_forward
                </button>
              </div>
              <div className="flex gap-2">
                <div className="rounded border border-primary px-4 py-1.5 text-[9px] font-black text-primary">
                  PLAN LONG
                </div>
                <div className="rounded border border-danger px-4 py-1.5 text-[9px] font-black text-danger">
                  PLAN SHORT
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>

        <section className="px-6 py-24">
        <div className="shell-width">
          <h2 className="mb-12 flex items-center gap-4 font-heading text-3xl font-black tracking-tight sm:text-4xl">
            Core curriculum
            <span className="h-px flex-1 bg-outline-variant/20" />
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {moduleCatalog.map((module, index) => (
              <Link
                className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-outline-variant/10 bg-surface-high transition duration-300 hover:-translate-y-1 md:flex-row"
                href="/learn"
                key={module.slug}
              >
                <div className="h-48 w-full overflow-hidden md:h-auto md:w-48">
                  <div
                    className={`h-full w-full transition duration-500 ${
                      index % 4 === 0
                        ? "bg-[linear-gradient(180deg,#1a1a1a,#101010)]"
                        : index % 4 === 1
                          ? "bg-[linear-gradient(180deg,#1b1b1b,#111111)]"
                          : index % 4 === 2
                            ? "bg-[linear-gradient(180deg,#181818,#0f0f0f)]"
                            : "bg-[linear-gradient(180deg,#202020,#111111)]"
                    }`}
                  >
                    <div className="flex h-full items-end p-4">
                      <div className="flex w-full gap-1">
                        {[38, 55, 72, 44, 90].map((height) => (
                          <span
                            className="h-full flex-1 rounded-t bg-white/65"
                            key={`${module.slug}-${height}`}
                            style={{ height }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-8">
                  <div>
                    <h4 className="font-heading text-xl font-extrabold tracking-tight transition-colors group-hover:text-primary">
                      {module.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {module.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      View module
                      <span className="material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      {module.duration}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        </section>

        <section className="bg-surface-low/55 px-6 py-24 backdrop-blur-[2px]">
        <div className="shell-width">
          <h2 className="text-center font-heading text-[2.4rem] font-black tracking-tight italic sm:text-[3.2rem]">
            Why learn here
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {foundationCards.map((item) => (
              <Card className="relative overflow-hidden bg-surface p-8" key={item.title}>
                <div className="absolute right-4 top-4 opacity-10">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    {item.icon}
                  </span>
                </div>
                <p className="relative z-10 leading-8 text-foreground">
                  {item.description}
                </p>
                <div className="relative z-10 mt-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-primary">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="font-heading text-sm font-extrabold tracking-tight">
                    {item.title}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        </section>

        <section className="px-6 py-24">
        <div className="shell-width">
          <div className="rounded-[var(--radius-xl)] border border-outline-variant/20 bg-surface-low px-8 py-12 text-center sm:px-12 sm:py-16">
            <Badge>Ready to start</Badge>
            <h2 className="mt-6 font-heading text-[2.5rem] font-black tracking-tight sm:text-[3.6rem] sm:leading-[0.96]">
              Build understanding first.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted">
              localtradings.com gives you a clear route into lessons, quizzes,
              and backtesting without pretending the product is something it is
              not.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link className="btn-primary px-8 py-4 text-base" href="/sign-up">
                Create Free Account
              </Link>
              <Link className="btn-secondary px-8 py-4 text-base" href="/learn">
                Browse Learn
              </Link>
            </div>
          </div>
        </div>
        </section>
      </div>
    </main>
  );
}
