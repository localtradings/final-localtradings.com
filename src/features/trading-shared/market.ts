import type {
  BacktestAccountState,
  BacktestInstrument,
  BacktestSelection,
  BacktestTimeframe,
  ReplaySpeed,
} from "@/features/backtesting/types";

export const TRADING_INSTRUMENTS: BacktestInstrument[] = [
  {
    symbol: "EURUSD",
    label: "EUR/USD",
    market: "Forex",
    providerSymbol: "EUR/USD",
    pricePrecision: 4,
    tickSize: 0.0001,
    basePrice: 1.085,
  },
  {
    symbol: "GBPUSD",
    label: "GBP/USD",
    market: "Forex",
    providerSymbol: "GBP/USD",
    pricePrecision: 4,
    tickSize: 0.0001,
    basePrice: 1.268,
  },
  {
    symbol: "USDJPY",
    label: "USD/JPY",
    market: "Forex",
    providerSymbol: "USD/JPY",
    pricePrecision: 2,
    tickSize: 0.01,
    basePrice: 149.4,
  },
  {
    symbol: "AUDUSD",
    label: "AUD/USD",
    market: "Forex",
    providerSymbol: "AUD/USD",
    pricePrecision: 4,
    tickSize: 0.0001,
    basePrice: 0.658,
  },
  {
    symbol: "USDCHF",
    label: "USD/CHF",
    market: "Forex",
    providerSymbol: "USD/CHF",
    pricePrecision: 4,
    tickSize: 0.0001,
    basePrice: 0.892,
  },
  {
    symbol: "XAUUSD",
    label: "Gold / USD",
    market: "Metal",
    providerSymbol: "XAU/USD",
    pricePrecision: 1,
    tickSize: 0.1,
    basePrice: 2358,
  },
  {
    symbol: "XAGUSD",
    label: "Silver / USD",
    market: "Metal",
    providerSymbol: "XAG/USD",
    pricePrecision: 3,
    tickSize: 0.001,
    basePrice: 24.65,
  },
  {
    symbol: "BTCUSD",
    label: "Bitcoin / USD",
    market: "Crypto",
    providerSymbol: "BTC/USD",
    pricePrecision: 0,
    tickSize: 1,
    basePrice: 64200,
  },
  {
    symbol: "ETHUSD",
    label: "Ethereum / USD",
    market: "Crypto",
    providerSymbol: "ETH/USD",
    pricePrecision: 0,
    tickSize: 1,
    basePrice: 3120,
  },
  {
    symbol: "SOLUSD",
    label: "Solana / USD",
    market: "Crypto",
    providerSymbol: "SOL/USD",
    pricePrecision: 2,
    tickSize: 0.01,
    basePrice: 152,
  },
];

export const TRADING_TIMEFRAMES: BacktestTimeframe[] = [
  "1min",
  "5min",
  "15min",
  "30min",
  "1h",
  "4h",
  "1day",
];

export const TRADING_INITIAL_REVEAL_COUNT = 250;
export const TRADING_BARS_REQUESTED = 1000;

export const TRADING_REPLAY_SPEEDS: ReplaySpeed[] = [
  { id: "1x", label: "1x", intervalMs: 1200 },
  { id: "2x", label: "2x", intervalMs: 800 },
  { id: "4x", label: "4x", intervalMs: 450 },
  { id: "8x", label: "8x", intervalMs: 240 },
];

export const DEFAULT_TRADING_SELECTION: BacktestSelection = {
  symbol: "XAUUSD",
  timeframe: "15min",
};

export const DEFAULT_TRADING_ACCOUNT: BacktestAccountState = {
  startingBalance: 100000,
  currentBalance: 100000,
  defaultRiskPercent: 1,
};

export function getTradingInstrument(symbol: string) {
  return TRADING_INSTRUMENTS.find((item) => item.symbol === symbol) ?? TRADING_INSTRUMENTS[0];
}

export function getTradingReplaySpeed(speedId: string) {
  return TRADING_REPLAY_SPEEDS.find((item) => item.id === speedId) ?? TRADING_REPLAY_SPEEDS[1];
}

export function getTimeframeMinutes(timeframe: BacktestTimeframe) {
  if (timeframe === "1min") return 1;
  if (timeframe === "5min") return 5;
  if (timeframe === "15min") return 15;
  if (timeframe === "30min") return 30;
  if (timeframe === "1h") return 60;
  if (timeframe === "4h") return 240;
  return 1440;
}

export function getTimeframeMs(timeframe: BacktestTimeframe) {
  return getTimeframeMinutes(timeframe) * 60 * 1000;
}

export function getRandomLookbackRange(timeframe: BacktestTimeframe) {
  if (timeframe === "1min") return { minDaysAgo: 14, maxDaysAgo: 120 };
  if (timeframe === "5min") return { minDaysAgo: 30, maxDaysAgo: 180 };
  if (timeframe === "15min") return { minDaysAgo: 60, maxDaysAgo: 365 };
  if (timeframe === "30min") return { minDaysAgo: 90, maxDaysAgo: 730 };
  if (timeframe === "1h") return { minDaysAgo: 120, maxDaysAgo: 1095 };
  if (timeframe === "4h") return { minDaysAgo: 180, maxDaysAgo: 1825 };

  return { minDaysAgo: 365, maxDaysAgo: 3650 };
}
