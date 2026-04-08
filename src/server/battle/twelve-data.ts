import "server-only";

import {
  BACKTEST_INSTRUMENTS,
  BACKTEST_BARS_REQUESTED,
  BACKTEST_REFILL_BARS_REQUESTED,
  BACKTEST_REFILL_TRIGGER_COUNT,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import type { BacktestCandle, BacktestSelection } from "@/features/backtesting/types";
import { getTimeframeMs } from "@/features/trading-shared/market";
import { env, hasTwelveDataEnv } from "@/lib/env";

const TWELVE_DATA_API_BASE_URL = "https://api.twelvedata.com";

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

export class BattleSeedProviderError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BattleSeedProviderError";
    this.status = status;
  }
}

function formatTwelveDataDate(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

function parseTwelveDataDate(value: string) {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return Date.parse(`${normalized}Z`);
}

function getRecentFetchBufferMultiplier(symbol: string) {
  if (symbol === "BTCUSD" || symbol === "ETHUSD" || symbol === "SOLUSD") {
    return 1.35;
  }

  if (symbol === "XAUUSD" || symbol === "XAGUSD") {
    return 1.8;
  }

  return 2.7;
}

function normalizeBattleCandle(
  value: TwelveDataValue,
  pricePrecision: number,
): BacktestCandle | null {
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

function dedupeCandles(candles: BacktestCandle[]) {
  const deduped: BacktestCandle[] = [];

  for (const candle of candles) {
    if (deduped.at(-1)?.time === candle.time) {
      deduped[deduped.length - 1] = candle;
      continue;
    }

    deduped.push(candle);
  }

  return deduped;
}

function isSupportedBattleSymbol(symbol: string) {
  return BACKTEST_INSTRUMENTS.some((instrument) => instrument.symbol === symbol);
}

export function getBattleTwelveDataSelections() {
  return BACKTEST_INSTRUMENTS.map((instrument) => instrument.symbol);
}

export function getBattleInitialCandleBatchSize() {
  return BACKTEST_BARS_REQUESTED;
}

export function getBattleRefillTriggerCount() {
  return BACKTEST_REFILL_TRIGGER_COUNT;
}

export function getBattleRefillBatchSize() {
  return BACKTEST_REFILL_BARS_REQUESTED;
}

async function fetchBattleCandlesInRange(input: {
  selection: BacktestSelection;
  startAt: Date;
  endAt: Date;
}) {
  if (!hasTwelveDataEnv()) {
    throw new BattleSeedProviderError(
      "Battle candles require TWELVE_DATA_API_KEY in your environment.",
      503,
    );
  }

  if (!isSupportedBattleSymbol(input.selection.symbol)) {
    throw new BattleSeedProviderError(
      `Battle symbol ${input.selection.symbol} is not mapped for Twelve Data.`,
      400,
    );
  }

  const instrument = getBacktestInstrument(input.selection.symbol);

  const params = new URLSearchParams({
    apikey: env.twelveDataApiKey,
    symbol: instrument.providerSymbol,
    interval: input.selection.timeframe,
    start_date: formatTwelveDataDate(input.startAt),
    end_date: formatTwelveDataDate(input.endAt),
    order: "ASC",
    timezone: "UTC",
  });

  const response = await fetch(`${TWELVE_DATA_API_BASE_URL}/time_series?${params.toString()}`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as TwelveDataResponse | null;

  if (!response.ok || !payload || payload.status === "error") {
    throw new BattleSeedProviderError(
      payload?.message ?? "Twelve Data failed to load battle candles.",
      response.status || 502,
    );
  }

  return dedupeCandles(
    (payload.values ?? [])
      .map((value) => normalizeBattleCandle(value, instrument.pricePrecision))
      .filter((value): value is BacktestCandle => Boolean(value))
      .sort((left, right) => left.time - right.time),
  );
}

export async function fetchTwelveDataBattleCandles(
  selection: BacktestSelection,
  barsRequested = getBattleInitialCandleBatchSize(),
) {
  const now = new Date();
  const bufferMultiplier = getRecentFetchBufferMultiplier(selection.symbol);
  const startAt = new Date(
    now.getTime() -
      getTimeframeMs(selection.timeframe) * Math.ceil(barsRequested * bufferMultiplier),
  );
  const candles = (await fetchBattleCandlesInRange({
    selection,
    startAt,
    endAt: now,
  })).slice(-barsRequested);

  if (candles.length < barsRequested) {
    throw new BattleSeedProviderError(
      `Twelve Data returned only ${candles.length} battle candles for ${selection.symbol} ${selection.timeframe}.`,
      409,
    );
  }

  return candles;
}

export async function fetchTwelveDataBattleCandlesAfter(input: {
  selection: BacktestSelection;
  afterTime: number;
  barsRequested?: number;
}) {
  const barsRequested = input.barsRequested ?? getBattleRefillBatchSize();
  const timeframeMs = getTimeframeMs(input.selection.timeframe);
  const startAt = new Date((input.afterTime + timeframeMs / 1000) * 1000);
  const endAt = new Date();

  if (endAt.getTime() <= startAt.getTime()) {
    return [] as BacktestCandle[];
  }

  const candles = await fetchBattleCandlesInRange({
    selection: input.selection,
    startAt,
    endAt,
  });

  return candles
    .filter((candle) => candle.time > input.afterTime)
    .slice(0, barsRequested);
}
