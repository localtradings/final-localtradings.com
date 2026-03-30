import { moduleCatalog } from "@/content/modules";
import { LearnHubClient } from "@/features/learn/learn-hub-client";
import { getLessonsForModule } from "@/lib/content";

export async function LearnHub() {
  const modules = await Promise.all(
    moduleCatalog.map(async (module) => ({
      ...module,
      lessons: await getLessonsForModule(module.slug),
    })),
  );

  return <LearnHubClient modules={modules} />;
}
