import "server-only";

import {
  getBacktestInstrument,
  getRandomLookbackRange,
  getTimeframeMs,
} from "@/features/backtesting/constants";
import type {
  BacktestCandle,
  BacktestSelection,
} from "@/features/backtesting/types";
import { env, hasTwelveDataEnv } from "@/lib/env";

const TWELVE_DATA_API_BASE_URL = "https://api.twelvedata.com";
const MAX_RANDOM_WINDOW_ATTEMPTS = 5;

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

export class TwelveDataError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "TwelveDataError";
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

function getBufferMultiplier(symbol: string) {
  if (symbol === "BTCUSD" || symbol === "ETHUSD" || symbol === "SOLUSD") {
    return 1.35;
  }

  if (symbol === "XAUUSD" || symbol === "XAGUSD") {
    return 1.8;
  }

  return 2.7;
}

function normalizeCandle(
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

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomWindowStart(selection: BacktestSelection) {
  const timeframeMs = getTimeframeMs(selection.timeframe);
  const { minDaysAgo, maxDaysAgo } = getRandomLookbackRange(selection.timeframe);
  const now = Date.now();
  const minStart = now - maxDaysAgo * 24 * 60 * 60 * 1000;
  const maxStart = now - minDaysAgo * 24 * 60 * 60 * 1000;
  const randomTimestamp = randomInt(minStart, maxStart);

  return new Date(Math.floor(randomTimestamp / timeframeMs) * timeframeMs);
}

async function fetchWindow(
  selection: BacktestSelection,
  startAt: Date,
  barsRequested: number,
) {
  const instrument = getBacktestInstrument(selection.symbol);
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
  const payload = (await response.json()) as TwelveDataResponse;

  if (!response.ok || payload.status === "error") {
    throw new TwelveDataError(
      payload.message ?? "Twelve Data request failed while loading historical candles.",
      response.status || 502,
    );
  }

  const normalized = (payload.values ?? [])
    .map((value) => normalizeCandle(value, instrument.pricePrecision))
    .filter((value): value is BacktestCandle => Boolean(value))
    .sort((left, right) => left.time - right.time)
    .filter((value) => value.time >= Math.floor(startAt.getTime() / 1000))
    .slice(0, barsRequested);

  return normalized;
}

export async function fetchTwelveDataCandles(
  selection: BacktestSelection,
  barsRequested: number,
) {
  if (!hasTwelveDataEnv()) {
    throw new TwelveDataError(
      "Historical data requires TWELVE_DATA_API_KEY in your environment.",
      503,
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RANDOM_WINDOW_ATTEMPTS; attempt += 1) {
    const startAt = pickRandomWindowStart(selection);

    try {
      const candles = await fetchWindow(selection, startAt, barsRequested);
      if (candles.length >= barsRequested) {
        return {
          candles,
          windowStartAt: startAt.toISOString(),
        };
      }

      lastError = new TwelveDataError("Not enough candles were returned for this window.", 400);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown candle loading failure.");
    }
  }

  if (lastError instanceof TwelveDataError) {
    throw new TwelveDataError(
      "Unable to load a valid random replay window. Try another symbol or timeframe.",
      lastError.status,
    );
  }

  throw new TwelveDataError(
    "Unable to load a valid random replay window. Try another symbol or timeframe.",
    500,
  );
}
