"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";

import type {
  BacktestCandle,
  BacktestDirection,
  BacktestInstrument,
  BacktestLineField,
  BacktestLineValues,
  BacktestTradeExecution,
} from "../types";

type BacktestChartProps = {
  candles: BacktestCandle[];
  direction: BacktestDirection;
  editableFields: Record<BacktestLineField, boolean>;
  execution: BacktestTradeExecution;
  instrument: BacktestInstrument;
  isLoading: boolean;
  lineValues: BacktestLineValues;
  onLineChange: (field: BacktestLineField, price: number) => void;
  canEditLines: boolean;
  windowKey: string;
};

type ChartCandle = CandlestickData<Time>;
type ChartMarker = SeriesMarker<Time>;
type LineCoordinateState = Record<BacktestLineField, number | null>;
const PRICE_SCALE_GUTTER_PX = 76;
const REPLAY_VIEW_BAR_COUNT = 120;

const LINE_STYLES: Record<
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

function roundToInstrument(price: number, instrument: BacktestInstrument) {
  const snapped = Math.round(price / instrument.tickSize) * instrument.tickSize;
  const factor = 10 ** instrument.pricePrecision;
  return Math.round(snapped * factor) / factor;
}

export function BacktestChart({
  candles,
  direction,
  editableFields,
  execution,
  instrument,
  isLoading,
  lineValues,
  onLineChange,
  canEditLines,
  windowKey,
}: BacktestChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const linesRef = useRef<IPriceLine[]>([]);
  const resizeFrameRef = useRef<number | null>(null);
  const applyingRangeRef = useRef(false);
  const followReplayRef = useRef(true);
  const lastWindowKeyRef = useRef<string | null>(null);
  const dragFieldRef = useRef<BacktestLineField | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lineCoordinates, setLineCoordinates] = useState<LineCoordinateState>({
    entry: null,
    stop: null,
    target: null,
  });

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.cursor = isDragging ? "ns-resize" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  const chartCandles = useMemo<ChartCandle[]>(
    () => candles.map((candle) => ({ ...candle, time: candle.time as Time })),
    [candles],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const chart = createChart(container, {
      width: Math.max(container.clientWidth, 320),
      height: Math.max(container.clientHeight, 420),
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
        axisPressedMouseMove: {
          price: true,
          time: true,
        },
      },
      layout: {
        attributionLogo: false,
        background: {
          type: ColorType.Solid,
          color: "transparent",
        },
        textColor: "#d6dee9",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.08)" },
        horzLines: { color: "rgba(148,163,184,0.08)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148,163,184,0.14)",
        autoScale: true,
        ticksVisible: true,
        scaleMargins: {
          top: 0.16,
          bottom: 0.16,
        },
      },
      timeScale: {
        borderColor: "rgba(148,163,184,0.14)",
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (value: number) => value.toFixed(instrument.pricePrecision),
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      borderVisible: false,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);

    const handleVisibleRangeChange = () => {
      if (!applyingRangeRef.current && lastWindowKeyRef.current) {
        followReplayRef.current = false;
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) {
        return;
      }

      const { width, height } = entry.contentRect;
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }

      resizeFrameRef.current = window.requestAnimationFrame(() => {
        chartRef.current?.resize(Math.max(width, 320), Math.max(height, 420));
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      markersRef.current = null;
      linesRef.current = [];
      seriesRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [instrument.pricePrecision]);

  const markers = useMemo(() => {
    const nextMarkers: ChartMarker[] = [];

    if (execution.openedAtIndex !== null && chartCandles[execution.openedAtIndex]) {
      nextMarkers.push({
        time: chartCandles[execution.openedAtIndex].time,
        position: direction === "Long" ? "belowBar" : "aboveBar",
        color: "#3b82f6",
        shape: direction === "Long" ? "arrowUp" : "arrowDown",
        text: direction === "Long" ? "Buy filled" : "Sell filled",
      });
    }

    if (execution.closedAtIndex !== null && chartCandles[execution.closedAtIndex]) {
      nextMarkers.push({
        time: chartCandles[execution.closedAtIndex].time,
        position: direction === "Long" ? "aboveBar" : "belowBar",
        color: execution.status === "target_hit" ? "#22c55e" : "#ef4444",
        shape: "circle",
        text: execution.status.replace("_", " "),
      });
    }

    return nextMarkers;
  }, [chartCandles, direction, execution.closedAtIndex, execution.openedAtIndex, execution.status]);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) {
      return;
    }

    seriesRef.current.setData(chartCandles);
    markersRef.current?.setMarkers(markers);

    if (chartCandles.length === 0) {
      return;
    }

    const nextRange = {
      from: Math.max(0, chartCandles.length - 1 - REPLAY_VIEW_BAR_COUNT / 2),
      to: chartCandles.length - 1 + REPLAY_VIEW_BAR_COUNT / 2,
    };

    const isNewWindow = lastWindowKeyRef.current !== windowKey;
    if (isNewWindow) {
      lastWindowKeyRef.current = windowKey;
      followReplayRef.current = true;
    }

    if (isNewWindow || followReplayRef.current) {
      applyingRangeRef.current = true;
      chartRef.current.timeScale().setVisibleLogicalRange(nextRange);
      chartRef.current.priceScale("right").applyOptions({
        autoScale: true,
      });
      window.requestAnimationFrame(() => {
        applyingRangeRef.current = false;
      });
    }
  }, [chartCandles, markers, windowKey]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) {
      return;
    }

    linesRef.current.forEach((line) => {
      series.removePriceLine(line);
    });
    linesRef.current = [];

    (Object.keys(LINE_STYLES) as BacktestLineField[]).forEach((field) => {
      const price = lineValues[field];
      if (typeof price !== "number") {
        return;
      }

      const style = LINE_STYLES[field];
      const line = series.createPriceLine({
        axisLabelVisible: false,
        color: style.color,
        lineStyle: LineStyle.Solid,
        lineWidth: 2,
        price,
        title: "",
      });

      linesRef.current.push(line);
    });
  }, [lineValues]);

  useEffect(() => {
    let frame = 0;

    const updateCoordinates = () => {
      const series = seriesRef.current;
      if (!series) {
        frame = window.requestAnimationFrame(updateCoordinates);
        return;
      }

      setLineCoordinates((current) => {
        const next = {
          entry:
            typeof lineValues.entry === "number"
              ? series.priceToCoordinate(lineValues.entry) ?? null
              : null,
          stop:
            typeof lineValues.stop === "number"
              ? series.priceToCoordinate(lineValues.stop) ?? null
              : null,
          target:
            typeof lineValues.target === "number"
              ? series.priceToCoordinate(lineValues.target) ?? null
              : null,
        };

        if (
          current.entry === next.entry &&
          current.stop === next.stop &&
          current.target === next.target
        ) {
          return current;
        }

        return next;
      });

      frame = window.requestAnimationFrame(updateCoordinates);
    };

    frame = window.requestAnimationFrame(updateCoordinates);
    return () => window.cancelAnimationFrame(frame);
  }, [lineValues]);

  function updateDraggedLine(clientY: number) {
    const field = dragFieldRef.current;
    const container = containerRef.current;
    const series = seriesRef.current;

    if (!field || !container || !series) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
    const price = series.coordinateToPrice(y);

    if (typeof price !== "number") {
      return;
    }

    onLineChange(field, roundToInstrument(price, instrument));
  }

  function stopDragging() {
    dragFieldRef.current = null;
    activePointerIdRef.current = null;
    setIsDragging(false);
  }

  function beginDragging(
    field: BacktestLineField,
    clientY: number,
    pointerId: number,
    target: HTMLDivElement,
  ) {
    if (!canEditLines) {
      return;
    }

    dragFieldRef.current = field;
    activePointerIdRef.current = pointerId;
    setIsDragging(true);
    target.setPointerCapture(pointerId);
    updateDraggedLine(clientY);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col rounded-[var(--radius-xl)] bg-[linear-gradient(180deg,#080c11_0%,#0a0f15_100%)] p-1.5 sm:p-2">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(203,213,225,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(203,213,225,0.07)_1px,transparent_1px)] [background-size:28px_18px]" />
      <div className="relative h-full min-h-[20rem] overflow-hidden rounded-[var(--radius-lg)] bg-[#060a0f]">
        <div className="h-full w-full" ref={containerRef} />

        <div
          className="pointer-events-none absolute inset-y-0 left-0"
          style={{ right: `${PRICE_SCALE_GUTTER_PX}px` }}
        >
          {(Object.keys(LINE_STYLES) as BacktestLineField[]).map((field) => {
            const coordinate = lineCoordinates[field];
            const price = lineValues[field];
            if (coordinate === null || typeof price !== "number") {
              return null;
            }

            const style = LINE_STYLES[field];

            return (
              <div
                aria-label={`Drag ${style.title.toLowerCase()} line`}
                className={`pointer-events-auto absolute inset-x-0 z-10 h-12 bg-transparent ${
                  editableFields[field] ? "cursor-ns-resize" : "cursor-default"
                }`}
                key={field}
                onPointerDown={(event) => {
                  if (!editableFields[field]) {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  beginDragging(
                    field,
                    event.clientY,
                    event.pointerId,
                    event.currentTarget,
                  );
                }}
                onPointerMove={(event) => {
                  if (
                    dragFieldRef.current !== field ||
                    activePointerIdRef.current !== event.pointerId
                  ) {
                    return;
                  }

                  event.preventDefault();
                  updateDraggedLine(event.clientY);
                }}
                onPointerUp={(event) => {
                  if (
                    activePointerIdRef.current === event.pointerId &&
                    event.currentTarget.hasPointerCapture(event.pointerId)
                  ) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  stopDragging();
                }}
                onPointerCancel={stopDragging}
                onLostPointerCapture={stopDragging}
                style={{
                  top: coordinate,
                  transform: "translateY(-50%)",
                  touchAction: "none",
                }}
              >
                <span
                  className="absolute inset-x-0 top-1/2 z-0 h-0.5 -translate-y-1/2"
                  style={{ backgroundColor: style.color }}
                />
                <span
                  className={`pointer-events-none absolute right-2 top-1/2 z-20 inline-flex min-h-7 -translate-y-1/2 items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition ${style.pillClassName}`}
                >
                  <span>{style.title}</span>
                  <span className="text-white/85">
                    {price.toFixed(instrument.pricePrecision)}
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060a0f]/88">
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <div className="relative h-10 w-10">
                <span className="absolute inset-0 rounded-full border-2 border-white/10" />
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#3b82f6] border-r-[#3b82f6]" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                Loading chart...
              </p>
            </div>
          </div>
        ) : candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#060a0f]/88 text-sm text-slate-400">
            No candles are available for this replay window.
          </div>
        ) : null}
      </div>
    </div>
  );
}
