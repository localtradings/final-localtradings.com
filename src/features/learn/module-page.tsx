import { notFound } from "next/navigation";

import { getModuleBySlug } from "@/content/modules";
import { ModulePageClient } from "@/features/learn/module-page-client";
import { getLessonsForModule } from "@/lib/content";

type ModulePageProps = {
  moduleSlug: string;
};

export async function ModulePage({ moduleSlug }: ModulePageProps) {
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule) {
    notFound();
  }

  const lessons = await getLessonsForModule(moduleSlug);

  return <ModulePageClient learningModule={learningModule} lessons={lessons} />;
}
