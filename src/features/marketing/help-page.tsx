import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { publicHelpCopy } from "@/content/marketing/site-copy";
import { FeedbackForm } from "@/features/help/feedback-form";

export function MarketingHelpPage() {
  return (
    <main className="theme-marketing">
      <section className="px-6 py-18 sm:py-24">
        <div className="shell-width space-y-10">
          <SectionHeading
            eyebrow="Public Help"
            title="Answers for routes, access, and product scope."
            description="The public Help page uses the marketing shell because it supports preview users, not signed-in workflow management."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {publicHelpCopy.categories.map((item) => (
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

      <section className="bg-surface-low/70 px-6 py-20">
        <div className="shell-width grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
          <Card className="p-8">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">
              Frequently asked
            </h2>
            <div className="mt-6 space-y-5">
              {publicHelpCopy.faq.map((item) => (
                <div className="space-y-2" key={item.question}>
                  <h3 className="font-semibold text-foreground">{item.question}</h3>
                  <p className="text-sm leading-7 text-muted">{item.answer}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-8">
            <FeedbackForm source="public-help" />
          </Card>
        </div>
      </section>
    </main>
  );
}
