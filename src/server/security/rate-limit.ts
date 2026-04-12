import "server-only";

import { createHash } from "node:crypto";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type RateLimitDecision = {
  allowed: boolean;
  enforced: boolean;
  remaining: number | null;
  resetAt: string | null;
  retryAfterSeconds: number;
};

type ConsumeRateLimitOptions = {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
};

type ConsumeRateLimitRow = {
  allowed: boolean;
  remaining: number;
  reset_at: string;
  retry_after_seconds: number;
  current_count: number;
};

function isMissingRateLimitInfrastructure(error: { code?: string; message: string }) {
  return (
    error.code === "42P01" ||
    error.code === "42883" ||
    error.code === "PGRST202" ||
    error.message.includes("consume_rate_limit") ||
    error.message.includes("security_rate_limits")
  );
}

export function getClientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const cloudflareIp = headers.get("cf-connecting-ip")?.trim();
  if (cloudflareIp) {
    return cloudflareIp;
  }

  return "unknown";
}

export function normalizeRateLimitIdentifier(...parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim().toLowerCase() || "-")
    .join("|");
}

export function formatRetryAfterSeconds(seconds: number) {
  if (seconds <= 0) {
    return "a few seconds";
  }

  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export async function consumeRateLimit({
  scope,
  identifier,
  limit,
  windowSeconds,
  now = new Date(),
}: ConsumeRateLimitOptions): Promise<RateLimitDecision> {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      allowed: true,
      enforced: false,
      remaining: null,
      resetAt: null,
      retryAfterSeconds: 0,
    };
  }

  const identifierHash = createHash("sha256").update(identifier).digest("hex");

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_scope: scope,
    p_identifier_hash: identifierHash,
    p_limit: limit,
    p_window_seconds: windowSeconds,
    p_now: now.toISOString(),
  });

  if (error) {
    if (isMissingRateLimitInfrastructure(error)) {
      console.error("[rate-limit] missing_infrastructure", error.message);
      return {
        allowed: true,
        enforced: false,
        remaining: null,
        resetAt: null,
        retryAfterSeconds: 0,
      };
    }

    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? (data[0] as ConsumeRateLimitRow | undefined) : undefined;
  if (!row) {
    throw new Error("Rate limit response was empty.");
  }

  return {
    allowed: row.allowed,
    enforced: true,
    remaining: row.remaining,
    resetAt: row.reset_at,
    retryAfterSeconds: row.retry_after_seconds,
  };
}
