import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isReplayWindowLibraryEnabled: vi.fn(),
  createSupabaseServiceRoleClient: vi.fn(),
  getOrCreateReplayWindowForSelection: vi.fn(),
  getReplayWindowById: vi.fn(),
  fetchTwelveDataBattleCandles: vi.fn(),
  fetchTwelveDataBattleCandlesAfter: vi.fn(),
  getBattleInitialCandleBatchSize: vi.fn(),
  getBattleRefillBatchSize: vi.fn(),
  getBattleTwelveDataSelections: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  isReplayWindowLibraryEnabled: mocks.isReplayWindowLibraryEnabled,
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: mocks.createSupabaseServiceRoleClient,
}));

vi.mock("@/server/replay-windows", () => ({
  getOrCreateReplayWindowForSelection: mocks.getOrCreateReplayWindowForSelection,
  getReplayWindowById: mocks.getReplayWindowById,
}));

vi.mock("@/server/battle/twelve-data", async () => {
  const actual = await vi.importActual<typeof import("@/server/battle/twelve-data")>(
    "@/server/battle/twelve-data",
  );

  return {
    ...actual,
    fetchTwelveDataBattleCandles: mocks.fetchTwelveDataBattleCandles,
    fetchTwelveDataBattleCandlesAfter: mocks.fetchTwelveDataBattleCandlesAfter,
    getBattleInitialCandleBatchSize: mocks.getBattleInitialCandleBatchSize,
    getBattleRefillBatchSize: mocks.getBattleRefillBatchSize,
    getBattleTwelveDataSelections: mocks.getBattleTwelveDataSelections,
  };
});

import { createBattleRoomSeed, extendBattleRoomCandles } from "@/server/battle/seed";

describe("battle replay windows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isReplayWindowLibraryEnabled.mockReturnValue(true);
    mocks.createSupabaseServiceRoleClient.mockReturnValue(null);
    mocks.getBattleInitialCandleBatchSize.mockReturnValue(800);
    mocks.getBattleRefillBatchSize.mockReturnValue(400);
    mocks.getBattleTwelveDataSelections.mockReturnValue(["XAUUSD"]);
  });

  it("creates battle seeds from a stored replay window when available", async () => {
    const candles = Array.from({ length: 800 }, (_, index) => ({
      time: index + 1,
      open: 10 + index,
      high: 11 + index,
      low: 9 + index,
      close: 10.5 + index,
      volume: 100,
    }));

    mocks.getOrCreateReplayWindowForSelection.mockResolvedValue({
      source: "db",
      window: {
        id: "11111111-1111-4111-8111-111111111111",
        symbol: "XAUUSD",
        timeframe: "15min",
        windowStartAt: "2025-01-01T00:00:00.000Z",
        initialRevealCount: 250,
        candles,
      },
    });

    const payload = await createBattleRoomSeed({
      symbol: "XAUUSD",
      timeframe: "15min",
    });

    expect(payload.selection.historicalWindowId).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload.candles).toHaveLength(800);
    expect(mocks.fetchTwelveDataBattleCandles).not.toHaveBeenCalled();
  });

  it("refills from the same replay window before falling back to Twelve Data", async () => {
    mocks.getReplayWindowById.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      symbol: "XAUUSD",
      timeframe: "15min",
      candles: [
        { time: 1, open: 10, high: 11, low: 9, close: 10.5, volume: 100 },
        { time: 2, open: 11, high: 12, low: 10, close: 11.5, volume: 100 },
        { time: 3, open: 12, high: 13, low: 11, close: 12.5, volume: 100 },
      ],
    });

    const refill = await extendBattleRoomCandles({
      historicalWindowId: "11111111-1111-4111-8111-111111111111",
      selection: {
        symbol: "XAUUSD",
        timeframe: "15min",
      },
      afterTime: 1,
    });

    expect(refill).toEqual([
      { time: 2, open: 11, high: 12, low: 10, close: 11.5, volume: 100 },
      { time: 3, open: 12, high: 13, low: 11, close: 12.5, volume: 100 },
    ]);
    expect(mocks.fetchTwelveDataBattleCandlesAfter).not.toHaveBeenCalled();
  });
});
