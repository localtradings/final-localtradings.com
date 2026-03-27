import "server-only";

import {
  BACKTEST_BARS_REQUESTED,
  BACKTEST_INITIAL_REVEAL_COUNT,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import type {
  BacktestCandlesResponse,
  BacktestSelection,
} from "@/features/backtesting/types";

import { fetchTwelveDataCandles } from "@/server/backtesting/providers/twelve-data";

export async function getHistoricalBacktestCandles(
  selection: BacktestSelection,
): Promise<BacktestCandlesResponse> {
  const instrument = getBacktestInstrument(selection.symbol);
  const payload = await fetchTwelveDataCandles(selection, BACKTEST_BARS_REQUESTED);

  return {
    instrument,
    selection: {
      ...selection,
      windowStartAt: payload.windowStartAt,
      barsRequested: BACKTEST_BARS_REQUESTED,
      initialRevealCount: BACKTEST_INITIAL_REVEAL_COUNT,
    },
    candles: payload.candles,
  };
}
