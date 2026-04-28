import Link from "next/link";
import {
  BarChart3,
  Bot,
  ClipboardCheck,
  GraduationCap,
  Rocket,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { getHelpArticles } from "@/lib/content";

import { FeedbackForm } from "./feedback-form";

const iconMap: Record<string, LucideIcon> = {
  Account: UserRound,
  Learning: GraduationCap,
  Quiz: ClipboardCheck,
  Backtesting: BarChart3,
  "Getting Started": Rocket,
};

const helpRoutes = [
  { href: "/app/profile", label: "Profile", detail: "Account name, focus area, and bio" },
  { href: "/app/learn", label: "Learn", detail: "Modules, lessons, and saved progress" },
  { href: "/app/quiz", label: "Quiz", detail: "Setup, questions, and results" },
  { href: "/app/backtesting", label: "Backtesting", detail: "Replay practice and session review" },
  { href: "/app/battle", label: "Battle", detail: "Rooms, lobbies, and match flow" },
] as const;

export async function ProductHelpPage() {
  const articles = await getHelpArticles();

  return (
    <div className="space-y-6 pb-6">
      <section className="overflow-hidden rounded-[calc(var(--radius-xl)+0.35rem)] border border-outline/10 bg-[linear-gradient(180deg,rgba(23,32,44,0.98),rgba(13,20,29,0.98))] p-5 sm:p-7">
        <div className="relative">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-end">
            <div className="space-y-4">
            <p className="eyebrow">Knowledge Repository</p>
            <h1 className="font-heading text-[2.35rem] font-extrabold tracking-normal sm:text-[3rem]">
              Help center
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
              Find answers, review how routes work, and send feedback from
              inside the signed-in product shell.
            </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {helpRoutes.slice(0, 4).map((item) => (
                <Link
                  className="min-h-12 rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-primary/25 hover:bg-white/[0.055]"
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const Icon = iconMap[article.category] ?? ClipboardCheck;

          return (
            <Link
              className={`card-surface rounded-[var(--radius-lg)] border p-5 shadow-xl shadow-black/20 transition hover:-translate-y-0.5 hover:border-primary/25 ${article.category === "Account" ? "border-primary/20 bg-surface-highest" : "bg-surface-high"}`}
              href={`/app/help/${article.slug}`}
              key={article.slug}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-primary">
                <Icon className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h2 className="mt-5 font-heading text-[1.35rem] font-extrabold tracking-normal">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                {article.summary}
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                Open article
              </p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="p-5 sm:p-6">
          <FeedbackForm
            description="Ask a workflow question, report a product issue, or tell us which area of the platform needs refinement."
            source="product-help"
            title="Send Feedback"
          />
        </Card>

        <div className="grid gap-5">
          <Card className="p-5 sm:p-6">
            <div className="space-y-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-secondary-container/40 text-secondary">
                <Bot className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h2 className="font-heading text-2xl font-extrabold tracking-normal">
                Ask within the right scope
              </h2>
              <p className="text-sm leading-7 text-muted">
                Use product help for route guidance, quiz flow questions,
                backtesting issues, or profile/account basics. Community,
                wallet, and notification routes are not part of v1.
              </p>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="eyebrow">Quick map</p>
            <div className="mt-5 grid gap-3">
              {helpRoutes.map((item) => (
                <Link
                  className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-low px-4 py-3 transition hover:border-primary/25 hover:bg-surface-high"
                  href={item.href}
                  key={item.href}
                >
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
