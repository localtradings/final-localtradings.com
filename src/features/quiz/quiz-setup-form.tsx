"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type QuizSetupFormProps = {
  quizSlug: string;
  recommendedQuestionCount: number;
};

export function QuizSetupForm({
  quizSlug,
  recommendedQuestionCount,
}: QuizSetupFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState("standard");
  const [count, setCount] = useState(String(recommendedQuestionCount));

  function handleStart() {
    router.push(
      `/app/quiz/${quizSlug}/take?mode=${mode}&count=${count}`,
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="mode">
          Quiz Type
        </label>
        <Select id="mode" onChange={(event) => setMode(event.target.value)} value={mode}>
          <option value="standard">Standard Review</option>
          <option value="focused">Focused Practice</option>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground" htmlFor="count">
          Number of Questions
        </label>
        <Select id="count" onChange={(event) => setCount(event.target.value)} value={count}>
          <option value="3">3 questions</option>
          <option value={String(recommendedQuestionCount)}>
            {recommendedQuestionCount} questions
          </option>
          <option value="5">5 questions</option>
        </Select>
      </div>
      <Button className="w-full" onClick={handleStart} type="button">
        Start Quiz
      </Button>
    </div>
  );
}
