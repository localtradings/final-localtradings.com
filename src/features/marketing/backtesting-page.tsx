import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { backtestingCopy } from "@/content/marketing/site-copy";

const featureTiles = [
  { icon: "speed", label: "Chart Replay" },
  { icon: "play_circle", label: "Autoplay" },
  { icon: "trending_up", label: "Long / Short" },
  { icon: "layers", label: "Timeframe Switch" },
  { icon: "straighten", label: "Trade Planner" },
  { icon: "history", label: "Saved Sessions" },
  { icon: "fact_check", label: "Result Tracking" },
  { icon: "settings_ethernet", label: "Replay Controls" },
  { icon: "description", label: "Thesis + Review Notes" },
];

const setupStats: Array<{ label: string; value: string; tone?: string }> = [
  { label: "Entry", value: "1.08542" },
  { label: "Risk", value: "1.00%" },
  { label: "Mode", value: "Replay" },
];

export function MarketingBacktestingPage() {
  return (
    <main className="theme-marketing pb-24">
      <section className="px-6 py-20">
        <div className="shell-width flex flex-col gap-16 lg:flex-row lg:items-center">
          <Reveal className="lg:w-1/2" y={30}>
            <h1 className="max-w-4xl font-heading text-5xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.02]">
              Backtesting: <span className="text-primary">Replay</span> the chart,
              place a trade, set stop loss and take profit.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
              Review the result of your strategy with a cleaner process. The
              public page previews the tool honestly, while the signed-in route
              is where replay, planning, and review actually happen.
            </p>

            <div className="mt-12 flex flex-wrap gap-4">
              {[
                { icon: "history", label: "Replay candles" },
                { icon: "swap_vert", label: "Long and short" },
                { icon: "straighten", label: "Entry / SL / TP" },
                { icon: "analytics", label: "Result tracking" },
              ].map((item) => (
                <div
                  className="inline-flex items-center gap-3 rounded-[var(--radius-lg)] border border-outline-variant/10 bg-surface-low px-4 py-3"
                  key={item.label}
                >
                  <span className="material-symbols-outlined text-primary">
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Link
                className="inline-flex items-center gap-3 rounded-[var(--radius-lg)] bg-[linear-gradient(135deg,#ffb690_0%,#eb6b11_100%)] px-10 py-4 font-heading text-lg font-extrabold text-black transition hover:opacity-90"
                href="/sign-up"
              >
                Start Replaying Now
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </Reveal>

          <div className="relative lg:w-1/2">
            <div className="absolute -inset-4 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-outline-variant/20 bg-surface-highest shadow-2xl shadow-black/35">
              <div className="relative aspect-[1.25/1] bg-[linear-gradient(180deg,#15120f_0%,#211b15_100%)]">
                <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(231,226,221,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(231,226,221,0.07)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute inset-x-8 top-8 flex items-center justify-between">
                  <div className="rounded bg-black/60 px-3 py-1 text-[10px] font-mono text-primary">
                    EURUSD H1
                  </div>
                  <div className="rounded bg-black/60 px-3 py-1 text-[10px] font-mono text-muted">
                    Preview terminal
                  </div>
                </div>
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 600 420"
                >
                  <path
                    d="M10 340 L72 312 L130 324 L196 252 L262 270 L330 186 L396 214 L466 138 L536 156 L590 114"
                    fill="none"
                    stroke="rgba(255,182,144,0.95)"
                    strokeWidth="5"
                  />
                  <path
                    d="M10 368 L72 360 L130 332 L196 328 L262 280 L330 264 L396 228 L466 236 L536 188 L590 166"
                    fill="none"
                    opacity="0.4"
                    stroke="rgba(255,184,119,0.48)"
                    strokeWidth="3"
                    strokeDasharray="8 8"
                  />
                </svg>
                <div className="absolute bottom-8 right-8 rounded-[var(--radius-lg)] border border-primary/20 bg-surface/90 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-muted">
                    Live preview
                  </p>
                  <p className="mt-2 font-heading text-lg font-extrabold text-primary">
                    Replay and review
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-lowest px-6 py-24">
        <div className="shell-width">
          <Reveal className="mb-16">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              What this tool does
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Bridging the gap between theory and execution through rigorous
              historical validation.
            </p>
          </Reveal>

          <div className="grid gap-8 md:grid-cols-3">
            {backtestingCopy.capabilities.map((item) => (
              <Card
                className="rounded-[var(--radius-lg)] border-b-2 border-b-transparent bg-surface-high p-8 transition hover:border-b-primary"
                key={item.title}
              >
                <span className="material-symbols-outlined mb-6 text-4xl text-primary">
                  {item.icon}
                </span>
                <h3 className="font-heading text-xl font-bold">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="shell-width px-6 py-24">
        <Reveal>
          <h2 className="mb-12 font-heading text-3xl font-bold tracking-tight">
            Engineered for Accuracy
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {featureTiles.map((item) => (
            <Card
              className="rounded-[var(--radius-lg)] bg-surface-low p-6 transition hover:bg-surface-high"
              key={item.label}
            >
              <span className="material-symbols-outlined mb-3 text-primary">
                {item.icon}
              </span>
              <p className="text-sm font-bold text-foreground">{item.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell-width px-6 py-24">
        <div className="overflow-hidden rounded-[calc(var(--radius-xl)+0.4rem)] border border-outline-variant/10 bg-surface-low">
          <div className="flex flex-col lg:flex-row">
            <div className="bg-surface-high p-8 md:p-12 lg:w-2/3">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                    Live Preview
                  </span>
                  <h3 className="mt-2 font-heading text-3xl font-bold">
                    EURUSD H1 Strategy
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  <span className="text-xs font-bold text-[#f0a969]">
                    Long Position Active
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-lg)] border border-outline-variant/20 bg-[linear-gradient(180deg,#161310_0%,#1e1814_100%)] p-4">
                <div className="relative h-[21rem] overflow-hidden rounded-[var(--radius-md)]">
                  <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(231,226,221,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(231,226,221,0.07)_1px,transparent_1px)] [background-size:28px_28px]" />
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 700 350"
                  >
                    <path
                      d="M22 292 L92 254 L164 226 L234 238 L308 188 L382 210 L454 162 L522 114 L598 124 L678 78"
                      fill="none"
                      stroke="rgba(255,184,119,0.92)"
                      strokeWidth="4"
                    />
                    <path
                      d="M22 292 L92 254 L164 226 L234 238 L308 188 L382 210 L454 162 L522 114 L598 124 L678 78 L678 350 L22 350 Z"
                      fill="rgba(255,184,119,0.08)"
                    />
                  </svg>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-6">
                {setupStats.map((item) => (
                  <div key={item.label}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                      {item.label}
                    </p>
                    <p className={`mt-1 font-heading text-xl font-bold ${item.tone ?? "text-foreground"}`}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center bg-surface-highest/40 p-12 text-center lg:w-1/3">
              <div className="absolute inset-0 bg-[#0A0907]/60" />
              <div className="relative z-10">
                <span className="material-symbols-outlined mb-6 text-6xl text-primary">
                  lock
                </span>
                <h4 className="font-heading text-2xl font-bold">Ready to test?</h4>
                <p className="mb-8 mt-4 text-sm leading-7 text-muted">
                  Sign in to place and review trades on supported historical
                  timeframes inside the actual workstation.
                </p>
                <div className="grid gap-4">
                  <Link className="btn-primary" href="/sign-in">
                    Sign In
                  </Link>
                  <Link className="btn-secondary" href="/sign-up">
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell-width px-6 py-24">
        <Reveal>
          <h2 className="mb-16 text-center font-heading text-3xl font-bold tracking-tight">
            Why Professional Traders Backtest
          </h2>
        </Reveal>
        <div className="grid gap-12 md:grid-cols-3">
          {backtestingCopy.reasons.map((item) => (
            <div className="flex flex-col items-center p-6 text-center" key={item.title}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary">
                  {item.icon}
                </span>
              </div>
              <h3 className="font-heading text-lg font-bold">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-32">
        <div className="absolute inset-0 -skew-y-3 origin-right bg-primary/5" />
        <Reveal className="shell-width relative text-center">
          <h2 className="font-heading text-5xl font-extrabold tracking-tight">
            Stop Guessing. Start Trading.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-muted">
            Move from reading about strategy into a structured replay, planning,
            and review workflow built for practice.
          </p>
          <div className="mt-12 flex flex-col justify-center gap-6 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] bg-[linear-gradient(135deg,#ffb690_0%,#eb6b11_100%)] px-12 py-5 font-heading text-xl font-extrabold text-black transition hover:scale-[1.02]"
              href="/sign-up"
            >
              Start Backtesting
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-primary px-12 py-5 font-heading text-xl font-extrabold text-primary transition hover:bg-primary/10"
              href="/sign-in"
            >
              Sign In
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
