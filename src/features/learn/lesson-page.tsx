import { notFound } from "next/navigation";

import { getModuleBySlug } from "@/content/modules";
import { LessonPageClient } from "@/features/learn/lesson-page-client";
import { getLessonBySlug, getLessonsForModule } from "@/lib/content";
import { renderMdx } from "@/lib/mdx";

type LessonPageProps = {
  moduleSlug: string;
  lessonSlug: string;
};

export async function LessonPage({ moduleSlug, lessonSlug }: LessonPageProps) {
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule) {
    notFound();
  }

  const lesson = await getLessonBySlug(moduleSlug, lessonSlug).catch(() => null);
  if (!lesson) {
    notFound();
  }

  const lessons = await getLessonsForModule(moduleSlug);
  const mdx = await renderMdx(lesson.content);

  return (
    <LessonPageClient
      learningModule={learningModule}
      lesson={lesson.frontmatter}
      lessons={lessons}
    >
      {mdx}
    </LessonPageClient>
  );
}
