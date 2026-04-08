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

import {
  fetchTwelveDataCandles,
  fetchTwelveDataCandlesForWindow,
} from "@/server/backtesting/providers/twelve-data";

export async function getHistoricalBacktestCandles(
  selection: BacktestSelection,
  options?: {
    windowStartAt?: string;
    barsRequested?: number;
  },
): Promise<BacktestCandlesResponse> {
  const instrument = getBacktestInstrument(selection.symbol);
  const barsRequested = Math.max(
    1,
    Math.min(options?.barsRequested ?? BACKTEST_BARS_REQUESTED, BACKTEST_MAX_BARS_REQUESTED),
  );
  const payload = options?.windowStartAt
    ? await fetchTwelveDataCandlesForWindow(selection, options.windowStartAt, barsRequested)
    : await fetchTwelveDataCandles(selection, barsRequested);

  return {
    instrument,
    selection: {
      ...selection,
      windowStartAt: payload.windowStartAt,
      barsRequested,
      initialRevealCount: BACKTEST_INITIAL_REVEAL_COUNT,
    },
    candles: payload.candles,
  };
}
