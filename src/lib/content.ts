import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";

import { moduleCatalog } from "@/content/modules";
import { quizCatalog } from "@/content/quizzes";
import type { HelpArticle, LessonFrontmatter } from "@/types/content";

const lessonsRoot = path.join(process.cwd(), "src", "content", "lessons");
const helpRoot = path.join(process.cwd(), "src", "content", "help");

async function readMdxFile<T>(filePath: string) {
  const source = await fs.readFile(filePath, "utf8");
  const { data, content } = matter(source);

  return {
    frontmatter: data as T,
    content,
  };
}

export const getAllModules = cache(async () => moduleCatalog);

export const getAllQuizzes = cache(async () => quizCatalog);

export const getLessonsForModule = cache(async (moduleSlug: string) => {
  const directory = path.join(lessonsRoot, moduleSlug);
  const files = await fs.readdir(directory);

  const lessons = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const filePath = path.join(directory, file);
        const { frontmatter } = await readMdxFile<LessonFrontmatter>(filePath);
        return frontmatter;
      }),
  );

  return lessons.sort((a, b) => a.order - b.order);
});

export const getLessonBySlug = cache(
  async (moduleSlug: string, lessonSlug: string) => {
    const filePath = path.join(lessonsRoot, moduleSlug, `${lessonSlug}.mdx`);
    const { frontmatter, content } = await readMdxFile<LessonFrontmatter>(filePath);
    return {
      frontmatter,
      content,
    };
  },
);

export const getHelpArticles = cache(async () => {
  const files = await fs.readdir(helpRoot);

  const articles = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const filePath = path.join(helpRoot, file);
        const { frontmatter } = await readMdxFile<HelpArticle>(filePath);
        return frontmatter;
      }),
  );

  return articles.sort((a, b) => a.title.localeCompare(b.title));
});

export const getHelpArticleBySlug = cache(async (slug: string) => {
  const filePath = path.join(helpRoot, `${slug}.mdx`);
  const { frontmatter, content } = await readMdxFile<HelpArticle>(filePath);
  return {
    frontmatter,
    content,
  };
});
