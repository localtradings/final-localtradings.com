import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getCurrentProfile: vi.fn(),
  getActiveBattlePenalty: vi.fn(),
  joinPublicBattleMatch: vi.fn(),
  createBattleRoom: vi.fn(),
  joinOpenBattleRoom: vi.fn(),
  createBattleRoomId: vi.fn(),
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  hasBattleWorkerEnv: () => true,
}));

vi.mock("@/server/auth/session", () => ({
  requireUser: mocks.requireUser,
}));

vi.mock("@/server/profile/queries", () => ({
  getCurrentProfile: mocks.getCurrentProfile,
}));

vi.mock("@/server/battle/penalties", () => ({
  getActiveBattlePenalty: mocks.getActiveBattlePenalty,
}));

vi.mock("@/server/battle/worker-client", () => ({
  createBattleRoom: mocks.createBattleRoom,
  joinBattleRoom: vi.fn(),
  joinOpenBattleRoom: mocks.joinOpenBattleRoom,
  joinPublicBattleMatch: mocks.joinPublicBattleMatch,
  leaveBattleRoom: vi.fn(),
  openBattleTrade: vi.fn(),
  closeBattleTrade: vi.fn(),
  refreshBattleRoomView: vi.fn(),
  setBattleReadyState: vi.fn(),
}));

