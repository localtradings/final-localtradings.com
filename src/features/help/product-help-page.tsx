import { Card } from "@/components/ui/card";
import { getHelpArticles } from "@/lib/content";

import { FeedbackForm } from "./feedback-form";

const iconMap: Record<string, string> = {
  Account: "person",
  Learning: "school",
  Quiz: "quiz",
  Backtesting: "query_stats",
  "Getting Started": "rocket_launch",
};

export async function ProductHelpPage() {
  const articles = await getHelpArticles();

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[calc(var(--radius-xl)+0.35rem)] border border-outline/10 bg-[linear-gradient(180deg,rgba(23,32,44,0.98),rgba(13,20,29,0.98))] p-6 sm:p-8 lg:p-10">
        <div className="relative">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative space-y-4">
            <p className="eyebrow">Knowledge Repository</p>
            <h1 className="font-heading text-[2.4rem] font-extrabold tracking-tight sm:text-[3.4rem]">
              HELP CENTER <span className="font-light text-primary/35">Help Center</span>
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted">
              Find answers, review how routes work, and send feedback from
              inside the signed-in product shell.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => {
          const icon = iconMap[article.category] ?? "description";

          return (
            <Card
              className={`p-6 ${article.category === "Account" ? "border-primary/20 bg-surface-highest" : "bg-surface-high"}`}
              key={article.slug}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary/10 text-primary">
                <span className="material-symbols-outlined">{icon}</span>
              </span>
              <h2 className="mt-5 font-heading text-2xl font-extrabold tracking-tight">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                {article.summary}
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                Explore article
              </p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <Card className="p-8">
          <FeedbackForm
            description="Ask a workflow question, report a product issue, or tell us which area of the platform needs refinement."
            source="product-help"
            title="Send Feedback"
          />
        </Card>

        <div className="grid gap-6">
          <Card className="p-8">
            <div className="space-y-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-secondary-container/40 text-secondary">
                <span className="material-symbols-outlined">assistant</span>
              </span>
              <h2 className="font-heading text-2xl font-extrabold tracking-tight">
                Ask within the right scope
              </h2>
              <p className="text-sm leading-7 text-muted">
                Use product help for route guidance, quiz flow questions,
                backtesting issues, or profile/account basics. Community,
                wallet, and notification routes are not part of v1.
              </p>
            </div>
          </Card>

          <Card className="p-8">
            <p className="eyebrow">Quick map</p>
            <div className="mt-5 grid gap-3">
              {[
                "Dashboard, Learn, Quiz, Backtesting, Profile, and Help live under /app.",
                "Public Help explains access and scope before sign-in.",
                "Lesson content stays file-driven rather than database-driven in v1.",
              ].map((item) => (
                <div
                  className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-low px-4 py-3 text-sm leading-7 text-muted"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
