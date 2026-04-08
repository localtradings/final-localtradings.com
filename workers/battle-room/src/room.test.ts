import { describe, expect, it, vi } from "vitest";

import { createLobbyPlayer, createPlayerMatchState } from "./state";
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

function createLobbyRoom(): WorkerBattleRoomState {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  return {
    roomId: "room-1",
    lobbyCode: null,
    roomType: "public",
    phase: "lobby",
    durationMinutes: 10,
    symbol: null,
    timeframe: null,
    maxPlayers: 5,
    createdAt: nowIso,
    countdownEndsAt: new Date(nowMs + 60_000).toISOString(),
    officialStartAt: null,
    officialEndAt: null,
    lastEventAt: nowIso,
    cancelReason: null,
    winnerUserId: null,
    currentCandleIndex: null,
    initialRevealCount: 0,
    candles: [],
    pendingSeedData: null,
    players: [
      createLobbyPlayer({
        userId: "user-1",
        displayName: "Lobby Leaver",
        isCreator: true,
        nowIso,
      }),
      createLobbyPlayer({
        userId: "user-2",
        displayName: "Lobby Stayer",
        isCreator: false,
        nowIso,
      }),
    ],
    playerStates: {
      "user-1": createPlayerMatchState(0),
      "user-2": createPlayerMatchState(0),
    },
    finalizedAt: null,
  };
}

function mockSeedFetch() {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);

    if (url.endsWith("/api/battle/internal/seed-room")) {
      return new Response(
        JSON.stringify({
          ok: true,
          data: {
            selection: {
              symbol: "EURUSD",
              timeframe: "5min",
              initialRevealCount: 3,
            },
            candles: [
              { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 10 },
              { time: 2, open: 100, high: 102, low: 100, close: 101, volume: 10 },
              { time: 3, open: 101, high: 103, low: 101, close: 102, volume: 10 },
              { time: 4, open: 102, high: 104, low: 102, close: 103, volume: 10 },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url.endsWith("/api/battle/internal/persist-room")) {
      return new Response(null, { status: 200 });
    }

    throw new Error(`Unexpected fetch in test: ${url}`);
  });
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
    room.initialRevealCount = 5;
    const storage = createStorage(room);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
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
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("rejects replay checkpoints beyond the unlocked live frontier", async () => {
    const room = createActiveRoom();
    room.officialStartAt = new Date().toISOString();
    room.officialEndAt = new Date(Date.now() + 10 * 60 * 1_000).toISOString();
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
        body: JSON.stringify({ userId: "user-1", replayIndex: 2 }),
      }),
    );
    const payload = (await response.json()) as { reason: string; message: string };

    expect(response.ok).toBe(false);
    expect(payload.reason).toBe("invalid_replay_progression");
    expect(payload.message).toContain("live battle frontier");
    expect(storage.getRoom().playerStates["user-1"].replayIndex).toBe(0);
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
        body: JSON.stringify({ userId: "user-1", replayIndex: 60 }),
      }),
    );
    const payload = (await response.json()) as { reason: string };

    expect(response.ok).toBe(false);
    expect(payload.reason).toBe("invalid_replay_progression");
    expect(storage.getRoom().playerStates["user-1"].replayIndex).toBe(0);
  });

  it("removes a lobby player from the room when they leave", async () => {
    const room = createLobbyRoom();
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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );

    const response = await battleRoom.fetch(
      new Request("https://battle-room/leave", {
        method: "POST",
        body: JSON.stringify({ userId: "user-1" }),
      }),
    );
    const payload = (await response.json()) as { ok: boolean; data: { room: null } };

    expect(response.ok).toBe(true);
    expect(payload.data.room).toBeNull();
    expect(storage.getRoom().players.map((player) => player.userId)).toEqual(["user-2"]);
    expect(storage.getRoom().playerStates["user-1"]).toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/battle/internal/persist-room",
      expect.objectContaining({
        method: "POST",
      }),
    );

    fetchSpy.mockRestore();
  });

  it("does not start a partially filled lobby early when all present players are ready", async () => {
    const room = createLobbyRoom();
    room.players.forEach((player) => {
      player.isReady = true;
      player.status = "ready";
      player.readyDeadlineAt = null;
    });

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

    const fetchSpy = mockSeedFetch();

    await battleRoom.alarm();

    expect(storage.getRoom().phase).toBe("lobby");
    expect(fetchSpy).not.toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/battle/internal/seed-room",
      expect.anything(),
    );

    fetchSpy.mockRestore();
  });

  it("starts the lobby immediately when the room becomes full", async () => {
    const room = createLobbyRoom();
    const nowIso = room.createdAt;

    room.players = [
      createLobbyPlayer({
        userId: "user-1",
        displayName: "Player One",
        isCreator: true,
        nowIso,
      }),
      createLobbyPlayer({
        userId: "user-2",
        displayName: "Player Two",
        isCreator: false,
        nowIso,
      }),
      createLobbyPlayer({
        userId: "user-3",
        displayName: "Player Three",
        isCreator: false,
        nowIso,
      }),
      createLobbyPlayer({
        userId: "user-4",
        displayName: "Player Four",
        isCreator: false,
        nowIso,
      }),
      createLobbyPlayer({
        userId: "user-5",
        displayName: "Player Five",
        isCreator: false,
        nowIso,
      }),
    ];
    room.playerStates = {
      "user-1": createPlayerMatchState(0),
      "user-2": createPlayerMatchState(0),
      "user-3": createPlayerMatchState(0),
      "user-4": createPlayerMatchState(0),
      "user-5": createPlayerMatchState(0),
    };

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

    const fetchSpy = mockSeedFetch();

    await battleRoom.alarm();

    const startedRoom = storage.getRoom();
    expect(startedRoom.phase).toBe("active");
    expect(startedRoom.players.every((player) => player.status === "active")).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:3000/api/battle/internal/seed-room",
      expect.objectContaining({
        method: "POST",
      }),
    );

    fetchSpy.mockRestore();
  });

  it("starts a partially filled lobby when the countdown expires with at least two players", async () => {
    const room = createLobbyRoom();
    room.countdownEndsAt = new Date(Date.now() - 1_000).toISOString();

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

    const fetchSpy = mockSeedFetch();

    await battleRoom.alarm();

    const startedRoom = storage.getRoom();
    expect(startedRoom.phase).toBe("active");
    expect(startedRoom.players.slice(0, 2).every((player) => player.status === "active")).toBe(true);

    fetchSpy.mockRestore();
  });
});
