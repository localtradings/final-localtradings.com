import type { CandlestickData, SeriesMarker, Time } from "lightweight-charts";

import type {
  BacktestDirection,
  BacktestInstrument,
  BacktestLineField,
  BacktestTradeExecution,
} from "@/features/backtesting/types";

export type ChartCandle = CandlestickData<Time>;
export type ChartMarker = SeriesMarker<Time>;
export type LineCoordinateState = Record<BacktestLineField, number | null>;
export type ExportedLineToolPoint = {
  timestamp: number | string;
  price: number;
};
export type ExportedLineTool = {
  id?: string;
  toolType: string;
  options?: unknown;
  points?: ExportedLineToolPoint[];
};

export const PRICE_SCALE_GUTTER_PX = 92;
export const REPLAY_VIEW_BAR_COUNT = 180;

export const LINE_STYLES: Record<
  BacktestLineField,
  { color: string; title: string; pillClassName: string }
> = {
  entry: {
    color: "#3b82f6",
    title: "Entry",
    pillClassName: "border-[#1d4ed8] bg-[#0f213f] text-[#dbeafe]",
  },
  stop: {
    color: "#ef4444",
    title: "Stop",
    pillClassName: "border-[#b91c1c] bg-[#3a1215] text-[#fee2e2]",
  },
  target: {
    color: "#22c55e",
    title: "Target",
    pillClassName: "border-[#15803d] bg-[#102d1a] text-[#dcfce7]",
  },
};

export function roundToInstrument(price: number, instrument: BacktestInstrument) {
  const snapped = Math.round(price / instrument.tickSize) * instrument.tickSize;
  const factor = 10 ** instrument.pricePrecision;
  return Math.round(snapped * factor) / factor;
}

export function buildChartMarkers({
  candles,
  direction,
  execution,
}: {
  candles: ChartCandle[];
  direction: BacktestDirection;
  execution: BacktestTradeExecution;
}) {
  const nextMarkers: ChartMarker[] = [];

  if (execution.openedAtIndex !== null && candles[execution.openedAtIndex]) {
    nextMarkers.push({
      time: candles[execution.openedAtIndex].time,
      position: direction === "Long" ? "belowBar" : "aboveBar",
      color: "#3b82f6",
      shape: direction === "Long" ? "arrowUp" : "arrowDown",
      text: direction === "Long" ? "Buy filled" : "Sell filled",
    });
  }

  if (execution.closedAtIndex !== null && candles[execution.closedAtIndex]) {
    nextMarkers.push({
      time: candles[execution.closedAtIndex].time,
      position: direction === "Long" ? "aboveBar" : "belowBar",
      color: execution.status === "target_hit" ? "#22c55e" : "#ef4444",
      shape: "circle",
      text: execution.status.replace("_", " "),
    });
  }

  return nextMarkers;
}

export function parseExportedLineTools(json: string | null | undefined) {
  if (!json) {
    return [] as ExportedLineTool[];
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed as ExportedLineTool[]) : [];
  } catch {
    return [];
  }
}

export function stringifyExportedLineTools(tools: ExportedLineTool[]) {
  return JSON.stringify(tools);
}

export function shiftExportedLineToolPoints(
  tools: ExportedLineTool[],
  {
    timestampDelta = 0,
    priceDelta = 0,
  }: {
    timestampDelta?: number;
    priceDelta?: number;
  },
) {
  return tools.map((tool) => ({
    ...tool,
    points: Array.isArray(tool.points)
      ? tool.points.map((point) => ({
          ...point,
          timestamp:
            typeof point.timestamp === "number"
              ? point.timestamp + timestampDelta
              : point.timestamp,
          price: point.price + priceDelta,
        }))
      : tool.points,
  }));
}
