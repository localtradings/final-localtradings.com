import { describe, expect, it } from "vitest";

import {
  buildViewerState,
  createPlayerMatchState,
  getUnlockedReplayIndex,
  markDisconnectedForfeits,
  normalizePlayerMatchState,
} from "./state";
import type { WorkerBattleRoomState } from "./protocol";

function createRoom(): WorkerBattleRoomState {
  return {
    roomId: "room-1",
    lobbyCode: "ABCD12",
    roomType: "private",
    phase: "active",
    durationMinutes: 10,
    riskLimitPercent: null,
    maxDrawdownPercent: null,
    symbol: "XAUUSD",
    timeframe: "15min",
    maxPlayers: 5,
    createdAt: "2026-01-01T00:00:00.000Z",
    countdownEndsAt: null,
    officialStartAt: "2026-01-01T00:00:00.000Z",
    officialEndAt: "2026-01-01T00:10:00.000Z",
    lastEventAt: "2026-01-01T00:00:00.000Z",
    cancelReason: null,
    winnerUserId: null,
    historicalWindowId: null,
    currentCandleIndex: 2,
    initialRevealCount: 1,
    candles: [
      { time: 1, open: 100, high: 101, low: 99, close: 100.5, volume: 10 },
      { time: 2, open: 100.5, high: 102, low: 100, close: 101.5, volume: 12 },
      { time: 3, open: 101.5, high: 103, low: 101, close: 102.5, volume: 9 },
    ],
    pendingSeedData: null,
    players: [
      {
        userId: "viewer-1",
        displayName: "Viewer One",
        isCreator: true,
        isReady: true,
        readyDeadlineAt: null,
        joinedAt: "2026-01-01T00:00:00.000Z",
        lastHeartbeatAt: "2026-01-01T00:00:00.000Z",
        disconnectedAt: null,
        connected: true,
        status: "active",
        officialBalance: 100_250,
        officialRank: 1,
        tradesClosed: 1,
        wins: 1,
        losses: 0,
      },
    ],
    playerStates: {
      "viewer-1": createPlayerMatchState(0),
    },
    finalizedAt: null,
    resultsPersistedAt: null,
    lastResultPersistAttemptAt: null,
    lastResultPersistError: null,
  };
}

describe("battle room state helpers", () => {
  it("clamps persisted replay state when building the viewer snapshot", () => {
    const room = createRoom();
    room.players[0].status = "no_trade";
    room.playerStates["viewer-1"].replayIndex = 999;

    const view = buildViewerState(room, "viewer-1");

    expect(view.self.replayIndex).toBe(2);
    expect(view.self.revealedCandleCount).toBe(3);
    expect(view.self.lockReason).toBe("no_trade");
  });

  it("normalizes replay indexes below zero", () => {
    const room = createRoom();
    const state = createPlayerMatchState(-10);

    const normalized = normalizePlayerMatchState(room, state);

    expect(normalized.replayIndex).toBe(0);
  });

  it("unlocks replay candles gradually across the official match duration", () => {
    const room = createRoom();
    room.initialRevealCount = 2;
    room.playerStates["viewer-1"].replayIndex = 1;
    room.candles.push({ time: 4, open: 102.5, high: 104, low: 102, close: 103.5, volume: 11 });

    expect(getUnlockedReplayIndex(room, Date.parse("2026-01-01T00:00:00.000Z"))).toBe(2);
    expect(getUnlockedReplayIndex(room, Date.parse("2026-01-01T00:05:00.000Z"))).toBe(2);
    expect(getUnlockedReplayIndex(room, Date.parse("2026-01-01T00:10:00.000Z"))).toBe(3);
  });

  it("forfeits only truly disconnected active players after the grace window", () => {
    const room = createRoom();
    room.playerStates["viewer-1"].execution = {
      id: "trade-1",
      status: "active",
      direction: "Long",
      orderType: "market",
      entry: 100.5,
      stop: null,
      target: null,
      riskPercent: 1,
      riskAmount: 1000,
      volume: 10,
      balanceBeforeTrade: 100000,
      openedAtIndex: 0,
      openedAtTime: 1,
      closedAtIndex: null,
      closedAtTime: null,
      exitPrice: null,
      resultR: null,
      resultAmount: null,
      balanceAfterTrade: null,
      maxFavorableR: 0,
      maxAdverseR: 0,
      durationBars: null,
    };

    markDisconnectedForfeits(room, Date.parse("2026-01-01T00:00:59.000Z"));
    expect(room.players[0].status).toBe("active");
    expect(room.playerStates["viewer-1"].execution?.status).toBe("active");

    markDisconnectedForfeits(room, Date.parse("2026-01-01T00:01:00.000Z"));
    expect(room.players[0].status).toBe("forfeit");
    expect(room.playerStates["viewer-1"].execution).toBeNull();
  });
});
