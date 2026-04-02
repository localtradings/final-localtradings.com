import { describe, expect, it } from "vitest";

import type {
  BacktestSessionRecord,
  BacktestTradeExecution,
} from "@/features/backtesting/types";
import {
  buildOrderAwareValidation,
  buildStatusNotice,
  createBalanceKey,
  createSettledExecutionKey,
  getReplayLoadErrorMessage,
  isBacktestCandlesResponse,
  mergeSessions,
  removeSession,
} from "@/features/backtesting/utils/workspace-helpers";

describe("workspace-helpers", () => {
  it("builds clear status notices for key execution states", () => {
    expect(buildStatusNotice("armed", null)).toBe(
      "Pending order armed. Price must touch entry first.",
    );
    expect(buildStatusNotice("active", null, { direction: "Long", entry: 2358 })).toBe(
      "Bought @ 2358. Trade is now live.",
    );
    expect(buildStatusNotice("target_hit", 1800)).toBe("Target hit +$1800.00. Replay paused.");
  });

  it("uses market price for market-order validation", () => {
    const validation = buildOrderAwareValidation(
      {
        direction: "Long",
        orderType: "market",
        entry: "",
        hasStop: true,
        stop: "2352",
        hasTarget: true,
        target: "2368.8",
        volume: "",
      },
      "Long",
      2358,
      2360,
    );

    expect(validation.isValid).toBe(true);
    expect(validation.entry).toBe(2358);
  });

  it("deduplicates, sorts, and trims merged sessions", () => {
    const makeSession = (id: string, startedAt: string): BacktestSessionRecord => ({
      id,
      symbol: "XAUUSD",
      timeframe: "15min",
      direction: "Long",
      orderType: "limit",
      volume: 1,
      entry: 2358,
      stop: 2352,
      target: 2368.8,
      exitPrice: 2368.8,
      status: "target_hit",
      resultR: 1.8,
      resultAmount: 1800,
      balanceAfter: 101800,
      startedAt,
      finishedAt: startedAt,
    });

    const current = Array.from({ length: 5 }, (_, index) =>
      makeSession(
        `session-${index}`,
        `2025-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
      ),
    );

    const merged = mergeSessions(current, makeSession("session-2", "2025-02-01T00:00:00.000Z"));

    expect(merged).toHaveLength(5);
    expect(merged[0]?.id).toBe("session-2");
    expect(merged.filter((session) => session.id === "session-2")).toHaveLength(1);
    expect(removeSession(merged, "session-2").some((session) => session.id === "session-2")).toBe(
      false,
    );
  });

  it("creates stable misc helper outputs", () => {
    const closedExecution: BacktestTradeExecution = {
      status: "manual_close",
      orderType: "limit",
      entry: 2358,
      stop: 2352,
      target: 2368.8,
      riskPercent: 1,
      riskAmount: 1000,
      volume: 166.66,
      balanceBeforeTrade: 100000,
      openedAtIndex: 250,
      openedAtTime: 1735689600000,
      closedAtIndex: 260,
      closedAtTime: 1735690200000,
      exitPrice: 2360,
      resultR: 0.33,
      resultAmount: 333,
      balanceAfterTrade: 100333,
      maxFavorableR: 0.4,
      maxAdverseR: 0.2,
      durationBars: 10,
    };

    expect(createSettledExecutionKey(closedExecution)).toBe(
      "manual_close:1735690200000:333",
    );
    expect(
      createSettledExecutionKey({ ...closedExecution, status: "active", closedAtTime: null }),
    ).toBe(null);
    expect(createBalanceKey("user-1")).toBe("backtesting-balance:user-1");
    expect(getReplayLoadErrorMessage(503)).toBe("Backtesting is unavailable right now.");
    expect(
      isBacktestCandlesResponse({
        instrument: { symbol: "XAUUSD" },
        selection: { initialRevealCount: 250, windowStartAt: "2025-01-01T00:00:00.000Z" },
        candles: [],
      }),
    ).toBe(true);
  });
});
