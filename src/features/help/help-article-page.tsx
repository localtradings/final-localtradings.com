import Link from "next/link";
import { notFound } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getHelpArticleBySlug } from "@/lib/content";
import { renderMdx } from "@/lib/mdx";

const categoryActions = {
  Account: { href: "/app/profile", label: "Open profile" },
  Learning: { href: "/app/learn", label: "Open Learn" },
  Quiz: { href: "/app/quiz", label: "Open Quiz" },
  Backtesting: { href: "/app/backtesting", label: "Open Backtesting" },
  "Getting Started": { href: "/app", label: "Open dashboard" },
} as const;

type HelpArticlePageProps = {
  articleSlug: string;
};

export async function HelpArticlePage({ articleSlug }: HelpArticlePageProps) {
  const article = await getHelpArticleBySlug(articleSlug).catch(() => null);
  if (!article) {
    notFound();
  }

  const action = categoryActions[article.frontmatter.category];
  const mdx = await renderMdx(article.content);

  return (
    <div className="grid gap-5 pb-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <article className="rounded-[calc(var(--radius-xl)+0.25rem)] border border-outline/10 bg-surface-high p-5 sm:p-7">
        <Link className="text-sm font-semibold text-primary hover:text-primary/80" href="/app/help">
          Back to help
        </Link>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
          {article.frontmatter.category}
        </p>
        <h1 className="mt-3 font-heading text-[2.1rem] font-extrabold tracking-normal text-foreground sm:text-[2.75rem]">
          {article.frontmatter.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted sm:text-base sm:leading-8">
          {article.frontmatter.summary}
        </p>
        <div className="mt-8 border-t border-outline/10 pt-2">
          {mdx}
        </div>
      </article>

      <aside className="grid content-start gap-4">
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
            Related action
          </p>
          <Link className="btn-primary mt-4 min-h-11 w-full px-4 py-3 text-sm" href={action.href}>
            {action.label}
          </Link>
          <Link className="btn-secondary mt-3 min-h-11 w-full px-4 py-3 text-sm" href="/app/help">
            Send feedback
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
            Product scope
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            Help articles only document routes and features that exist in the current
            product shell.
          </p>
        </Card>
      </aside>
    </div>
  );
}
