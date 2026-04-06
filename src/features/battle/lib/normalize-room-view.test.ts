import { describe, expect, it } from "vitest";

import type { BattleRoomView } from "@/features/battle/types";

import { normalizeBattleRoomView } from "./normalize-room-view";

function createRoomView(partial?: Partial<BattleRoomView["self"]>): BattleRoomView {
  return {
    room: {
      roomId: "room-1",
      lobbyCode: "ABCD12",
      roomType: "private",
      phase: "active",
      durationMinutes: 10,
      symbol: "BTCUSD",
      timeframe: "15min",
      maxPlayers: 5,
      createdAt: "2026-01-01T00:00:00.000Z",
      countdownEndsAt: null,
      officialStartAt: "2026-01-01T00:01:00.000Z",
      officialEndAt: "2026-01-01T00:11:00.000Z",
      lastEventAt: "2026-01-01T00:02:00.000Z",
      cancelReason: null,
      winnerUserId: null,
      currentCandleIndex: 252,
      candles: [
        { time: 1, open: 1, high: 1, low: 1, close: 1, volume: 0 },
        { time: 2, open: 2, high: 2, low: 2, close: 2, volume: 0 },
      ],
      players: [
        {
          userId: "user-1",
          displayName: "Host",
          isCreator: true,
          isReady: true,
          readyDeadlineAt: null,
          joinedAt: "2026-01-01T00:00:00.000Z",
          lastHeartbeatAt: "2026-01-01T00:02:00.000Z",
          disconnectedAt: null,
          connected: true,
          status: "active",
          officialBalance: 100_000,
          officialRank: 1,
          tradesClosed: 0,
          wins: 0,
          losses: 0,
          hasOpenTrade: true,
        },
      ],
      leaderboard: [
        {
          userId: "user-1",
          displayName: "Host",
          officialBalance: 100_000,
          officialRank: 1,
          tradesClosed: 0,
          status: "active",
        },
      ],
    },
    self: {
      activePenaltyUntil: null,
      replayIndex: 252,
      revealedCandleCount: 253,
      lockReason: null,
      hasEnteredTrade: true,
      participationStatus: "clear",
      participationWarningIssuedAt: null,
      participationDeadlineAt: null,
      execution: {
        id: "trade-1",
        direction: "Long",
        status: "active",
        orderType: "market",
        entry: 68_000,
        stop: null,
        target: null,
        riskPercent: 1.5,
        riskAmount: 1_500,
        volume: 1,
        openedAtIndex: 252,
        openedAtTime: 1,
        closedAtIndex: null,
        closedAtTime: null,
        exitPrice: null,
        resultR: null,
        resultAmount: null,
        balanceAfterTrade: null,
      },
      privateBalance: 100_000,
      unrealizedPnl: 0,
      realizedPnl: 0,
      ...partial,
    },
    token: null,
    viewerUserId: "user-1",
  };
}

describe("normalizeBattleRoomView", () => {
  it("preserves replay progress from the previous snapshot when legacy worker payloads omit it", () => {
    const previousRoomView = createRoomView();
    const legacyRoomView = createRoomView({
      replayIndex: undefined as never,
      revealedCandleCount: undefined as never,
      hasEnteredTrade: undefined as never,
      privateBalance: undefined as never,
      unrealizedPnl: undefined as never,
      realizedPnl: undefined as never,
      execution: undefined as never,
    }) as BattleRoomView & {
      self: BattleRoomView["self"] & {
        openTrade: {
          status: "open";
          direction: "Long";
          openedAtIndex: number;
          openedAtTime: number;
          entryPrice: number;
        };
      };
    };

    legacyRoomView.self.openTrade = {
      status: "open",
      direction: "Long",
      openedAtIndex: 252,
      openedAtTime: 1,
      entryPrice: 68_000,
    };

    const normalized = normalizeBattleRoomView(legacyRoomView, previousRoomView);

    expect(normalized?.self.replayIndex).toBe(252);
    expect(normalized?.self.revealedCandleCount).toBe(253);
    expect(normalized?.self.execution?.status).toBe("active");
    expect(normalized?.self.execution?.openedAtIndex).toBe(252);
    expect(normalized?.self.privateBalance).toBe(100_000);
  });
});
