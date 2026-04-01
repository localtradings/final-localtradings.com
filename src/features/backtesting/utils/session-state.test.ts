import { describe, expect, it } from "vitest";

import { BACKTEST_INITIAL_REVEAL_COUNT } from "@/features/backtesting/constants";
import type {
  BacktestSessionRecord,
  BacktestTradeDraft,
} from "@/features/backtesting/types";
import {
  buildSavePayload,
  createDefaultReplayState,
  createDuplicateSnapshot,
  sanitizeSnapshot,
} from "@/features/backtesting/utils/session-state";

const fallbackDraft: BacktestTradeDraft = {
  direction: "Long",
  orderType: "market",
  entry: "2358.0",
  hasStop: true,
  stop: "2352.0",
  hasTarget: true,
  target: "2368.8",
  volume: "",
  thesis: "Test thesis",
  reviewNotes: "",
};

describe("session-state", () => {
  it("creates a default replay state from the reveal count", () => {
    expect(createDefaultReplayState(250)).toEqual({
      replayIndex: 249,
      isPlaying: false,
      speedId: "2x",
    });
  });

  it("sanitizes snapshot fields and clamps replay index to the reveal floor", () => {
    const snapshot = sanitizeSnapshot(
      {
        replay: {
          replayIndex: 12,
          isPlaying: true,
          speedId: "",
        },
        tradeDraft: {
          direction: "Short",
          orderType: "stop",
          entry: "2400",
          hasStop: true,
          stop: "2410",
          hasTarget: true,
          target: "2380",
          volume: "1.2",
          thesis: "Short setup",
          reviewNotes: "note",
        },
        execution: {
          status: "active",
          entry: 2400,
          stop: 2410,
          target: 2380,
          orderType: "stop",
          riskAmount: 500,
        },
      },
      fallbackDraft,
      BACKTEST_INITIAL_REVEAL_COUNT,
    );

    expect(snapshot.replay.replayIndex).toBe(BACKTEST_INITIAL_REVEAL_COUNT - 1);
    expect(snapshot.replay.isPlaying).toBe(false);
    expect(snapshot.replay.speedId).toBe("2x");
    expect(snapshot.tradeDraft.direction).toBe("Short");
    expect(snapshot.execution.status).toBe("active");
    expect(snapshot.execution.riskAmount).toBe(500);
  });

  it("creates duplicate snapshots with a fresh draft execution and cleared review notes", () => {
    const session: BacktestSessionRecord = {
      id: "session-1",
      symbol: "XAUUSD",
      timeframe: "15min",
      windowStartAt: "2025-01-01T00:00:00.000Z",
      barsRequested: 1000,
      direction: "Long",
      entry: 2358,
      stop: 2352,
      target: 2368.8,
      status: "target_hit",
      resultR: 1.8,
      startedAt: "2025-01-01T00:00:00.000Z",
      finishedAt: "2025-01-01T01:00:00.000Z",
      thesis: "Captured continuation",
      reviewNotes: "Keep this setup",
      sessionStateJson: {
        replay: {
          replayIndex: 500,
          isPlaying: false,
          speedId: "4x",
        },
        tradeDraft: {
          ...fallbackDraft,
          reviewNotes: "Keep this setup",
        },
        execution: {
          status: "target_hit",
          orderType: "limit",
          entry: 2358,
          stop: 2352,
          target: 2368.8,
          riskPercent: 1,
          riskAmount: 1000,
          volume: 166.66,
          balanceBeforeTrade: 100000,
          openedAtIndex: 260,
          openedAtTime: 1735689600000,
          closedAtIndex: 280,
          closedAtTime: 1735690800000,
          exitPrice: 2368.8,
          resultR: 1.8,
          resultAmount: 1800,
          balanceAfterTrade: 101800,
          maxFavorableR: 1.9,
          maxAdverseR: 0.2,
          durationBars: 20,
        },
      },
    };

    const duplicate = createDuplicateSnapshot(session);

    expect(duplicate.replay.replayIndex).toBe(BACKTEST_INITIAL_REVEAL_COUNT - 1);
    expect(duplicate.tradeDraft.reviewNotes).toBe("");
    expect(duplicate.execution.status).toBe("draft");
    expect(duplicate.execution.entry).toBeNull();
  });

  it("builds the exact save payload shape expected by persistence", () => {
    const payload = buildSavePayload({
      id: "session-1",
      symbol: "XAUUSD",
      timeframe: "15min",
      windowStartAt: "2025-01-01T00:00:00.000Z",
      barsRequested: 1000,
      direction: "Long",
      entry: 2358,
      stop: 2352,
      target: 2368.8,
      status: "draft",
      resultR: null,
      startedAt: "2025-01-01T00:00:00.000Z",
      finishedAt: null,
      thesis: "Test",
      reviewNotes: "",
      sessionStateJson: {
        replay: createDefaultReplayState(BACKTEST_INITIAL_REVEAL_COUNT),
        tradeDraft: fallbackDraft,
        execution: {
          status: "draft",
          orderType: null,
          entry: null,
          stop: null,
          target: null,
          riskPercent: null,
          riskAmount: null,
          volume: null,
          balanceBeforeTrade: null,
          openedAtIndex: null,
          openedAtTime: null,
          closedAtIndex: null,
          closedAtTime: null,
          exitPrice: null,
          resultR: null,
          resultAmount: null,
          balanceAfterTrade: null,
          maxFavorableR: null,
          maxAdverseR: null,
          durationBars: null,
        },
      },
    });

    expect(payload).toMatchObject({
      id: "session-1",
      symbol: "XAUUSD",
      timeframe: "15min",
      thesis: "Test",
    });
    expect(Object.keys(payload)).toEqual([
      "id",
      "symbol",
      "timeframe",
      "windowStartAt",
      "barsRequested",
      "direction",
      "entry",
      "stop",
      "target",
      "status",
      "resultR",
      "startedAt",
      "finishedAt",
      "thesis",
      "reviewNotes",
      "sessionStateJson",
    ]);
  });
});
