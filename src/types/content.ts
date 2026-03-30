export type ModuleSummary = {
  slug: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate";
  duration: string;
  outcomes: string[];
  lessonSlugs: string[];
  featured?: boolean;
  releaseOrder: number;
  topic: string;
  imageSrc?: string;
};

export type LessonFrontmatter = {
  slug: string;
  moduleSlug: string;
  title: string;
  summary: string;
  duration: string;
  order: number;
  topic: string;
  imageSrc?: string;
  quizSlug?: string;
};

export type LearnHubEntry = {
  kind: "module" | "lesson";
  slug: string;
  moduleSlug: string;
  title: string;
  summary: string;
  topic: string;
  imageSrc?: string;
  href: string;
  releaseOrder: number;
  lessonOrder?: number;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  explanation: string;
  options: Array<{
    id: string;
    label: string;
  }>;
  answerId: string;
};

export type QuizDefinition = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  difficulty: "Beginner" | "Intermediate";
  recommendedQuestionCount: number;
  estimatedMinutes: number;
  questions: QuizQuestion[];
};

export type HelpArticle = {
  slug: string;
  title: string;
  category:
    | "Getting Started"
    | "Learning"
    | "Quiz"
    | "Backtesting"
    | "Account";
  summary: string;
};
