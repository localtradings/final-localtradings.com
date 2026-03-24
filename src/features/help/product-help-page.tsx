import { Card } from "@/components/ui/card";
import { getHelpArticles } from "@/lib/content";

import { FeedbackForm } from "./feedback-form";

export async function ProductHelpPage() {
  const articles = await getHelpArticles();

  return (
    <div className="space-y-10">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Help Center
          </p>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            Find answers, review product routes, and send feedback.
          </h1>
          <p className="max-w-3xl text-base leading-8 text-muted">
            This is the in-app help center. It uses the product shell rather than
            the marketing shell because it supports signed-in users.
          </p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1fr,0.95fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((article) => (
            <Card className="p-6" key={article.slug}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {article.category}
              </p>
              <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight">
                {article.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                {article.summary}
              </p>
            </Card>
          ))}
        </div>
        <Card className="p-8">
          <FeedbackForm
            description="Use the in-app help center to report bugs, ask workflow questions, or send product feedback."
            source="product-help"
            title="Contact & feedback"
          />
        </Card>
      </section>
    </div>
  );
}
