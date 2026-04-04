import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getCurrentProfile: vi.fn(),
  getActiveBattlePenalty: vi.fn(),
  joinPublicBattleMatch: vi.fn(),
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
  createBattleRoom: vi.fn(),
  joinBattleRoom: vi.fn(),
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

import { joinRandomBattleMatchAction } from "@/server/battle/actions";

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
            durationMinutes: 10,
            symbol: null,
            timeframe: null,
            maxPlayers: 5,
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
});
