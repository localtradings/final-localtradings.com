import type { Metadata } from "next";

import { HelpArticlePage } from "@/features/help/help-article-page";
import { getHelpArticleBySlug, getHelpArticles } from "@/lib/content";

type HelpArticleRouteProps = {
  params: Promise<{
    articleSlug: string;
  }>;
};

export async function generateStaticParams() {
  const articles = await getHelpArticles();
  return articles.map((article) => ({
    articleSlug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: HelpArticleRouteProps): Promise<Metadata> {
  const { articleSlug } = await params;
  const article = await getHelpArticleBySlug(articleSlug).catch(() => null);

  return {
    title: article?.frontmatter.title ?? "Help Article",
  };
}

export default async function HelpArticleRoute({
  params,
}: HelpArticleRouteProps) {
  const { articleSlug } = await params;
  return <HelpArticlePage articleSlug={articleSlug} />;
}
