import { NextResponse } from "next/server";

import { getCanonicalAppOrigin, isTrustedBrowserOrigin } from "@/lib/security/origin";
import {
  consumeRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
} from "@/server/security/rate-limit";
import { submitFeedback } from "@/server/feedback/actions";
import type { FeedbackInput } from "@/types/data";

const FEEDBACK_RATE_LIMIT = {
  limit: 8,
  windowSeconds: 60 * 60,
};

function createCorsHeaders(origin: string | null) {
  const allowedOrigin = isTrustedBrowserOrigin(origin) ? origin ?? getCanonicalAppOrigin() : null;
  if (!allowedOrigin) {
    return {} as Record<string, string>;
  }

  return {
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Origin": allowedOrigin,
    Vary: "Origin",
  } satisfies Record<string, string>;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  if (!isTrustedBrowserOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  const origin = request.headers.get("origin");
  const corsHeaders = createCorsHeaders(origin);

  if (!isTrustedBrowserOrigin(origin)) {
    return NextResponse.json({ message: "Origin not allowed." }, { status: 403, headers: corsHeaders });
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { message: "Expected JSON feedback payload." },
      { status: 415, headers: corsHeaders },
    );
  }

  if (Number.isFinite(contentLength) && contentLength > 10_000) {
    return NextResponse.json(
      { message: "Feedback payload is too large." },
      { status: 413, headers: corsHeaders },
    );
  }

  const parsedBody = await request.json().catch(() => null);
  if (!parsedBody || typeof parsedBody !== "object") {
    return NextResponse.json({ message: "Invalid feedback payload." }, { status: 400, headers: corsHeaders });
  }

  const rateLimit = await consumeRateLimit({
    scope: "api:feedback",
    identifier: getClientIpFromHeaders(new Headers(request.headers)),
    limit: FEEDBACK_RATE_LIMIT.limit,
    windowSeconds: FEEDBACK_RATE_LIMIT.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        message: `Too many feedback submissions. Try again in ${formatRetryAfterSeconds(rateLimit.retryAfterSeconds)}.`,
      },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const body = parsedBody as FeedbackInput;
  const result = await submitFeedback(body);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message ?? "Feedback could not be submitted." },
      { status: 400, headers: corsHeaders },
    );
  }

  return NextResponse.json(
    {
      message: "Feedback sent. Thanks for helping improve localtradings.com.",
    },
    {
      headers: corsHeaders,
    },
  );
}
