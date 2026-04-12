import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

import {
  consumeRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
  normalizeRateLimitIdentifier,
} from "@/server/security/rate-limit";

describe("rate limit helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes identifiers and hashes them through the rpc helper", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          allowed: false,
          remaining: 0,
          reset_at: "2026-04-13T03:00:00.000Z",
          retry_after_seconds: 42,
          current_count: 6,
        },
      ],
      error: null,
    });

    mocks.createSupabaseServiceRoleClient.mockReturnValue({ rpc });

    const decision = await consumeRateLimit({
      scope: "auth:sign-in",
      identifier: normalizeRateLimitIdentifier("203.0.113.10", "Trader@Email.COM "),
      limit: 5,
      windowSeconds: 60,
      now: new Date("2026-04-13T02:59:18.000Z"),
    });

    expect(decision).toEqual({
      allowed: false,
      enforced: true,
      remaining: 0,
      resetAt: "2026-04-13T03:00:00.000Z",
      retryAfterSeconds: 42,
    });

    expect(rpc).toHaveBeenCalledWith(
      "consume_rate_limit",
      expect.objectContaining({
        p_scope: "auth:sign-in",
        p_limit: 5,
        p_window_seconds: 60,
      }),
    );

    expect(rpc.mock.calls[0]?.[1]?.p_identifier_hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails open when the service-role client is unavailable", async () => {
    mocks.createSupabaseServiceRoleClient.mockReturnValue(null);

    await expect(
      consumeRateLimit({
        scope: "auth:sign-in",
        identifier: "203.0.113.10|-",
        limit: 5,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({
      allowed: true,
      enforced: false,
      remaining: null,
      resetAt: null,
      retryAfterSeconds: 0,
    });
  });

  it("extracts the first forwarded IP and formats retry windows", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.1",
    });

    expect(getClientIpFromHeaders(headers)).toBe("203.0.113.10");
    expect(formatRetryAfterSeconds(9)).toBe("9 seconds");
    expect(formatRetryAfterSeconds(61)).toBe("2 minutes");
    expect(formatRetryAfterSeconds(3601)).toBe("2 hours");
  });
});
