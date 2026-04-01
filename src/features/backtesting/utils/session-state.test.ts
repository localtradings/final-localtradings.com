import { describe, expect, it } from "vitest";

import { BACKTEST_INITIAL_REVEAL_COUNT } from "@/features/backtesting/constants";
import type { BacktestTradeDraft } from "@/features/backtesting/types";
import {
  buildSavePayload,
  createDefaultReplayState,
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
