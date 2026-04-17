import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isReplayWindowLibraryEnabled: vi.fn(),
  getOrCreateReplayWindowForSelection: vi.fn(),
  getReplayWindowById: vi.fn(),
  sliceReplayWindowCandles: vi.fn(),
  fetchTwelveDataCandles: vi.fn(),
  fetchTwelveDataCandlesForWindow: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env", () => ({
  isReplayWindowLibraryEnabled: mocks.isReplayWindowLibraryEnabled,
}));

vi.mock("@/server/replay-windows", () => ({
  getOrCreateReplayWindowForSelection: mocks.getOrCreateReplayWindowForSelection,
  getReplayWindowById: mocks.getReplayWindowById,
  sliceReplayWindowCandles: mocks.sliceReplayWindowCandles,
}));

vi.mock("@/server/backtesting/providers/twelve-data", () => ({
  fetchTwelveDataCandles: mocks.fetchTwelveDataCandles,
  fetchTwelveDataCandlesForWindow: mocks.fetchTwelveDataCandlesForWindow,
}));

import { getHistoricalBacktestCandles } from "@/server/backtesting/provider-candles";

describe("getHistoricalBacktestCandles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isReplayWindowLibraryEnabled.mockReturnValue(true);
  });

  it("serves the initial backtest load from a stored replay window", async () => {
    mocks.getOrCreateReplayWindowForSelection.mockResolvedValue({
      source: "db",
      window: {
        id: "11111111-1111-4111-8111-111111111111",
        symbol: "XAUUSD",
        timeframe: "15min",
        windowStartAt: "2025-01-01T00:00:00.000Z",
        initialRevealCount: 250,
      },
    });
    mocks.sliceReplayWindowCandles.mockReturnValue([
      { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
      { time: 2, open: 11, high: 13, low: 10, close: 12, volume: 120 },
    ]);

    const payload = await getHistoricalBacktestCandles({
      symbol: "XAUUSD",
      timeframe: "15min",
    });

    expect(mocks.getOrCreateReplayWindowForSelection).toHaveBeenCalledWith({
      symbol: "XAUUSD",
      timeframe: "15min",
    });
    expect(payload.selection.historicalWindowId).toBe("11111111-1111-4111-8111-111111111111");
    expect(payload.selection.windowStartAt).toBe("2025-01-01T00:00:00.000Z");
    expect(payload.candles).toHaveLength(2);
    expect(mocks.fetchTwelveDataCandles).not.toHaveBeenCalled();
  });

  it("falls back to the Twelve Data provider when no replay window is available", async () => {
    mocks.getOrCreateReplayWindowForSelection.mockResolvedValue(null);
    mocks.fetchTwelveDataCandles.mockResolvedValue({
      windowStartAt: "2025-02-01T00:00:00.000Z",
      candles: [{ time: 1, open: 10, high: 11, low: 9, close: 10.5, volume: 10 }],
    });

    const payload = await getHistoricalBacktestCandles({
      symbol: "EURUSD",
      timeframe: "5min",
    });

    expect(payload.selection.historicalWindowId).toBeNull();
    expect(payload.selection.windowStartAt).toBe("2025-02-01T00:00:00.000Z");
    expect(mocks.fetchTwelveDataCandles).toHaveBeenCalledWith(
      { symbol: "EURUSD", timeframe: "5min" },
      800,
    );
  });
});
