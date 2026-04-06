import { describe, expect, it, vi } from "vitest";

import { createPlayerMatchState } from "./state";
import { BattleRoomDO } from "./room";
import type { WorkerBattleRoomState } from "./protocol";

function createStorage(initialRoom: WorkerBattleRoomState) {
  let storedRoom = structuredClone(initialRoom);
  let scheduledAlarm: number | null = null;

  return {
    storage: {
      get: vi.fn(async (key: string) => (key === "room" ? structuredClone(storedRoom) : null)),
      put: vi.fn(async (key: string, value: WorkerBattleRoomState) => {
        if (key === "room") {
          storedRoom = structuredClone(value);
        }
      }),
      setAlarm: vi.fn(async (value: number) => {
        scheduledAlarm = value;
      }),
      deleteAlarm: vi.fn(async () => {
        scheduledAlarm = null;
      }),
    },
    getRoom: () => structuredClone(storedRoom),
    getAlarm: () => scheduledAlarm,
  };
}

function createActiveRoom(): WorkerBattleRoomState {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  return {
    roomId: "room-1",
    lobbyCode: "ABCD12",
    roomType: "private",
    phase: "active",
    durationMinutes: 10,
    symbol: "XAUUSD",
    timeframe: "15min",
    maxPlayers: 5,
    createdAt: nowIso,
    countdownEndsAt: null,
    officialStartAt: nowIso,
    officialEndAt: new Date(nowMs + 10 * 60 * 1_000).toISOString(),
    lastEventAt: nowIso,
    cancelReason: null,
    winnerUserId: null,
    currentCandleIndex: 0,
    initialRevealCount: 1,
    candles: [
      { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 10 },
      { time: 2, open: 100, high: 102, low: 100, close: 101, volume: 10 },
      { time: 3, open: 101, high: 103, low: 101, close: 102, volume: 10 },
      { time: 4, open: 102, high: 104, low: 102, close: 103, volume: 10 },
      { time: 5, open: 103, high: 105, low: 103, close: 104, volume: 10 },
      { time: 6, open: 104, high: 106, low: 104, close: 105, volume: 10 },
    ],
    pendingSeedData: null,
    players: [
      {
        userId: "user-1",
        displayName: "Trader One",
        isCreator: true,
        isReady: true,
        readyDeadlineAt: null,
        joinedAt: nowIso,
        lastHeartbeatAt: nowIso,
        disconnectedAt: null,
        connected: true,
        status: "active",
        officialBalance: 100_000,
        officialRank: 1,
        tradesClosed: 0,
        wins: 0,
        losses: 0,
      },
    ],
    playerStates: {
      "user-1": createPlayerMatchState(0),
    },
    finalizedAt: null,
  };
}

describe("BattleRoomDO", () => {
  it("schedules deadline alarms instead of per-second active ticks", async () => {
    const room = createActiveRoom();
    const storage = createStorage(room);
    const battleRoom = new BattleRoomDO(
      {
        storage: storage.storage,
      } as never,
      {
        APP_BASE_URL: "http://127.0.0.1:3000",
        BATTLE_SHARED_SECRET: "test-secret",
      } as never,
    );

    const beforeRequestMs = Date.now();
    const response = await battleRoom.fetch(
      new Request("https://battle-room/state", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1" }),
      }),
    );

    expect(response.ok).toBe(true);
    expect(storage.getAlarm()).not.toBeNull();
    expect(storage.getAlarm()).toBeGreaterThan(beforeRequestMs + 50_000);
  });

  it("accepts bounded replay checkpoints and advances the authoritative replay index", async () => {
    const room = createActiveRoom();
    const storage = createStorage(room);
    const battleRoom = new BattleRoomDO(
      {
        storage: storage.storage,
      } as never,
      {
        APP_BASE_URL: "http://127.0.0.1:3000",
        BATTLE_SHARED_SECRET: "test-secret",
      } as never,
    );

    const response = await battleRoom.fetch(
      new Request("https://battle-room/sync-replay", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1", replayIndex: 4 }),
      }),
    );
    const payload = (await response.json()) as { data: { room: { self: { replayIndex: number } } } };

    expect(response.ok).toBe(true);
    expect(payload.data.room.self.replayIndex).toBe(4);
    expect(storage.getRoom().playerStates["user-1"].replayIndex).toBe(4);
  });

  it("rejects oversized replay checkpoint jumps", async () => {
    const room = createActiveRoom();
    const storage = createStorage(room);
    const battleRoom = new BattleRoomDO(
      {
        storage: storage.storage,
      } as never,
      {
        APP_BASE_URL: "http://127.0.0.1:3000",
        BATTLE_SHARED_SECRET: "test-secret",
      } as never,
    );

    const response = await battleRoom.fetch(
      new Request("https://battle-room/sync-replay", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1", replayIndex: 5 }),
      }),
    );
    const payload = (await response.json()) as { reason: string };

    expect(response.ok).toBe(false);
    expect(payload.reason).toBe("invalid_replay_progression");
    expect(storage.getRoom().playerStates["user-1"].replayIndex).toBe(0);
  });
});
