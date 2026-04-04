"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  createChart,
} from "lightweight-charts";

import type { BacktestCandle } from "@/features/backtesting/types";

export function BattleChart({
  candles,
  currentCandleIndex,
}: {
  candles: BacktestCandle[];
  currentCandleIndex: number | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#060a0f" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.22)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.22)",
      },
      crosshair: {
        vertLine: { color: "rgba(250, 204, 21, 0.28)" },
        horzLine: { color: "rgba(250, 204, 21, 0.28)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      borderUpColor: "#22c55e",
      wickUpColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart || candles.length === 0) {
      return;
    }

    const lastIndex =
      typeof currentCandleIndex === "number"
        ? Math.min(currentCandleIndex, candles.length - 1)
        : candles.length - 1;

    const visibleCandles = candles.slice(0, lastIndex + 1).reduce<
      Array<{
        time: UTCTimestamp;
        open: number;
        high: number;
        low: number;
        close: number;
      }>
    >((entries, candle) => {
      const nextEntry = {
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      };
      const previousEntry = entries.at(-1);

      if (!previousEntry || nextEntry.time > previousEntry.time) {
        entries.push(nextEntry);
        return entries;
      }

      if (nextEntry.time === previousEntry.time) {
        entries[entries.length - 1] = nextEntry;
      }

      return entries;
    }, []);

    series.setData(visibleCandles);
    chart.timeScale().fitContent();
  }, [candles, currentCandleIndex]);

  return <div className="h-[24rem] w-full overflow-hidden rounded-[1rem] border border-outline-variant/60" ref={containerRef} />;
}
