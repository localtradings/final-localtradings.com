import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";
import { SymbolIcon, type SymbolIconName } from "@/components/ui/symbol-icon";
import { aboutCopy } from "@/content/marketing/site-copy";

const audienceCards = [
  {
    title: "Beginners",
    description:
      "People seeing a candlestick chart for the first time and needing a cleaner, more patient guide.",
    icon: "school",
    tone: "text-primary",
    border: "hover:border-primary/30",
  },
  {
    title: "Structure Seekers",
    description:
      "Learners who are tired of scattered tutorials and want a logical, progressive curriculum.",
    icon: "architecture",
    tone: "text-secondary",
    border: "hover:border-secondary/30",
  },
  {
    title: "Clarity Hunters",
    description:
      "Traders who have tried complexity and want to return to simpler, more reliable mechanics.",
    icon: "flare",
    tone: "text-tertiary",
    border: "hover:border-tertiary/30",
  },
] satisfies Array<{
  title: string;
  description: string;
  icon: SymbolIconName;
  tone: string;
  border: string;
}>;

const valueTiles = [
  { label: "Clarity", icon: "search" },
  { label: "Honesty", icon: "shield" },
  { label: "Learning first", icon: "menu_book" },
  { label: "Simplicity", icon: "filter_list" },
  { label: "Growth", icon: "trending_up" },
  { label: "Respect", icon: "handshake" },
] satisfies Array<{ label: string; icon: SymbolIconName }>;

const companyCards = [
  {
    title: "What we are building",
    description:
      "A focused education platform that bridges theory, quizzes, and practice without pretending to be a broker or signal product.",
    icon: "build",
    tone: "text-primary",
    panel: "bg-primary/10",
  },
  {
    title: "How we are growing",
    description:
      "Iteratively. We keep refining the product around clear routes, honest scope, and maintainable systems that serve the learning path.",
    icon: "rocket_launch",
    tone: "text-secondary",
    panel: "bg-secondary/10",
  },
] satisfies Array<{
  title: string;
  description: string;
  icon: SymbolIconName;
  tone: string;
  panel: string;
}>;

