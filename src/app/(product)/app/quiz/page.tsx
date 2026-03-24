import type { Metadata } from "next";

import { QuizHub } from "@/features/quiz/quiz-hub";

export const metadata: Metadata = {
  title: "Quiz Hub",
};

export default function QuizHubRoute() {
  return <QuizHub />;
}
