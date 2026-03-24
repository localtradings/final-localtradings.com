export type ProfileRecord = {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  bio?: string | null;
  focusArea?: string | null;
};

export type QuizAttemptRecord = {
  quizSlug: string;
  score: number;
  totalQuestions: number;
  answers: Array<{
    questionId: string;
    answerId: string;
    isCorrect: boolean;
  }>;
};

export type FeedbackInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
  source: "public-help" | "product-help";
};
