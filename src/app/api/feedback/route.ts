import { NextResponse } from "next/server";

import { isTrustedBrowserOrigin } from "@/lib/security/origin";
import { submitFeedback } from "@/server/feedback/actions";
import type { FeedbackInput } from "@/types/data";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  const origin = request.headers.get("origin");

  if (!isTrustedBrowserOrigin(origin)) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403 });
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Expected JSON feedback payload." }, { status: 415 });
  }

  if (Number.isFinite(contentLength) && contentLength > 10_000) {
    return NextResponse.json({ message: "Feedback payload is too large." }, { status: 413 });
  }

  const parsedBody = await request.json().catch(() => null);
  if (!parsedBody || typeof parsedBody !== "object") {
    return NextResponse.json({ message: "Invalid feedback payload." }, { status: 400 });
  }

  const body = parsedBody as FeedbackInput;
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
