import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { SymbolIcon, type SymbolIconName } from "@/components/ui/symbol-icon";
import { publicHelpCopy } from "@/content/marketing/site-copy";
import { FeedbackForm } from "@/features/help/feedback-form";

export function MarketingHelpPage() {
  return (
    <main className="theme-marketing">
      <section className="px-6 py-18 sm:py-24">
        <div className="shell-width space-y-10">
          <div className="rounded-[calc(var(--radius-xl)+0.35rem)] border border-outline/15 bg-[linear-gradient(180deg,rgba(54,52,49,0.45),rgba(29,27,25,0.92))] px-6 py-10 sm:px-10 sm:py-12">
            <p className="eyebrow">Public Help</p>
            <h1 className="mt-3 font-heading text-[2.6rem] font-extrabold tracking-tight sm:text-[3.9rem] sm:leading-[0.98]">
              Answers for routes, access, and product scope.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
              The public Help page stays in the marketing shell because it
              supports preview users. It explains how the product is structured
              before someone moves into the signed-in workspace.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicHelpCopy.categories.map((item) => (
              <Card
                className={`p-8 ${item.title === "Contact" ? "border-primary/25 bg-surface-high" : ""}`}
                key={item.title}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-primary/12 text-primary">
                  <SymbolIcon name={item.icon as SymbolIconName} />
                </span>
                <CardTitle className="mt-5">{item.title}</CardTitle>
                <CardDescription className="mt-3">
                  {item.description}
                </CardDescription>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  {item.title === "Contact" ? "Support center" : "Explore articles"}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-low/70 px-6 py-20">
        <div className="shell-width grid gap-8 lg:grid-cols-[0.95fr,1.05fr] xl:grid-cols-[0.9fr,1.1fr]">
          <Card className="p-8">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">
              Frequently asked
            </h2>
            <div className="mt-6 space-y-5">
              {publicHelpCopy.faq.map((item) => (
                <div
                  className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-low px-5 py-4"
                  key={item.question}
                >
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6">
            <Card className="p-8">
              <FeedbackForm source="public-help" />
            </Card>
            <Card className="p-8">
              <p className="eyebrow">Need context first?</p>
              <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight">
                Start with the public route map.
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Public routes explain the product, while signed-in routes are
                where quizzes, study progress, and backtesting actually live.
              </p>
              <div className="mt-6 grid gap-3 text-sm text-muted">
                <div className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-low px-4 py-3">
                  Public pages preview Learn, Backtesting, About, and Help.
                </div>
                <div className="rounded-[var(--radius-lg)] border border-outline/10 bg-surface-low px-4 py-3">
                  Signed-in routes stay under <code>/app/*</code>.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
