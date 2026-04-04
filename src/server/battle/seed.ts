import "server-only";

import {
  BACKTEST_INITIAL_REVEAL_COUNT,
  BACKTEST_TIMEFRAMES,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import type {
  BacktestCandle,
  BacktestCandlesResponse,
  BacktestSelection,
} from "@/features/backtesting/types";
import { getTimeframeMs } from "@/features/trading-shared/market";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import {
  BattleSeedProviderError,
  getBattleCandleBatchSize,
  getBattleTwelveDataSelections,
  fetchTwelveDataBattleCandles,
} from "./twelve-data";

type BattleCandleCacheRow = {
  symbol: string;
  timeframe: BacktestSelection["timeframe"];
  provider: string;
  bars_count: number;
  candles_json: BacktestCandle[];
  last_candle_time: number;
  fetched_at: string;
  expires_at: string;
};

const BATTLE_CANDLE_PROVIDER = "twelve_data";

function shuffleSelections(selections: BacktestSelection[]) {
  const copy = [...selections];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function buildSelectionPool() {
  const supportedSymbols = new Set(getBattleTwelveDataSelections());
  return shuffleSelections(
    Array.from(supportedSymbols).flatMap((symbol) =>
      BACKTEST_TIMEFRAMES.map((timeframe) => ({ symbol, timeframe })),
    ),
  );
}

function isSupportedSelection(selection: BacktestSelection) {
  return getBattleTwelveDataSelections().includes(selection.symbol);
}

function normalizeCachedCandles(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const candles: BacktestCandle[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const entry = item as Record<string, unknown>;
    if (
      typeof entry.time !== "number" ||
      typeof entry.open !== "number" ||
      typeof entry.high !== "number" ||
      typeof entry.low !== "number" ||
      typeof entry.close !== "number" ||
      typeof entry.volume !== "number"
    ) {
      return null;
    }

    candles.push({
      time: entry.time,
      open: entry.open,
      high: entry.high,
      low: entry.low,
      close: entry.close,
      volume: entry.volume,
    });
  }

  return candles.length > 0 ? candles : null;
}

async function readBattleCandleCache(selection: BacktestSelection) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("battle_candle_cache")
    .select(
      "symbol, timeframe, provider, bars_count, candles_json, last_candle_time, fetched_at, expires_at",
    )
    .eq("symbol", selection.symbol)
    .eq("timeframe", selection.timeframe)
    .eq("provider", BATTLE_CANDLE_PROVIDER)
    .eq("bars_count", getBattleCandleBatchSize())
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const candles = normalizeCachedCandles(data.candles_json);
  if (!candles || candles.length < getBattleCandleBatchSize()) {
    return null;
  }

  return {
    ...data,
    candles_json: candles,
  } satisfies BattleCandleCacheRow;
}

async function writeBattleCandleCache(selection: BacktestSelection, candles: BacktestCandle[]) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase || candles.length === 0) {
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + getTimeframeMs(selection.timeframe));
  const lastCandleTime = candles[candles.length - 1]?.time ?? Math.floor(now.getTime() / 1000);

  await supabase.from("battle_candle_cache").upsert(
    {
      symbol: selection.symbol,
      timeframe: selection.timeframe,
      provider: BATTLE_CANDLE_PROVIDER,
      bars_count: getBattleCandleBatchSize(),
      candles_json: candles,
      last_candle_time: lastCandleTime,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "symbol,timeframe,provider,bars_count" },
  );
}

async function getCanonicalBattleCandles(selection: BacktestSelection) {
  const cached = await readBattleCandleCache(selection);
  if (cached) {
    return cached.candles_json;
  }

  const candles = await fetchTwelveDataBattleCandles(selection);
  await writeBattleCandleCache(selection, candles);
  return candles;
}

function toBattleResponse(selection: BacktestSelection, candles: BacktestCandle[]): BacktestCandlesResponse {
  return {
    instrument: getBacktestInstrument(selection.symbol),
    selection: {
      ...selection,
      windowStartAt: new Date((candles[0]?.time ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
      barsRequested: getBattleCandleBatchSize(),
      initialRevealCount: Math.min(BACKTEST_INITIAL_REVEAL_COUNT, candles.length),
    },
    candles,
  };
}

export async function createBattleRoomSeed(selection?: BacktestSelection) {
  const selectionPool = selection ? [selection] : buildSelectionPool();

  if (selection && !isSupportedSelection(selection)) {
    throw new BattleSeedProviderError(
      `Battle selection ${selection.symbol} ${selection.timeframe} is not supported.`,
      400,
    );
  }

  let lastError: Error | null = null;

  for (const candidate of selectionPool) {
    try {
      const candles = await getCanonicalBattleCandles(candidate);
      return toBattleResponse(candidate, candles);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Battle seed loading failed.");
    }
  }

  throw lastError ?? new Error("Battle seed loading failed.");
}
