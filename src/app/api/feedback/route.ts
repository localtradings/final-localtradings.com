import { NextResponse } from "next/server";

import { submitFeedback } from "@/server/feedback/actions";
import type { FeedbackInput } from "@/types/data";

export async function POST(request: Request) {
  const body = (await request.json()) as FeedbackInput;
  const result = await submitFeedback(body);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message ?? "Feedback could not be submitted." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    message: "Feedback sent. Thanks for helping improve localtradings.com.",
  });
}
