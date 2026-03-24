import type { Metadata } from "next";

import { moduleCatalog } from "@/content/modules";
import { ModulePage } from "@/features/learn/module-page";

type ModuleRouteProps = {
  params: Promise<{
    moduleSlug: string;
  }>;
};

export async function generateStaticParams() {
  return moduleCatalog.map((module) => ({
    moduleSlug: module.slug,
  }));
}

export async function generateMetadata({
  params,
}: ModuleRouteProps): Promise<Metadata> {
  const { moduleSlug } = await params;
  const learningModule = moduleCatalog.find((item) => item.slug === moduleSlug);
  return {
    title: learningModule?.title ?? "Module",
  };
}

export default async function ModuleRoute({ params }: ModuleRouteProps) {
  const { moduleSlug } = await params;
  return <ModulePage moduleSlug={moduleSlug} />;
}
