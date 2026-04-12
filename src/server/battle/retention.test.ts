import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSupabaseServiceRoleClient: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

import {
  BATTLE_CANCELLED_ROOM_RETENTION_DAYS,
  BATTLE_PENALTY_RETENTION_DAYS,
  BATTLE_STALE_LOBBY_RETENTION_HOURS,
  runBattleRetentionCleanup,
} from "@/server/battle/retention";

function createDeleteBuilder(count: number) {
  const builder = {
    lte: vi.fn().mockResolvedValue({ count, error: null }),
    eq: vi.fn(),
    lt: vi.fn(),
    is: vi.fn(),
  };

  builder.eq.mockImplementation(() => builder);
  builder.is.mockImplementation(() => builder);
  builder.lt.mockResolvedValue({ count, error: null });

  return builder;
}

describe("runBattleRetentionCleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes expired cache, stale lobbies, cancelled rooms, and old penalties using the expected cutoffs", async () => {
    const cacheBuilder = createDeleteBuilder(3);
    const staleLobbyBuilder = createDeleteBuilder(2);
    const endedCancelledBuilder = createDeleteBuilder(4);
    const updatedCancelledBuilder = createDeleteBuilder(1);
    const penaltiesBuilder = createDeleteBuilder(5);

    let battleRoomsCallCount = 0;

    const from = vi.fn((table: string) => {
      if (table === "battle_candle_cache") {
        return { delete: vi.fn().mockReturnValue(cacheBuilder) };
      }

      if (table === "battle_penalties") {
        return { delete: vi.fn().mockReturnValue(penaltiesBuilder) };
      }

      if (table === "battle_rooms") {
        battleRoomsCallCount += 1;
        const builder =
          battleRoomsCallCount === 1
            ? staleLobbyBuilder
            : battleRoomsCallCount === 2
              ? endedCancelledBuilder
              : updatedCancelledBuilder;
        return { delete: vi.fn().mockReturnValue(builder) };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    mocks.createSupabaseServiceRoleClient.mockReturnValue({ from });

    const now = new Date("2026-04-11T10:00:00.000Z");
    const summary = await runBattleRetentionCleanup(now);

    expect(summary).toEqual({
      cacheRowsDeleted: 3,
      staleLobbyRoomsDeleted: 2,
      cancelledRoomsDeleted: 5,
      penaltiesDeleted: 5,
      executedAt: now.toISOString(),
    });

    expect(cacheBuilder.lte).toHaveBeenCalledWith("expires_at", now.toISOString());
    expect(staleLobbyBuilder.eq).toHaveBeenCalledWith("status", "lobby");
    expect(staleLobbyBuilder.lt).toHaveBeenCalledWith(
      "updated_at",
      new Date(now.getTime() - BATTLE_STALE_LOBBY_RETENTION_HOURS * 60 * 60 * 1000).toISOString(),
    );
    expect(endedCancelledBuilder.eq).toHaveBeenCalledWith("status", "cancelled");
    expect(endedCancelledBuilder.lt).toHaveBeenCalledWith(
      "ended_at",
      new Date(now.getTime() - BATTLE_CANCELLED_ROOM_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    );
    expect(updatedCancelledBuilder.is).toHaveBeenCalledWith("ended_at", null);
    expect(updatedCancelledBuilder.lt).toHaveBeenCalledWith(
      "updated_at",
      new Date(now.getTime() - BATTLE_CANCELLED_ROOM_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    );
    expect(penaltiesBuilder.lt).toHaveBeenCalledWith(
      "ends_at",
      new Date(now.getTime() - BATTLE_PENALTY_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    );
  });
});