export function MarketingAboutPage() {
  return (
    <main className="theme-marketing pb-20">
      <section className="shell-width grid gap-16 px-6 pb-8 pt-20 md:grid-cols-2 md:items-center">
        <Reveal className="space-y-6" y={30}>
          <h1 className="font-heading text-6xl font-extrabold tracking-[-0.05em] text-primary sm:text-7xl">
            About localtradings.com
          </h1>
          <p className="max-w-xl text-xl leading-8 text-muted">
            We are building a calmer starting point for new traders. A place
            where complex market dynamics are distilled into honest, actionable
            education. No fluff, just clarity.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-2 font-semibold text-secondary">
              <SymbolIcon name="verified" />
              Education First
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
            <span className="inline-flex items-center gap-2 font-semibold text-secondary">
              <SymbolIcon name="query_stats" />
              Pure Strategy
            </span>
          </div>
        </Reveal>

        <div className="group relative">
          <div className="absolute -inset-4 rounded-xl bg-primary/10 blur-3xl transition-all duration-500 group-hover:bg-primary/20" />
          <div className="relative grid grid-cols-2 gap-4">
            <Card className="space-y-4 bg-surface-high p-6 transition duration-300 hover:-translate-y-2">
              <SymbolIcon name="school" className="text-4xl text-primary" />
              <h3 className="font-heading text-lg font-bold">Learn</h3>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-highest">
                <div className="h-full w-2/3 bg-primary" />
              </div>
            </Card>
            <Card className="mt-8 space-y-4 bg-surface-highest p-6 transition duration-300 hover:-translate-y-2">
              <SymbolIcon name="query_stats" className="text-4xl text-secondary" />
              <h3 className="font-heading text-lg font-bold">Backtesting</h3>
              <div className="flex h-8 items-end gap-1">
                <div className="h-1/2 w-full bg-secondary/40" />
                <div className="h-3/4 w-full bg-secondary" />
                <div className="h-full w-full bg-secondary/60" />
              </div>
            </Card>
            <Card className="col-span-2 flex items-center gap-6 bg-surface-low p-6 transition duration-300 hover:-translate-y-2">
              <SymbolIcon name="quiz" className="text-4xl text-tertiary" />
              <div>
                <h3 className="font-heading text-lg font-bold">Quiz</h3>
                <p className="text-sm text-muted">
                  Reinforcing understanding through focused topic checks.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="shell-width max-w-4xl px-6 py-8">
        <Reveal>
          <div className="mb-6 inline-block rounded bg-secondary-container px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#f0a969]">
            Origins
          </div>
          <h2 className="mb-8 font-heading text-4xl font-bold tracking-tight">
            Our Story
          </h2>
          <div className="space-y-6 text-lg leading-8 text-muted">
            <p>
              localtradings.com started from a simple frustration: the noise. In a
              world full of get-rich-quick schemes and overly complex financial
              jargon, the mechanics of trading were getting lost before beginners
              even had a chance to understand them.
            </p>
            <p>
              We decided to build something different. A platform that strips away
              the ego and focuses on structure. If you understand the why behind
              the market, the how becomes easier to practice with discipline.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="shell-width px-6 py-20">
        <Reveal>
          <h2 className="mb-12 text-center font-heading text-4xl font-bold tracking-tight">
            What We Do
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-4">
          {[
            {
              title: "Teach the Basics",
              description: "Solid foundations in risk management and price action.",
              icon: "menu_book",
              tone: "text-primary",
              panel: "bg-surface-high",
            },
            {
              title: "Interactive Learning",
              description: "Modules and quizzes that make study paths easier to follow.",
              icon: "interactive_space",
              tone: "text-secondary",
              panel: "bg-surface-low",
            },
            {
              title: "Support Practice",
              description: "Risk-free environments to test ideas before real capital is involved.",
              icon: "fitness_center",
              tone: "text-tertiary",
              panel: "bg-surface-high",
            },
            {
              title: "Beginner Friendly",
              description: "Complexity simplified through cleaner UX and more honest text.",
              icon: "sentiment_satisfied",
              tone: "text-primary",
              panel: "bg-surface-low",
            },
          ].map((item) => (
            <Card className={`${item.panel} space-y-4 p-8 transition hover:bg-surface-highest`} key={item.title}>
              <SymbolIcon
                name={item.icon as SymbolIconName}
                className={`text-3xl ${item.tone}`}
              />
              <h3 className="font-heading text-xl font-bold">{item.title}</h3>
              <p className="text-sm leading-7 text-muted">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell-width grid gap-12 px-6 py-8 md:grid-cols-2">
        <Card className="relative overflow-hidden bg-surface-low p-12">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <SymbolIcon name="lightbulb" className="text-9xl" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            The Mission
          </h3>
          <p className="mt-6 font-heading text-3xl font-bold leading-tight">
            {aboutCopy.mission}
          </p>
        </Card>

        <Card className="relative overflow-hidden bg-surface-high p-12">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <SymbolIcon name="visibility" className="text-9xl" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-[0.22em] text-secondary">
            The Vision
          </h3>
          <p className="mt-6 font-heading text-3xl font-bold leading-tight">
            {aboutCopy.vision}
          </p>
        </Card>
      </section>

      <section className="shell-width px-6 py-20">
        <h2 className="mb-12 font-heading text-4xl font-bold tracking-tight">
          Who This Is For
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {audienceCards.map((item) => (
            <Card
              className={`bg-surface-lowest p-8 transition-all ${item.border}`}
              key={item.title}
            >
              <h3 className="mb-4 flex items-center gap-3 font-heading text-2xl font-bold">
                <SymbolIcon name={item.icon} className={item.tone} />
                {item.title}
              </h3>
              <p className="leading-7 text-muted">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell-width px-6 py-20">
        <h2 className="mb-12 text-center font-heading text-4xl font-bold tracking-tight">
          Our Core Values
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          {valueTiles.map((item) => (
            <Card
              className="space-y-2 bg-surface-high p-6 text-center transition hover:bg-surface-bright"
              key={item.label}
            >
              <SymbolIcon name={item.icon} className="text-primary" />
              <p className="font-bold">{item.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell-width px-6 py-8">
        <div className="rounded-[calc(var(--radius-xl)+0.35rem)] bg-surface-lowest p-12 text-center md:p-16">
          <Reveal className="mx-auto max-w-3xl space-y-8">
            <h2 className="font-heading text-4xl font-bold tracking-tight">
              Why We Built It This Way
            </h2>
            <p className="text-xl italic leading-9 text-muted">
              &quot;Trading is often sold as a high-adrenaline gamble. We built
              localtradings.com to prove it can be approached as a disciplined
              craft. By focusing on simplicity and honesty, we remove the
              emotional fog that causes many new traders to fail before they
              start.&quot;
            </p>
          </Reveal>
        </div>
      </section>

      <section className="shell-width space-y-12 px-6 py-20">
        <Reveal>
          <div>
          <h2 className="mb-4 font-heading text-4xl font-bold tracking-tight">
            The Company Behind the Platform
          </h2>
          <p className="max-w-2xl text-muted">
            We are an early-stage team of educators and developers committed to
            building a cleaner, more maintainable learning experience for new
            traders.
          </p>
          </div>
        </Reveal>

        <div className="grid gap-8 md:grid-cols-2">
          {companyCards.map((item) => (
            <Card className="flex gap-6 bg-surface-low p-8" key={item.title}>
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded ${item.panel}`}>
                <SymbolIcon name={item.icon} className={item.tone} />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="leading-7 text-muted">{item.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="shell-width max-w-3xl border-l-4 border-primary px-6 py-10 pl-12">
        <h2 className="mb-6 font-heading text-4xl font-bold tracking-tight">
          Looking Ahead
        </h2>
        <p className="text-lg leading-8 text-muted">
          Our roadmap is not about adding more bells and whistles. It is about
          refining the signal. Future updates can deepen backtesting and
          educational paths, while keeping the simplicity and honesty that
          define the platform.
        </p>
      </section>

      <section className="shell-width px-6 py-20">
        <div className="relative overflow-hidden rounded-[calc(var(--radius-xl)+0.35rem)] py-24 text-center">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,182,144,0.2),rgba(20,19,17,1)_60%,rgba(20,19,17,1))]" />
          <Reveal className="relative z-10 space-y-8 px-6">
            <h2 className="font-heading text-5xl font-extrabold tracking-[-0.04em]">
              Start with localtradings.com
            </h2>
            <p className="mx-auto max-w-xl text-lg text-muted">
              Build your trading foundation through clarity, structure, and
              practice before you move into higher-risk decisions.
            </p>
            <div className="flex flex-col justify-center gap-6 sm:flex-row">
              <Link className="btn-primary px-10 py-4" href="/sign-up">
                Sign Up Now
              </Link>
              <Link className="btn-secondary px-10 py-4" href="/sign-in">
                Sign In
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
