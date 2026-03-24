import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getModuleBySlug } from "@/content/modules";
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
  const currentIndex = lessons.findIndex((item) => item.slug === lessonSlug);
  const nextLesson = currentIndex >= 0 ? lessons[currentIndex + 1] : null;
  const mdx = await renderMdx(lesson.content);

  return (
    <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
      <article className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{learningModule.title}</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {lesson.frontmatter.duration}
            </span>
          </div>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
              {lesson.frontmatter.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-muted">
              {lesson.frontmatter.summary}
            </p>
          </div>
          <div className="prose-localtradings max-w-none">{mdx}</div>
        </div>
      </article>
      <div className="space-y-6">
        <Card className="p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Lesson Path
          </p>
          <div className="mt-5 grid gap-3">
            {lessons.map((item) => (
              <Link
                className={`rounded-[var(--radius-xl)] border px-4 py-4 text-sm transition ${
                  item.slug === lessonSlug
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-outline/15 bg-surface-low text-muted hover:border-primary/20 hover:bg-surface-high"
                  }`}
                href={`/app/learn/${learningModule.slug}/${item.slug}`}
                key={item.slug}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Next step
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Keep the route flow explicit: lesson first, then quiz or next lesson.
          </p>
          <div className="mt-6 grid gap-3">
            {nextLesson ? (
              <Link
                className="btn-primary"
                href={`/app/learn/${learningModule.slug}/${nextLesson.slug}`}
              >
                Continue to {nextLesson.title}
              </Link>
            ) : null}
            {lesson.frontmatter.quizSlug ? (
              <Link className="btn-secondary" href={`/app/quiz/${lesson.frontmatter.quizSlug}/setup`}>
                Take related quiz
              </Link>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
