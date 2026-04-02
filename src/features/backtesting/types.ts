export type BacktestMarket = "Forex" | "Metal" | "Crypto";

export type BacktestTimeframe =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "1h"
  | "4h"
  | "1day";

export type BacktestDirection = "Long" | "Short";
export type BacktestOrderType = "market" | "limit" | "stop";

export type BacktestSessionStatus =
  | "draft"
  | "armed"
  | "active"
  | "target_hit"
  | "stop_hit"
  | "manual_close"
  | "unfinished"
  | "breakeven";

export type BacktestInstrument = {
  symbol: string;
  label: string;
  market: BacktestMarket;
  providerSymbol: string;
  pricePrecision: number;
  tickSize: number;
  basePrice: number;
};

export type ReplaySpeed = {
  id: string;
  label: string;
  intervalMs: number;
};

export type BacktestCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type BacktestSelection = {
  symbol: string;
  timeframe: BacktestTimeframe;
};

export type BacktestResolvedSelection = BacktestSelection & {
  windowStartAt: string;
  barsRequested: number;
  initialRevealCount: number;
};

export type BacktestLineField = "entry" | "stop" | "target";

export type BacktestDrawingTool =
  | "cursor"
  | "horizontalLine"
  | "trendLine"
  | "ray"
  | "extendedLine"
  | "rectangle"
  | "brush"
  | "circle"
  | "fibRetracement"
  | "text"
  | "triangle"
  | "parallelChannel"
  | "priceRange"
  | "longShortPosition";

export type BacktestDrawingHandle =
  | "line"
  | "start"
  | "end"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight";

export type BacktestDrawingPoint = {
  logical: number;
  price: number;
};

export type BacktestDrawingStyle = {
  stroke: string;
  fill: string | null;
  strokeWidth: number;
};

export type BacktestHorizontalLineDrawing = {
  id: string;
  type: "horizontalLine";
  price: number;
  style: BacktestDrawingStyle;
};

export type BacktestTrendLineDrawing = {
  id: string;
  type: "trendLine";
  start: BacktestDrawingPoint;
  end: BacktestDrawingPoint;
  style: BacktestDrawingStyle;
};

export type BacktestRectangleDrawing = {
  id: string;
  type: "rectangle";
  start: BacktestDrawingPoint;
  end: BacktestDrawingPoint;
  style: BacktestDrawingStyle;
};

export type BacktestDrawing =
  | BacktestHorizontalLineDrawing
  | BacktestTrendLineDrawing
  | BacktestRectangleDrawing;

export type BacktestDrawingSelectionState = {
  drawingId: string | null;
  handle: BacktestDrawingHandle | null;
};

export type BacktestLineValues = {
  entry: number | null;
  stop: number | null;
  target: number | null;
};

export type BacktestAccountState = {
  startingBalance: number;
  currentBalance: number;
  defaultRiskPercent: number;
};

export type BacktestRiskSettings = {
  riskPercent: number;
  riskAmount: number;
};

export type BacktestTradeMoneySummary = {
  riskPercent: number | null;
  riskAmount: number | null;
  volume: number | null;
  livePnl: number | null;
  finalPnl: number | null;
  balanceAfterTrade: number | null;
};

export type BacktestHistoryItem = {
  id: string;
  symbol: string;
  timeframe: BacktestTimeframe;
  direction: BacktestDirection;
  orderType: BacktestOrderType;
  volume: number | null;
  status: BacktestSessionStatus;
  resultR: number | null;
  resultAmount: number | null;
  balanceAfter: number | null;
  closedAt: string;
};

export type BacktestAccountRecord = BacktestAccountState & {
  id: string;
  userId: string;
  updatedAt: string;
};

export type BacktestTradeDraft = {
  direction: BacktestDirection;
  orderType: BacktestOrderType;
  entry: string;
  hasStop: boolean;
  stop: string;
  hasTarget: boolean;
  target: string;
  volume: string;
};

export type BacktestTradeExecution = {
  status: BacktestSessionStatus;
  orderType: BacktestOrderType | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  riskPercent: number | null;
  riskAmount: number | null;
  volume: number | null;
  balanceBeforeTrade: number | null;
  openedAtIndex: number | null;
  openedAtTime: number | null;
  closedAtIndex: number | null;
  closedAtTime: number | null;
  exitPrice: number | null;
  resultR: number | null;
  resultAmount: number | null;
  balanceAfterTrade: number | null;
  maxFavorableR: number | null;
  maxAdverseR: number | null;
  durationBars: number | null;
};

export type ReplayState = {
  replayIndex: number;
  isPlaying: boolean;
  speedId: string;
};

export type BacktestSessionRecord = {
  id: string;
  symbol: string;
  timeframe: BacktestTimeframe;
  direction: BacktestDirection;
  orderType: BacktestOrderType | null;
  volume: number | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  exitPrice: number | null;
  status: BacktestSessionStatus;
  resultR: number | null;
  resultAmount: number | null;
  balanceAfter: number | null;
  startedAt: string;
  finishedAt: string | null;
};

export type BacktestSessionSaveInput = Omit<BacktestSessionRecord, "id"> & {
  id?: string;
};

export type BacktestCandlesResponse = {
  instrument: BacktestInstrument;
  selection: BacktestResolvedSelection;
  candles: BacktestCandle[];
};

export type BacktestTradeValidation = {
  isValid: boolean;
  message?: string;
  entry: number | null;
  stop: number | null;
  target: number | null;
  riskPerUnit: number | null;
  rewardPerUnit: number | null;
  riskReward: number | null;
};