vi.mock("@/server/battle/room-id", () => ({
  createBattleRoomId: mocks.createBattleRoomId,
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

import {
  createPrivateBattleRoomAction,
  createOpenBattleRoomAction,
  joinOpenBattleRoomAction,
  joinRandomBattleMatchAction,
} from "@/server/battle/actions";

describe("joinRandomBattleMatchAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({
      id: "user-1",
      email: "public-user@example.com",
    });
    mocks.getCurrentProfile.mockResolvedValue({
      displayName: "Queue Tester",
      fullName: "Queue Tester",
      isPro: false,
    });
    mocks.getActiveBattlePenalty.mockResolvedValue(null);
    mocks.createBattleRoomId.mockReturnValue("room-public-1");
    mocks.createSupabaseServiceRoleClient.mockReturnValue(null);
    mocks.createBattleRoom.mockResolvedValue({
      ok: true,
      data: {
        room: {
          room: {
            roomId: "11111111-1111-4111-8111-111111111111",
            lobbyCode: null,
            roomType: "open",
            phase: "lobby",
            durationMinutes: 30,
            symbol: null,
            timeframe: null,
            maxPlayers: 4,
            riskLimitPercent: 2,
            maxDrawdownPercent: 10,
            createdAt: "2026-01-01T00:00:00.000Z",
            countdownEndsAt: "2026-01-01T00:01:00.000Z",
            officialStartAt: null,
            officialEndAt: null,
            lastEventAt: "2026-01-01T00:00:00.000Z",
            cancelReason: null,
            winnerUserId: null,
            players: [],
            leaderboard: [],
            currentCandleIndex: null,
            initialRevealCount: 0,
            candles: [],
          },
          self: {
            activePenaltyUntil: null,
            openTrade: null,
            privateBalance: 100000,
            unrealizedPnl: 0,
            realizedPnl: 0,
          },
          token: null,
          viewerUserId: "user-1",
        },
      },
    });
    mocks.joinOpenBattleRoom.mockResolvedValue({
      ok: true,
      data: {
        room: {
          room: {
            roomId: "11111111-1111-4111-8111-111111111111",
            lobbyCode: null,
            roomType: "open",
            phase: "lobby",
            durationMinutes: 30,
            symbol: null,
            timeframe: null,
            maxPlayers: 4,
            riskLimitPercent: 2,
            maxDrawdownPercent: 10,
            createdAt: "2026-01-01T00:00:00.000Z",
            countdownEndsAt: "2026-01-01T00:01:00.000Z",
            officialStartAt: null,
            officialEndAt: null,
            lastEventAt: "2026-01-01T00:00:00.000Z",
            cancelReason: null,
            winnerUserId: null,
            players: [],
            leaderboard: [],
            currentCandleIndex: null,
            initialRevealCount: 0,
            candles: [],
          },
          self: {
            activePenaltyUntil: null,
            openTrade: null,
            privateBalance: 100000,
            unrealizedPnl: 0,
            realizedPnl: 0,
          },
          token: null,
          viewerUserId: "user-1",
        },
      },
    });
  });

  it("routes public joins through the worker matchmaker", async () => {
    mocks.joinPublicBattleMatch.mockResolvedValue({
      ok: true,
      data: {
        room: {
          room: {
            roomId: "room-public-1",
            lobbyCode: null,
            roomType: "public",
            phase: "lobby",
            durationMinutes: 15,
            symbol: null,
            timeframe: null,
            maxPlayers: 5,
            riskLimitPercent: 2,
            maxDrawdownPercent: 10,
            createdAt: "2026-01-01T00:00:00.000Z",
            countdownEndsAt: "2026-01-01T00:01:00.000Z",
            officialStartAt: null,
            officialEndAt: null,
            lastEventAt: "2026-01-01T00:00:00.000Z",
            cancelReason: null,
            winnerUserId: null,
            players: [],
            leaderboard: [],
            currentCandleIndex: null,
            initialRevealCount: 0,
            candles: [],
          },
          self: {
            activePenaltyUntil: null,
            openTrade: null,
            privateBalance: 100000,
            unrealizedPnl: 0,
            realizedPnl: 0,
          },
          token: null,
          viewerUserId: "user-1",
        },
      },
    });

    const result = await joinRandomBattleMatchAction();

    expect(mocks.joinPublicBattleMatch).toHaveBeenCalledWith({
      roomId: "room-public-1",
      userId: "user-1",
      displayName: "Queue Tester",
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/app/battle/lobby/room-public-1",
      roomId: "room-public-1",
      lobbyCode: null,
    });
  });

  it("returns the penalty state before queueing", async () => {
    mocks.getActiveBattlePenalty.mockResolvedValue({
      endsAt: "2026-01-01T00:30:00.000Z",
    });

    const result = await joinRandomBattleMatchAction();

    expect(mocks.joinPublicBattleMatch).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      reason: "cooldown_active",
      message: "You are currently on cooldown.",
      penaltyEndsAt: "2026-01-01T00:30:00.000Z",
    });
  });

  it("creates an open room for pro users with the enforced rules", async () => {
    mocks.getCurrentProfile.mockResolvedValue({
      displayName: "Queue Tester",
      fullName: "Queue Tester",
      isPro: true,
    });

    const result = await createOpenBattleRoomAction({
      durationMinutes: 30,
      maxPlayers: 4,
    });

    expect(mocks.createBattleRoom).toHaveBeenCalledWith({
      roomId: "room-public-1",
      roomType: "open",
      lobbyCode: null,
      durationMinutes: 30,
      maxPlayers: 4,
      riskLimitPercent: 2,
      maxDrawdownPercent: 10,
      userId: "user-1",
      displayName: "Queue Tester",
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/app/battle/lobby/11111111-1111-4111-8111-111111111111",
      roomId: "11111111-1111-4111-8111-111111111111",
      lobbyCode: null,
    });
  });

  it("creates a private room with the selected player cap", async () => {
    mocks.createBattleRoom.mockResolvedValue({
      ok: true,
      data: {
        room: {
          room: {
            roomId: "22222222-2222-4222-8222-222222222222",
            lobbyCode: "AB12CD",
            roomType: "private",
            phase: "lobby",
            durationMinutes: 10,
            symbol: null,
            timeframe: null,
            maxPlayers: 8,
            riskLimitPercent: null,
            maxDrawdownPercent: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            countdownEndsAt: "2026-01-01T00:01:00.000Z",
            officialStartAt: null,
            officialEndAt: null,
            lastEventAt: "2026-01-01T00:00:00.000Z",
            cancelReason: null,
            winnerUserId: null,
            players: [],
            leaderboard: [],
            currentCandleIndex: null,
            initialRevealCount: 0,
            candles: [],
          },
          self: {
            activePenaltyUntil: null,
            openTrade: null,
            privateBalance: 100000,
            unrealizedPnl: 0,
            realizedPnl: 0,
          },
          token: null,
          viewerUserId: "user-1",
        },
      },
    });

    const result = await createPrivateBattleRoomAction({
      durationMinutes: 10,
      maxPlayers: 8,
    });

    expect(mocks.createBattleRoom).toHaveBeenCalledWith({
      roomId: "room-public-1",
      roomType: "private",
      lobbyCode: expect.any(String),
      durationMinutes: 10,
      maxPlayers: 8,
      userId: "user-1",
      displayName: "Queue Tester",
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/app/battle/lobby/22222222-2222-4222-8222-222222222222",
      roomId: "22222222-2222-4222-8222-222222222222",
      lobbyCode: "AB12CD",
    });
  });

  it("rejects open-room creation for non-pro users", async () => {
    const result = await createOpenBattleRoomAction({
      durationMinutes: 30,
      maxPlayers: 4,
    });

    expect(mocks.createBattleRoom).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      reason: "pro_required",
      message: "Only Pro users can create open rooms.",
    });
  });

  it("joins an open room through the worker", async () => {
    const result = await joinOpenBattleRoomAction({
      roomId: "11111111-1111-4111-8111-111111111111",
    });

    expect(mocks.joinOpenBattleRoom).toHaveBeenCalledWith({
      roomId: "11111111-1111-4111-8111-111111111111",
      userId: "user-1",
      displayName: "Queue Tester",
    });
    expect(result).toEqual({
      ok: true,
      redirectTo: "/app/battle/lobby/11111111-1111-4111-8111-111111111111",
      roomId: "11111111-1111-4111-8111-111111111111",
      lobbyCode: null,
    });
  });
});
