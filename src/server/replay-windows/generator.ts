import "server-only";

import {
  BACKTEST_INSTRUMENTS,
  BACKTEST_INITIAL_REVEAL_COUNT,
  getBacktestInstrument,
  getRandomLookbackRange,
  getTimeframeMs,
} from "@/features/backtesting/constants";
import type { BacktestCandle, BacktestSelection } from "@/features/backtesting/types";
import { env, hasTwelveDataEnv } from "@/lib/env";

import {
  getReadyReplayWindowCount,
  pickReadyReplayWindow,
  recordReplayWindowUsage,
  type ReplayWindowRecord,
  REPLAY_WINDOW_PROVIDER,
  upsertReplayWindow,
} from "./store";

const TWELVE_DATA_API_BASE_URL = "https://api.twelvedata.com";

export const REPLAY_WINDOW_TARGET_BARS = 2_000;
export const REPLAY_WINDOW_MIN_BARS = 1_200;
export const REPLAY_WINDOW_MIN_END_DAYS_AGO = 14;
export const REPLAY_WINDOW_READY_STOCK_TARGET = 6;
export const REPLAY_WINDOW_READY_STOCK_REPLENISH_THRESHOLD = 3;
export const REPLAY_WINDOW_READY_STOCK_CAP = 10;

type ReplayWindowLoadSource = "db" | "generated" | "provider_fallback";

type TwelveDataValue = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

type TwelveDataResponse = {
  status?: string;
  code?: number;
  message?: string;
  values?: TwelveDataValue[];
};

export class ReplayWindowGenerationError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ReplayWindowGenerationError";
    this.status = status;
  }
}

function logReplayWindowLoad(input: {
  source: ReplayWindowLoadSource;
  selection: BacktestSelection;
  historicalWindowId?: string | null;
}) {
  console.info(
    "[replay-window]",
    JSON.stringify({
      source: input.source,
      symbol: input.selection.symbol,
      timeframe: input.selection.timeframe,
      historicalWindowId: input.historicalWindowId ?? null,
    }),
  );
}

