import "server-only";

import {
  BACKTEST_BARS_REQUESTED,
  BACKTEST_INITIAL_REVEAL_COUNT,
  BACKTEST_MAX_BARS_REQUESTED,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import type {
  BacktestCandlesResponse,
  BacktestSelection,
} from "@/features/backtesting/types";
import { isReplayWindowLibraryEnabled } from "@/lib/env";

import {
  fetchTwelveDataCandles,
  fetchTwelveDataCandlesForWindow,
} from "@/server/backtesting/providers/twelve-data";
import {
  getOrCreateReplayWindowForSelection,
  getReplayWindowById,
  sliceReplayWindowCandles,
} from "@/server/replay-windows";

function logReplaySource(source: "provider_fallback", selection: BacktestSelection) {
  console.info(
    "[replay-window]",
    JSON.stringify({
      source,
      symbol: selection.symbol,
      timeframe: selection.timeframe,
      historicalWindowId: null,
    }),
  );
}

export async function getHistoricalBacktestCandles(
  selection: BacktestSelection,
  options?: {
    historicalWindowId?: string;
    windowStartAt?: string;
    barsRequested?: number;
  },
): Promise<BacktestCandlesResponse> {
  const instrument = getBacktestInstrument(selection.symbol);
  const barsRequested = Math.max(
    1,
    Math.min(options?.barsRequested ?? BACKTEST_BARS_REQUESTED, BACKTEST_MAX_BARS_REQUESTED),
  );

  if (isReplayWindowLibraryEnabled()) {
    const historicalWindowId = options?.historicalWindowId?.trim();

    if (historicalWindowId) {
      const replayWindow = await getReplayWindowById(historicalWindowId);
      if (
        replayWindow &&
        replayWindow.symbol === selection.symbol &&
        replayWindow.timeframe === selection.timeframe
      ) {
        const candles = sliceReplayWindowCandles(replayWindow, barsRequested);

        return {
          instrument,
          selection: {
            ...selection,
            historicalWindowId: replayWindow.id,
            windowStartAt: replayWindow.windowStartAt,
            barsRequested: candles.length,
            initialRevealCount: Math.min(
              replayWindow.initialRevealCount,
              BACKTEST_INITIAL_REVEAL_COUNT,
              candles.length,
            ),
          },
          candles,
        };
      }
    } else {
      const assignedReplayWindow = await getOrCreateReplayWindowForSelection(selection);
      if (assignedReplayWindow) {
        const candles = sliceReplayWindowCandles(assignedReplayWindow.window, barsRequested);

        return {
          instrument,
          selection: {
            ...selection,
            historicalWindowId: assignedReplayWindow.window.id,
            windowStartAt: assignedReplayWindow.window.windowStartAt,
            barsRequested: candles.length,
            initialRevealCount: Math.min(
              assignedReplayWindow.window.initialRevealCount,
              BACKTEST_INITIAL_REVEAL_COUNT,
              candles.length,
            ),
          },
          candles,
        };
      }
    }
  }

  const payload = options?.windowStartAt
    ? await fetchTwelveDataCandlesForWindow(selection, options.windowStartAt, barsRequested)
    : await fetchTwelveDataCandles(selection, barsRequested);
  logReplaySource("provider_fallback", selection);

  return {
    instrument,
    selection: {
      ...selection,
      historicalWindowId: null,
      windowStartAt: payload.windowStartAt,
      barsRequested,
      initialRevealCount: BACKTEST_INITIAL_REVEAL_COUNT,
    },
    candles: payload.candles,
  };
}
