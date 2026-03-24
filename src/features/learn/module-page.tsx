import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionHeading } from "@/components/patterns/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getModuleBySlug } from "@/content/modules";
import { getLessonsForModule } from "@/lib/content";
import { titleCaseFromSlug } from "@/lib/utils";

type ModulePageProps = {
  moduleSlug: string;
};

export async function ModulePage({ moduleSlug }: ModulePageProps) {
  const learningModule = getModuleBySlug(moduleSlug);
  if (!learningModule) {
    notFound();
  }

  const lessons = await getLessonsForModule(moduleSlug);

  return (
    <div className="space-y-10">
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8 lg:p-10">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{learningModule.level}</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              {learningModule.duration}
            </span>
          </div>
          <SectionHeading
            eyebrow="Module Overview"
            title={learningModule.title}
            description={learningModule.description}
          />
          <div className="grid gap-4 md:grid-cols-3">
            {learningModule.outcomes.map((outcome, index) => (
              <Card className="p-5" key={outcome}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  0{index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">{outcome}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
        <Card className="p-8">
          <SectionHeading
            eyebrow="Lessons"
            title={`Work through ${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`}
            description="Lesson pages use MDX content and stay derived from the signed-in Learn visual language."
          />
          <div className="mt-8 space-y-4">
            {lessons.map((lesson) => (
                <Link
                className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-5 py-4 transition hover:border-primary/30 hover:bg-surface-high"
                href={`/app/learn/${learningModule.slug}/${lesson.slug}`}
                key={lesson.slug}
              >
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{lesson.title}</p>
                  <p className="text-sm text-muted">{lesson.summary}</p>
                </div>
                <div className="text-right text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  <p>{lesson.duration}</p>
                  <p>Lesson {lesson.order}</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-8">
          <SectionHeading
            eyebrow="Module cues"
            title="What to focus on"
            description="Use these prompts before moving into quiz or backtesting."
          />
          <div className="mt-8 grid gap-4">
            {learningModule.lessonSlugs.map((lessonSlug) => (
              <div
                className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low px-4 py-4 text-sm text-muted"
                key={lessonSlug}
              >
                {titleCaseFromSlug(lessonSlug)}
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