function formatTwelveDataDate(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function parseTwelveDataDate(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return Date.parse(`${normalized}Z`);
}

function getBufferMultiplier(symbol: string) {
  if (symbol === "BTCUSD" || symbol === "ETHUSD" || symbol === "SOLUSD") {
    return 1.35;
  }

  if (symbol === "XAUUSD" || symbol === "XAGUSD") {
    return 1.8;
  }

  return 2.7;
}

function normalizeCandle(value: TwelveDataValue, pricePrecision: number): BacktestCandle | null {
  if (!value.datetime) {
    return null;
  }

  const time = parseTwelveDataDate(value.datetime);
  const open = Number(value.open);
  const high = Number(value.high);
  const low = Number(value.low);
  const close = Number(value.close);
  const volume = Number(value.volume ?? 0);

  if ([time, open, high, low, close].some(Number.isNaN)) {
    return null;
  }

  const factor = 10 ** pricePrecision;
  const roundPrice = (price: number) => Math.round(price * factor) / factor;

  return {
    time: Math.floor(time / 1000),
    open: roundPrice(open),
    high: roundPrice(high),
    low: roundPrice(low),
    close: roundPrice(close),
    volume: Number.isFinite(volume) ? volume : 0,
  };
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickHistoricalStart(selection: BacktestSelection, barsRequested: number) {
  const timeframeMs = getTimeframeMs(selection.timeframe);
  const { minDaysAgo, maxDaysAgo } = getRandomLookbackRange(selection.timeframe);
  const now = Date.now();
  const requestWindowMs =
    timeframeMs * Math.ceil(barsRequested * getBufferMultiplier(selection.symbol));
  const earliestStart = now - maxDaysAgo * 24 * 60 * 60 * 1000;
  const latestHistoricalEnd = now - REPLAY_WINDOW_MIN_END_DAYS_AGO * 24 * 60 * 60 * 1000;
  const latestStart = Math.min(
    now - minDaysAgo * 24 * 60 * 60 * 1000,
    latestHistoricalEnd - requestWindowMs,
  );

  const startTimestamp =
    latestStart > earliestStart
      ? randomInt(earliestStart, latestStart)
      : earliestStart;

  return new Date(Math.floor(startTimestamp / timeframeMs) * timeframeMs);
}

async function fetchHistoricalReplayWindow(
  selection: BacktestSelection,
  barsRequested = REPLAY_WINDOW_TARGET_BARS,
) {
  if (!hasTwelveDataEnv()) {
    throw new ReplayWindowGenerationError(
      "Replay window generation requires TWELVE_DATA_API_KEY in your environment.",
      503,
    );
  }

  const instrument = getBacktestInstrument(selection.symbol);
  const startAt = pickHistoricalStart(selection, barsRequested);
  const endAt = new Date(
    startAt.getTime() +
      getTimeframeMs(selection.timeframe) *
        Math.ceil(barsRequested * getBufferMultiplier(selection.symbol)),
  );

  const params = new URLSearchParams({
    apikey: env.twelveDataApiKey,
    symbol: instrument.providerSymbol,
    interval: selection.timeframe,
    start_date: formatTwelveDataDate(startAt),
    end_date: formatTwelveDataDate(endAt),
    order: "ASC",
    timezone: "UTC",
  });

  const response = await fetch(`${TWELVE_DATA_API_BASE_URL}/time_series?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as TwelveDataResponse | null;

  if (!response.ok || !payload || payload.status === "error") {
    throw new ReplayWindowGenerationError(
      payload?.message ?? "Twelve Data request failed while generating replay windows.",
      response.status || 502,
    );
  }

  const candles = (payload.values ?? [])
    .map((value) => normalizeCandle(value, instrument.pricePrecision))
    .filter((value): value is BacktestCandle => Boolean(value))
    .sort((left, right) => left.time - right.time)
    .filter((value, index, array) => index === 0 || array[index - 1]?.time !== value.time)
    .filter((value) => value.time >= Math.floor(startAt.getTime() / 1000))
    .slice(0, barsRequested);

  if (candles.length < REPLAY_WINDOW_MIN_BARS) {
    throw new ReplayWindowGenerationError(
      `Twelve Data returned only ${candles.length} candles for ${selection.symbol} ${selection.timeframe}.`,
      409,
    );
  }

  return {
    selection,
    windowStartAt: new Date(candles[0]!.time * 1000).toISOString(),
    windowEndAt: new Date(candles[candles.length - 1]!.time * 1000).toISOString(),
    candles,
  };
}

export async function generateReplayWindowForSelection(selection: BacktestSelection) {
  const generated = await fetchHistoricalReplayWindow(selection, REPLAY_WINDOW_TARGET_BARS);
  const stored = await upsertReplayWindow({
    provider: REPLAY_WINDOW_PROVIDER,
    source: "generated",
    symbol: selection.symbol,
    timeframe: selection.timeframe,
    windowStartAt: generated.windowStartAt,
    windowEndAt: generated.windowEndAt,
    barsCount: generated.candles.length,
    initialRevealCount: Math.min(BACKTEST_INITIAL_REVEAL_COUNT, generated.candles.length),
    candles: generated.candles,
    qualityStatus: "ready",
    generatedAt: new Date().toISOString(),
  });

  return stored;
}

export async function getOrCreateReplayWindowForSelection(selection: BacktestSelection): Promise<{
  source: Exclude<ReplayWindowLoadSource, "provider_fallback">;
  window: ReplayWindowRecord;
} | null> {
  const readyCount = await getReadyReplayWindowCount(selection);
  const existingWindow = await pickReadyReplayWindow(selection);

  if (existingWindow && readyCount >= REPLAY_WINDOW_READY_STOCK_REPLENISH_THRESHOLD) {
    logReplayWindowLoad({
      source: "db",
      selection,
      historicalWindowId: existingWindow.id,
    });
    return {
      source: "db",
      window: existingWindow,
    };
  }

  try {
    const generatedWindow = await generateReplayWindowForSelection(selection);
    if (generatedWindow) {
      await recordReplayWindowUsage(generatedWindow.id);
      logReplayWindowLoad({
        source: "generated",
        selection,
        historicalWindowId: generatedWindow.id,
      });
      return {
        source: "generated",
        window: generatedWindow,
      };
    }
  } catch (error) {
    console.warn(
      "[replay-window]",
      JSON.stringify({
        source: "generation_failed",
        symbol: selection.symbol,
        timeframe: selection.timeframe,
        message: error instanceof Error ? error.message : "Replay window generation failed.",
      }),
    );
  }

  if (!existingWindow) {
    return null;
  }

  logReplayWindowLoad({
    source: "db",
    selection,
    historicalWindowId: existingWindow.id,
  });
  return {
    source: "db",
    window: existingWindow,
  };
}

export function getReplayWindowSelections() {
  return BACKTEST_INSTRUMENTS.flatMap((instrument) =>
    ["1min", "5min", "15min", "30min", "1h", "4h", "1day"].map((timeframe) => ({
      symbol: instrument.symbol,
      timeframe: timeframe as BacktestSelection["timeframe"],
    })),
  );
}
