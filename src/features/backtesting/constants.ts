import type { BacktestSessionStatus } from "./types";
import {
  DEFAULT_TRADING_ACCOUNT,
  DEFAULT_TRADING_SELECTION,
  TRADING_BARS_REQUESTED,
  TRADING_INITIAL_REVEAL_COUNT,
  TRADING_INSTRUMENTS,
  TRADING_REPLAY_SPEEDS,
  TRADING_TIMEFRAMES,
  getRandomLookbackRange as getSharedRandomLookbackRange,
  getTimeframeMinutes as getSharedTimeframeMinutes,
  getTimeframeMs as getSharedTimeframeMs,
  getTradingInstrument,
  getTradingReplaySpeed,
} from "@/features/trading-shared/market";

export const BACKTEST_INSTRUMENTS = TRADING_INSTRUMENTS;
export const BACKTEST_TIMEFRAMES = TRADING_TIMEFRAMES;
export const BACKTEST_INITIAL_REVEAL_COUNT = TRADING_INITIAL_REVEAL_COUNT;
export const BACKTEST_BARS_REQUESTED = TRADING_BARS_REQUESTED;
export const REPLAY_SPEEDS = TRADING_REPLAY_SPEEDS;

export const DEFAULT_REPLAY_SPEED_ID = REPLAY_SPEEDS[1].id;

export const DEFAULT_BACKTEST_SELECTION = DEFAULT_TRADING_SELECTION;
export const DEFAULT_BACKTEST_ACCOUNT = DEFAULT_TRADING_ACCOUNT;

export const BACKTEST_STATUS_LABELS: Record<BacktestSessionStatus, string> = {
  draft: "Setup Ready",
  armed: "Waiting for Entry",
  active: "Trade Open",
  target_hit: "Take Profit Hit",
  stop_hit: "Stopped Out",
  manual_close: "Closed Manually",
  unfinished: "Replay Ended",
  breakeven: "Closed at Breakeven",
};

export function getBacktestInstrument(symbol: string) {
  return getTradingInstrument(symbol);
}

export function getReplaySpeed(speedId: string) {
  return getTradingReplaySpeed(speedId);
}

export function getTimeframeMinutes(timeframe: Parameters<typeof getSharedTimeframeMinutes>[0]) {
  return getSharedTimeframeMinutes(timeframe);
}

export function getTimeframeMs(timeframe: Parameters<typeof getSharedTimeframeMs>[0]) {
  return getSharedTimeframeMs(timeframe);
}

export function getRandomLookbackRange(
  timeframe: Parameters<typeof getSharedRandomLookbackRange>[0],
) {
  return getSharedRandomLookbackRange(timeframe);
}
