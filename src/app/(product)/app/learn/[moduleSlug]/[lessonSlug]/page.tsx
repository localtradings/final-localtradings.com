import type { Metadata } from "next";

import { moduleCatalog } from "@/content/modules";
import { getLessonsForModule } from "@/lib/content";
import { LessonPage } from "@/features/learn/lesson-page";

type LessonRouteProps = {
  params: Promise<{
    moduleSlug: string;
    lessonSlug: string;
  }>;
};

export async function generateStaticParams() {
  const params = await Promise.all(
    moduleCatalog.map(async (module) => {
      const lessons = await getLessonsForModule(module.slug);
      return lessons.map((lesson) => ({
        moduleSlug: module.slug,
        lessonSlug: lesson.slug,
      }));
    }),
  );

  return params.flat();
}

export async function generateMetadata({
  params,
}: LessonRouteProps): Promise<Metadata> {
  const { lessonSlug } = await params;
  return {
    title: lessonSlug.split("-").join(" "),
  };
}

export default async function LessonRoute({ params }: LessonRouteProps) {
  const { moduleSlug, lessonSlug } = await params;
  return <LessonPage lessonSlug={lessonSlug} moduleSlug={moduleSlug} />;
}
