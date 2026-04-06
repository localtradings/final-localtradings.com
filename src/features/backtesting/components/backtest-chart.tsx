"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type Time,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import {
  ToolBrushIcon,
  ToolCircleIcon,
  ToolClearIcon,
  ToolCursorIcon,
  ToolDeleteIcon,
  ToolExtendedLineIcon,
  ToolFibIcon,
  ToolHorizontalLineIcon,
  ToolLongShortIcon,
  ToolParallelChannelIcon,
  ToolPriceRangeIcon,
  ToolRayIcon,
  ToolRectangleIcon,
  ToolTextIcon,
  ToolTrendLineIcon,
  ToolTriangleIcon,
  type BacktestToolIcon,
} from "./backtest-tool-icons";
import {
  createLineToolsPlugin,
  type ILineToolsPlugin,
  type LineToolsAfterEditEventParams,
  type LineToolsDoubleClickEventParams,
} from "lightweight-charts-line-tools-core/dist/lightweight-charts-line-tools-core.js";
import registerLinesPlugin from "lightweight-charts-line-tools-lines/dist/lightweight-charts-line-tools-lines.js";
import { LineToolRectangle } from "lightweight-charts-line-tools-rectangle/dist/lightweight-charts-line-tools-rectangle.js";
import registerFreehandPlugin from "lightweight-charts-line-tools-freehand/dist/lightweight-charts-line-tools-freehand.js";
import { LineToolCircle } from "lightweight-charts-line-tools-circle/dist/lightweight-charts-line-tools-circle.js";
import registerFibRetracementPlugin from "lightweight-charts-line-tools-fib-retracement/dist/lightweight-charts-line-tools-fib-retracement.js";
import registerTextPlugin from "../vendor/line-tools-extra/text/index";
import registerTrianglePlugin from "../vendor/line-tools-extra/triangle/index";
import registerParallelChannelPlugin from "../vendor/line-tools-extra/parallel-channel/index";
import registerPriceRangePlugin from "../vendor/line-tools-extra/price-range/index";
import registerLongShortPositionPlugin from "../vendor/line-tools-extra/long-short-position/index";

import type {
  BacktestCandle,
  BacktestDirection,
  BacktestDrawingTool,
  BacktestInstrument,
  BacktestLineField,
  BacktestLineValues,
  BacktestTradeExecution,
} from "../types";
import {
  buildChartMarkers,
  type ChartCandle,
  type ExportedLineTool,
  LINE_STYLES,
  type LineCoordinateState,
  parseExportedLineTools,
  PRICE_SCALE_GUTTER_PX,
  REPLAY_VIEW_BAR_COUNT,
  roundToInstrument,
  shiftExportedLineToolPoints,
  stringifyExportedLineTools,
} from "./backtest-chart-helpers";

type BacktestChartProps = {
  activeDrawingTool: BacktestDrawingTool;
  candles: BacktestCandle[];
  drawingStorageKey: string;
  direction: BacktestDirection;
  editableFields: Record<BacktestLineField, boolean>;
  execution: BacktestTradeExecution;
  hasStopLine: boolean;
  hasTargetLine: boolean;
  instrument: BacktestInstrument;
  isLoading: boolean;
  lineValues: BacktestLineValues;
  onAddOptionalLine: (field: Extract<BacktestLineField, "stop" | "target">) => void;
  onLineChange: (field: BacktestLineField, price: number) => void;
  onRemoveOptionalLine: (field: Extract<BacktestLineField, "stop" | "target">) => void;
  onToolChange: (tool: BacktestDrawingTool) => void;
  canEditLines: boolean;
  showTradeControls?: boolean;
  windowKey: string;
};

const TOOL_NAME_MAP: Record<Exclude<BacktestDrawingTool, "cursor">, string> = {
  horizontalLine: "HorizontalLine",
  trendLine: "TrendLine",
  ray: "Ray",
  extendedLine: "ExtendedLine",
  rectangle: "Rectangle",
  brush: "Brush",
  circle: "Circle",
  fibRetracement: "FibRetracement",
  text: "Text",
  triangle: "Triangle",
  parallelChannel: "ParallelChannel",
  priceRange: "PriceRange",
  longShortPosition: "LongShortPosition",
};

const TOOL_POINT_REQUIREMENTS: Record<
  Exclude<BacktestDrawingTool, "cursor">,
  number
> = {
  horizontalLine: 1,
  trendLine: 2,
  ray: 2,
  extendedLine: 2,
  rectangle: 2,
  brush: 2,
  circle: 2,
  fibRetracement: 2,
  text: 1,
  triangle: 3,
  parallelChannel: 3,
  priceRange: 2,
  longShortPosition: 3,
};

const TOOL_ITEMS: Array<{
  tool: BacktestDrawingTool;
  icon: BacktestToolIcon;
  label: string;
}> = [
  { tool: "cursor", icon: ToolCursorIcon, label: "Select" },
  { tool: "horizontalLine", icon: ToolHorizontalLineIcon, label: "Horizontal line" },
  { tool: "trendLine", icon: ToolTrendLineIcon, label: "Trend line" },
  { tool: "ray", icon: ToolRayIcon, label: "Ray" },
  { tool: "extendedLine", icon: ToolExtendedLineIcon, label: "Extended line" },
  { tool: "rectangle", icon: ToolRectangleIcon, label: "Rectangle zone" },
  { tool: "brush", icon: ToolBrushIcon, label: "Brush" },
  { tool: "circle", icon: ToolCircleIcon, label: "Circle" },
  { tool: "fibRetracement", icon: ToolFibIcon, label: "Fib retracement" },
  { tool: "text", icon: ToolTextIcon, label: "Text note" },
  { tool: "triangle", icon: ToolTriangleIcon, label: "Triangle" },
  { tool: "parallelChannel", icon: ToolParallelChannelIcon, label: "Parallel channel" },
  { tool: "priceRange", icon: ToolPriceRangeIcon, label: "Price range" },
  { tool: "longShortPosition", icon: ToolLongShortIcon, label: "Long/short position" },
];

const TOOL_SHORTCUTS: Partial<Record<BacktestDrawingTool, string>> = {
  cursor: "Esc",
  horizontalLine: "Alt+H",
  trendLine: "Alt+T",
  ray: "Alt+R",
  extendedLine: "Alt+E",
  rectangle: "Alt+Shift+R",
  brush: "Alt+B",
  circle: "Alt+C",
  fibRetracement: "Alt+F",
  text: "Alt+X",
  triangle: "Alt+Shift+T",
  parallelChannel: "Alt+Shift+P",
  priceRange: "Alt+P",
  longShortPosition: "Alt+L",
};

const LINE_DRAG_ACTIVATION_THRESHOLD_PX = 4;
const LINE_HIT_AREA_HEIGHT_PX = 24;
const TRADE_CONTROL_BASE_CLASS =
  "inline-flex h-6 items-center border border-[#ffe447] bg-[#ffe447] pl-0.5 pr-0 text-[9px] font-semibold tracking-[0.08em] text-black shadow-[0_8px_18px_rgba(0,0,0,0.16)]";
const TRADE_CONTROL_ADD_CLASS =
  `${TRADE_CONTROL_BASE_CLASS} rounded-sm transition hover:bg-[#f5da3f] hover:border-[#f5da3f]`;
const TRADE_CONTROL_ACTIVE_CLASS =
  `${TRADE_CONTROL_BASE_CLASS} rounded-sm`;
const TRADE_CONTROL_REMOVE_CLASS =
  "ml-2 inline-flex h-6 min-w-8 items-center justify-center border-l border-black/15 bg-black/12 px-2 text-[9px] font-semibold text-black transition hover:bg-black/20";

const TOOL_OPTIONS: Partial<
  Record<Exclude<BacktestDrawingTool, "cursor">, Record<string, unknown>>
> = {
  horizontalLine: {
    showPriceAxisLabels: true,
    showTimeAxisLabels: true,
    priceAxisLabelAlwaysVisible: true,
    line: { color: "#60a5fa", width: 2 },
  },
  trendLine: {
    showPriceAxisLabels: true,
    showTimeAxisLabels: true,
    line: { color: "#38bdf8", width: 2 },
  },
  ray: {
    showPriceAxisLabels: true,
    showTimeAxisLabels: true,
    line: { color: "#22d3ee", width: 2 },
  },
  extendedLine: {
    showPriceAxisLabels: true,
    showTimeAxisLabels: true,
    line: { color: "#67e8f9", width: 2 },
  },
  rectangle: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    line: { color: "#f59e0b", width: 2 },
    background: { color: "rgba(245, 158, 11, 0.12)" },
  },
  brush: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    line: { color: "#c084fc", width: 2 },
  },
  circle: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    line: { color: "#f97316", width: 2 },
    background: { color: "rgba(249, 115, 22, 0.1)" },
  },
  fibRetracement: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    levels: [
      { color: "#94a3b8", coeff: 0, opacity: 0 },
      { color: "#ef4444", coeff: 0.236, opacity: 0.08 },
      { color: "#f59e0b", coeff: 0.382, opacity: 0.08 },
      { color: "#facc15", coeff: 0.5, opacity: 0.08 },
      { color: "#22c55e", coeff: 0.618, opacity: 0.08 },
      { color: "#38bdf8", coeff: 0.786, opacity: 0.08 },
      { color: "#94a3b8", coeff: 1, opacity: 0 },
    ],
  },
  text: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    text: {
      value: "Note",
      font: {
        color: "#e2e8f0",
        size: 12,
        family: "sans-serif",
      },
      box: {
        background: {
          color: "rgba(11, 17, 23, 0.92)",
          inflation: { x: 6, y: 4 },
        },
        border: {
          color: "rgba(96, 165, 250, 0.45)",
          width: 1,
          radius: 6,
        },
      },
    },
  },
  triangle: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    triangle: {
      background: { color: "rgba(245, 158, 11, 0.14)" },
      border: { color: "#f59e0b", width: 2 },
    },
  },
  parallelChannel: {
    channelLine: { color: "#38bdf8", width: 2 },
    middleLine: { color: "rgba(56, 189, 248, 0.72)", width: 1 },
    background: { color: "rgba(56, 189, 248, 0.12)" },
    showMiddleLine: true,
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
  },
  priceRange: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    text: {
      value: "",
      font: { color: "#fde68a", size: 11, family: "sans-serif" },
    },
    priceRange: {
      rectangle: {
        background: { color: "rgba(168, 85, 247, 0.12)" },
        border: { color: "#a855f7", width: 1.5, radius: 0 },
      },
      verticalLine: { color: "#a855f7", width: 1 },
      horizontalLine: { color: "#a855f7", width: 1 },
      showCenterHorizontalLine: true,
      showCenterVerticalLine: true,
      showTopPrice: true,
      showBottomPrice: true,
    },
  },
  longShortPosition: {
    showPriceAxisLabels: false,
    showTimeAxisLabels: false,
    showAutoText: true,
    entryStopLossRectangle: {
      background: { color: "rgba(239, 68, 68, 0.18)" },
      border: { color: "#ef4444", width: 1 },
    },
    entryPtRectangle: {
      background: { color: "rgba(34, 197, 94, 0.18)" },
      border: { color: "#22c55e", width: 1 },
    },
    entryStopLossText: {
      font: { color: "#fecaca", size: 11, family: "sans-serif" },
    },
    entryPtText: {
      font: { color: "#bbf7d0", size: 11, family: "sans-serif" },
    },
  },
};

type LineToolsPluginRuntime = ILineToolsPlugin & {
  _interactionManager?: {
    deselectAllTools: () => void;
  };
  addLineTool: (type: string, points?: unknown[], options?: unknown) => string;
  createOrUpdateLineTool: (
    type: string,
    points: unknown[],
    options: unknown,
    id: string,
  ) => void;
  registerLineTool: (
    type: string,
    toolClass: new (...args: unknown[]) => unknown,
  ) => void;
};

export function BacktestChart({
  activeDrawingTool,
  candles,
  drawingStorageKey,
  direction,
  editableFields,
  execution,
  hasStopLine,
  hasTargetLine,
  instrument,
  isLoading,
  lineValues,
  onAddOptionalLine,
  onLineChange,
  onRemoveOptionalLine,
  onToolChange,
  canEditLines,
  showTradeControls = true,
  windowKey,
}: BacktestChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const resizeFrameRef = useRef<number | null>(null);
  const applyingRangeRef = useRef(false);
  const followReplayRef = useRef(true);
  const lastWindowKeyRef = useRef<string | null>(null);
  const dragFieldRef = useRef<BacktestLineField | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartClientYRef = useRef<number | null>(null);
  const dragPointerOffsetRef = useRef(0);
  const dragActivatedRef = useRef(false);
  const lineToolsRef = useRef<ILineToolsPlugin | null>(null);
  const drawingHistoryRef = useRef<string[]>(["[]"]);
  const drawingHistoryIndexRef = useRef(0);
  const drawingClipboardRef = useRef<ExportedLineTool[] | null>(null);
  const isApplyingSnapshotRef = useRef(false);
  const pendingToolIdRef = useRef<string | null>(null);
  const pendingToolTypeRef =
    useRef<Exclude<BacktestDrawingTool, "cursor"> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lineCoordinates, setLineCoordinates] = useState<LineCoordinateState>({
    entry: null,
    stop: null,
    target: null,
  });
  const [hasLineTools, setHasLineTools] = useState(false);
  const [hasSelectedLineTools, setHasSelectedLineTools] = useState(false);

  const chartCandles = useMemo<ChartCandle[]>(
    () => candles.map((candle) => ({ ...candle, time: candle.time as Time })),
    [candles],
  );

  const markers = useMemo(
    () => buildChartMarkers({ candles: chartCandles, direction, execution }),
    [chartCandles, direction, execution],
  );

  const syncLineToolsState = useCallback((plugin = lineToolsRef.current) => {
    if (!plugin) {
      setHasLineTools(false);
      setHasSelectedLineTools(false);
      return;
    }

    try {
      const exported = JSON.parse(plugin.exportLineTools()) as unknown[];
      const selected = JSON.parse(plugin.getSelectedLineTools()) as unknown[];
      setHasLineTools(exported.length > 0);
      setHasSelectedLineTools(selected.length > 0);
    } catch {
      setHasLineTools(false);
      setHasSelectedLineTools(false);
    }
  }, []);

  const getLineToolsSnapshot = useCallback((plugin = lineToolsRef.current) => {
    if (!plugin) {
      return "[]";
    }

    try {
      return plugin.exportLineTools();
    } catch {
      return "[]";
    }
  }, []);

  const persistLineToolsSnapshot = useCallback(
    (snapshot: string) => {
      if (typeof window === "undefined") {
        return;
      }

      if (snapshot === "[]") {
        window.localStorage.removeItem(drawingStorageKey);
        return;
      }

      window.localStorage.setItem(drawingStorageKey, snapshot);
    },
    [drawingStorageKey],
  );

  const resetDrawingHistory = useCallback((snapshot: string) => {
    drawingHistoryRef.current = [snapshot];
    drawingHistoryIndexRef.current = 0;
  }, []);

  const commitLineToolsSnapshot = useCallback(
    (plugin = lineToolsRef.current) => {
      if (!plugin || isApplyingSnapshotRef.current) {
        return;
      }

      const snapshot = getLineToolsSnapshot(plugin);
      persistLineToolsSnapshot(snapshot);

      const history = drawingHistoryRef.current;
      const currentIndex = drawingHistoryIndexRef.current;
      if (history[currentIndex] === snapshot) {
        syncLineToolsState(plugin);
        return;
      }

      const nextHistory = history.slice(0, currentIndex + 1);
      nextHistory.push(snapshot);
      drawingHistoryRef.current = nextHistory;
      drawingHistoryIndexRef.current = nextHistory.length - 1;
      syncLineToolsState(plugin);
    },
    [getLineToolsSnapshot, persistLineToolsSnapshot, syncLineToolsState],
  );

  const deselectAllLineTools = useCallback((plugin = lineToolsRef.current) => {
    const runtimePlugin = plugin as LineToolsPluginRuntime | null;
    runtimePlugin?._interactionManager?.deselectAllTools();
    if (plugin) {
      syncLineToolsState(plugin);
    }
  }, [syncLineToolsState]);

  const applyLineToolsSnapshot = useCallback(
    (snapshot: string, { updateHistory = false }: { updateHistory?: boolean } = {}) => {
      const plugin = lineToolsRef.current;
      if (!plugin) {
        return;
      }

      const safeSnapshot = stringifyExportedLineTools(parseExportedLineTools(snapshot));
      isApplyingSnapshotRef.current = true;
      plugin.removeAllLineTools();
      if (safeSnapshot !== "[]") {
        plugin.importLineTools(safeSnapshot);
      }
      deselectAllLineTools(plugin);
      syncLineToolsState(plugin);
      persistLineToolsSnapshot(safeSnapshot);
      if (updateHistory) {
        resetDrawingHistory(safeSnapshot);
      }
      window.requestAnimationFrame(() => {
        isApplyingSnapshotRef.current = false;
      });
    },
    [
      deselectAllLineTools,
      persistLineToolsSnapshot,
      resetDrawingHistory,
      syncLineToolsState,
    ],
  );

  const loadPersistedLineToolsSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return "[]";
    }

    return stringifyExportedLineTools(
      parseExportedLineTools(window.localStorage.getItem(drawingStorageKey)),
    );
  }, [drawingStorageKey]);

  const getTimeStep = useCallback(() => {
    if (chartCandles.length < 2) {
      return 60;
    }

    const first = Number(chartCandles[0]?.time ?? 0);
    const second = Number(chartCandles[1]?.time ?? first + 60);
    const delta = Math.abs(second - first);
    return Number.isFinite(delta) && delta > 0 ? delta : 60;
  }, [chartCandles]);

  const cancelPendingTool = useCallback(() => {
    const plugin = lineToolsRef.current;
    const pendingId = pendingToolIdRef.current;
    if (!plugin || !pendingId) {
      pendingToolIdRef.current = null;
      pendingToolTypeRef.current = null;
      return;
    }

    plugin.removeLineToolsById([pendingId]);
    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    syncLineToolsState(plugin);
  }, [syncLineToolsState]);

  const finalizePendingTool = useCallback((plugin = lineToolsRef.current) => {
    if (!plugin || !pendingToolIdRef.current || !pendingToolTypeRef.current) {
      return false;
    }

    try {
      const exported = JSON.parse(
        plugin.getLineToolByID(pendingToolIdRef.current),
      ) as Array<{ points?: unknown[] }>;
      const tool = exported[0];
      const points = Array.isArray(tool?.points) ? tool.points : [];
      const requiredPoints =
        TOOL_POINT_REQUIREMENTS[pendingToolTypeRef.current];

      if (points.length < requiredPoints) {
        return false;
      }

      if (pendingToolTypeRef.current === "fibRetracement") {
        deselectAllLineTools(plugin);
      }

      pendingToolIdRef.current = null;
      pendingToolTypeRef.current = null;
      onToolChange("cursor");
      syncLineToolsState(plugin);
      return true;
    } catch {
      return false;
    }
  }, [deselectAllLineTools, onToolChange, syncLineToolsState]);

  const deleteSelectedTool = useCallback(() => {
    const plugin = lineToolsRef.current;
    if (!plugin) {
      return;
    }

    plugin.removeSelectedLineTools();
    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    window.requestAnimationFrame(() => commitLineToolsSnapshot(plugin));
  }, [commitLineToolsSnapshot]);

  const clearAllTools = useCallback(() => {
    const plugin = lineToolsRef.current;
    if (!plugin) {
      return;
    }

    plugin.removeAllLineTools();
    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    onToolChange("cursor");
    window.requestAnimationFrame(() => commitLineToolsSnapshot(plugin));
  }, [commitLineToolsSnapshot, onToolChange]);

  const startTool = useCallback(
    (tool: Exclude<BacktestDrawingTool, "cursor">) => {
      const plugin = lineToolsRef.current;
      if (!plugin) {
        return;
      }

      cancelPendingTool();
      const id = (plugin as LineToolsPluginRuntime).addLineTool(
        TOOL_NAME_MAP[tool],
        undefined,
        TOOL_OPTIONS[tool],
      );
      pendingToolIdRef.current = id || null;
      pendingToolTypeRef.current = id ? tool : null;
      onToolChange(tool);
      window.requestAnimationFrame(() => syncLineToolsState(plugin));
    },
    [cancelPendingTool, onToolChange, syncLineToolsState],
  );

  const activateCursor = useCallback(() => {
    cancelPendingTool();
    deselectAllLineTools();
    onToolChange("cursor");
  }, [cancelPendingTool, deselectAllLineTools, onToolChange]);

  const promptForTextToolValue = useCallback(
    (
      selectedLineTool: {
        id: string;
        toolType: string;
        points: unknown[];
        options?: Record<string, unknown>;
      },
      promptLabel: string,
      plugin = lineToolsRef.current,
    ) => {
      if (!plugin || selectedLineTool.toolType !== "Text") {
        return false;
      }

      const currentText =
        typeof selectedLineTool.options?.text === "object" &&
        selectedLineTool.options?.text !== null &&
        typeof (
          selectedLineTool.options.text as { value?: unknown }
        ).value === "string"
          ? ((selectedLineTool.options.text as { value: string }).value ?? "")
          : "";

      const nextText = window.prompt(promptLabel, currentText);
      if (nextText === null || nextText === currentText) {
        return false;
      }

      const applied = plugin.applyLineToolOptions({
        ...selectedLineTool,
        options: {
          ...(selectedLineTool.options ?? {}),
          text: {
            ...((selectedLineTool.options?.text as Record<string, unknown> | undefined) ?? {}),
            value: nextText.trim() || "Note",
          },
        },
      } as never);

      if (applied) {
        window.requestAnimationFrame(() => commitLineToolsSnapshot(plugin));
      }

      return applied;
    },
    [commitLineToolsSnapshot],
  );

  const undoLineTools = useCallback(() => {
    const plugin = lineToolsRef.current;
    if (!plugin) {
      return;
    }

    const currentIndex = drawingHistoryIndexRef.current;
    if (currentIndex <= 0) {
      return;
    }

    const nextIndex = currentIndex - 1;
    drawingHistoryIndexRef.current = nextIndex;
    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    onToolChange("cursor");
    applyLineToolsSnapshot(drawingHistoryRef.current[nextIndex] ?? "[]");
  }, [applyLineToolsSnapshot, onToolChange]);

  const redoLineTools = useCallback(() => {
    const plugin = lineToolsRef.current;
    if (!plugin) {
      return;
    }

    const history = drawingHistoryRef.current;
    const currentIndex = drawingHistoryIndexRef.current;
    if (currentIndex >= history.length - 1) {
      return;
    }

    const nextIndex = currentIndex + 1;
    drawingHistoryIndexRef.current = nextIndex;
    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    onToolChange("cursor");
    applyLineToolsSnapshot(history[nextIndex] ?? "[]");
  }, [applyLineToolsSnapshot, onToolChange]);

  const copySelectedLineTools = useCallback(() => {
    const plugin = lineToolsRef.current;
    if (!plugin) {
      return false;
    }

    const selectedTools = parseExportedLineTools(plugin.getSelectedLineTools());
    if (selectedTools.length === 0) {
      return false;
    }

    drawingClipboardRef.current = parseExportedLineTools(
      stringifyExportedLineTools(selectedTools),
    );
    return true;
  }, []);

  const pasteCopiedLineTools = useCallback(() => {
    const plugin = lineToolsRef.current as LineToolsPluginRuntime | null;
    const clipboard = drawingClipboardRef.current;
    if (!plugin || !clipboard || clipboard.length === 0) {
      return false;
    }

    const pasted = shiftExportedLineToolPoints(clipboard, {
      timestampDelta: getTimeStep(),
      priceDelta: instrument.tickSize * 2,
    });

    for (const tool of pasted) {
      if (!tool.toolType || !Array.isArray(tool.points)) {
        continue;
      }

      plugin.addLineTool(tool.toolType, tool.points, tool.options);
    }

    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    onToolChange("cursor");
    window.requestAnimationFrame(() => commitLineToolsSnapshot(plugin));
    return true;
  }, [commitLineToolsSnapshot, getTimeStep, instrument.tickSize, onToolChange]);

  const nudgeSelectedLineTools = useCallback(
    (direction: "left" | "right" | "up" | "down", multiplier = 1) => {
      const plugin = lineToolsRef.current as LineToolsPluginRuntime | null;
      if (!plugin) {
        return false;
      }

      const selectedTools = parseExportedLineTools(plugin.getSelectedLineTools());
      if (selectedTools.length === 0) {
        return false;
      }

      const timestampDelta =
        direction === "left"
          ? -getTimeStep() * multiplier
          : direction === "right"
            ? getTimeStep() * multiplier
            : 0;
      const priceDelta =
        direction === "up"
          ? instrument.tickSize * multiplier
          : direction === "down"
            ? -instrument.tickSize * multiplier
            : 0;
      const shifted = shiftExportedLineToolPoints(selectedTools, {
        timestampDelta,
        priceDelta,
      });

      for (const tool of shifted) {
        if (!tool.id || !tool.toolType || !Array.isArray(tool.points)) {
          continue;
        }

        plugin.createOrUpdateLineTool(
          tool.toolType,
          tool.points,
          tool.options ?? {},
          tool.id,
        );
      }

      window.requestAnimationFrame(() => commitLineToolsSnapshot(plugin));
      return true;
    },
    [commitLineToolsSnapshot, getTimeStep, instrument.tickSize],
  );

  const handleShortcutKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable === true ||
        target?.closest?.("[contenteditable='true']") !== null;
      const key = event.key.toLowerCase();
      const hasSelectedDrawings = hasSelectedLineTools;
      const modKey = event.metaKey || event.ctrlKey;

      if (event.key === "Escape") {
        event.preventDefault();
        if (pendingToolIdRef.current || activeDrawingTool !== "cursor") {
          activateCursor();
        } else {
          deselectAllLineTools();
        }
        return;
      }

      if (isEditableTarget) {
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && hasSelectedDrawings) {
        event.preventDefault();
        deleteSelectedTool();
        return;
      }

      if (modKey && !event.altKey && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redoLineTools();
        } else {
          undoLineTools();
        }
        return;
      }

      if (event.ctrlKey && !event.metaKey && !event.altKey && key === "y") {
        event.preventDefault();
        redoLineTools();
        return;
      }

      if (modKey && !event.altKey && key === "c") {
        if (copySelectedLineTools()) {
          event.preventDefault();
        }
        return;
      }

      if (modKey && !event.altKey && key === "v") {
        if (pasteCopiedLineTools()) {
          event.preventDefault();
        }
        return;
      }

      if (hasSelectedDrawings && key.startsWith("arrow")) {
        const multiplier = event.shiftKey ? 5 : 1;
        const moved =
          key === "arrowleft"
            ? nudgeSelectedLineTools("left", multiplier)
            : key === "arrowright"
              ? nudgeSelectedLineTools("right", multiplier)
              : key === "arrowup"
                ? nudgeSelectedLineTools("up", multiplier)
                : key === "arrowdown"
                  ? nudgeSelectedLineTools("down", multiplier)
                  : false;

        if (moved) {
          event.preventDefault();
        }
        return;
      }

      if (!event.altKey || modKey) {
        return;
      }

      switch (key) {
        case "h":
          event.preventDefault();
          startTool("horizontalLine");
          return;
        case "t":
          event.preventDefault();
          if (event.shiftKey) {
            startTool("triangle");
          } else {
            startTool("trendLine");
          }
          return;
        case "r":
          event.preventDefault();
          if (event.shiftKey) {
            startTool("rectangle");
          } else {
            startTool("ray");
          }
          return;
        case "e":
          event.preventDefault();
          startTool("extendedLine");
          return;
        case "b":
          event.preventDefault();
          startTool("brush");
          return;
        case "c":
          event.preventDefault();
          startTool("circle");
          return;
        case "f":
          event.preventDefault();
          startTool("fibRetracement");
          return;
        case "x":
          event.preventDefault();
          startTool("text");
          return;
        case "l":
          event.preventDefault();
          startTool("longShortPosition");
          return;
        case "p":
          event.preventDefault();
          if (event.shiftKey) {
            startTool("parallelChannel");
          } else {
            startTool("priceRange");
          }
          return;
        default:
          return;
      }
    },
    [
      activateCursor,
      activeDrawingTool,
      copySelectedLineTools,
      deleteSelectedTool,
      deselectAllLineTools,
      hasSelectedLineTools,
      nudgeSelectedLineTools,
      pasteCopiedLineTools,
      redoLineTools,
      startTool,
      undoLineTools,
    ],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.cursor = isDragging ? "grabbing" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [isDragging]);

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
        minimumWidth: PRICE_SCALE_GUTTER_PX,
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

    const lineTools = createLineToolsPlugin(chart, series) as LineToolsPluginRuntime;
    registerLinesPlugin(lineTools);
    registerFreehandPlugin(lineTools);
    registerFibRetracementPlugin(lineTools);
    registerTextPlugin(lineTools);
    registerTrianglePlugin(lineTools);
    registerParallelChannelPlugin(lineTools);
    registerPriceRangePlugin(lineTools);
    registerLongShortPositionPlugin(lineTools);
    lineTools.registerLineTool("Rectangle", LineToolRectangle);
    lineTools.registerLineTool("Circle", LineToolCircle);

    chartRef.current = chart;
    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series, []);
    lineToolsRef.current = lineTools;
    syncLineToolsState(lineTools);

    const handleVisibleRangeChange = () => {
      if (!applyingRangeRef.current && lastWindowKeyRef.current) {
        followReplayRef.current = false;
      }
    };

    const handleAfterEdit = (params: LineToolsAfterEditEventParams) => {
      const shouldPromptForText =
        params.stage === "lineToolFinished" &&
        params.selectedLineTool.toolType === "Text";

      if (
        params.stage === "lineToolFinished" ||
        params.stage === "pathFinished"
      ) {
        if (pendingToolTypeRef.current === "fibRetracement") {
          deselectAllLineTools(lineTools);
        }
        pendingToolIdRef.current = null;
        pendingToolTypeRef.current = null;
        onToolChange("cursor");
      }

      window.requestAnimationFrame(() => {
        finalizePendingTool(lineTools);
        if (shouldPromptForText) {
          promptForTextToolValue(
            params.selectedLineTool as {
              id: string;
              toolType: string;
              points: unknown[];
              options?: Record<string, unknown>;
            },
            "Text note",
            lineTools,
          );
        }
        commitLineToolsSnapshot(lineTools);
      });
    };

    const handleDoubleClick = (params: LineToolsDoubleClickEventParams) => {
      if (params.selectedLineTool.toolType !== "Text") {
        return;
      }

      promptForTextToolValue(
        params.selectedLineTool as {
          id: string;
          toolType: string;
          points: unknown[];
          options?: Record<string, unknown>;
        },
        "Edit text note",
        lineTools,
      );
    };

    const handleGlobalPointerUp = () => {
      window.requestAnimationFrame(() => {
        if (!finalizePendingTool(lineTools)) {
          window.requestAnimationFrame(() => finalizePendingTool(lineTools));
        }
        commitLineToolsSnapshot(lineTools);
      });
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    lineTools.subscribeLineToolsDoubleClick(handleDoubleClick);
    lineTools.subscribeLineToolsAfterEdit(handleAfterEdit);
    window.addEventListener("pointerup", handleGlobalPointerUp, true);

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
      window.removeEventListener("pointerup", handleGlobalPointerUp, true);
      lineTools.unsubscribeLineToolsDoubleClick(handleDoubleClick);
      lineTools.unsubscribeLineToolsAfterEdit(handleAfterEdit);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      if (resizeFrameRef.current !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current);
      }
      pendingToolIdRef.current = null;
      pendingToolTypeRef.current = null;
      setHasLineTools(false);
      setHasSelectedLineTools(false);
      lineToolsRef.current = null;
      markersRef.current = null;
      seriesRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, [
    commitLineToolsSnapshot,
    deselectAllLineTools,
    finalizePendingTool,
    instrument.pricePrecision,
    onToolChange,
    promptForTextToolValue,
    syncLineToolsState,
  ]);

  useEffect(() => {
    if (!lineToolsRef.current) {
      return;
    }

    pendingToolIdRef.current = null;
    pendingToolTypeRef.current = null;
    onToolChange("cursor");
    applyLineToolsSnapshot(loadPersistedLineToolsSnapshot(), { updateHistory: true });
  }, [
    applyLineToolsSnapshot,
    drawingStorageKey,
    loadPersistedLineToolsSnapshot,
    onToolChange,
  ]);

  useEffect(() => {
    window.addEventListener("keydown", handleShortcutKeyDown);
    return () => {
      window.removeEventListener("keydown", handleShortcutKeyDown);
    };
  }, [handleShortcutKeyDown]);

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
      pendingToolIdRef.current = null;
      pendingToolTypeRef.current = null;
      onToolChange("cursor");
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
  }, [chartCandles, markers, onToolChange, syncLineToolsState, windowKey]);

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
    const adjustedClientY = clientY - dragPointerOffsetRef.current;
    const y = Math.min(Math.max(adjustedClientY - rect.top, 0), rect.height);
    const price = series.coordinateToPrice(y);

    if (typeof price !== "number") {
      return;
    }

    onLineChange(field, roundToInstrument(price, instrument));
  }

  function stopDragging() {
    dragFieldRef.current = null;
    activePointerIdRef.current = null;
    dragStartClientYRef.current = null;
    dragPointerOffsetRef.current = 0;
    dragActivatedRef.current = false;
    setIsDragging(false);
  }

  function beginDragging(
    field: BacktestLineField,
    coordinate: number,
    clientY: number,
    pointerId: number,
    target: HTMLDivElement,
  ) {
    if (!canEditLines) {
      return;
    }

    dragFieldRef.current = field;
    activePointerIdRef.current = pointerId;
    dragStartClientYRef.current = clientY;
    dragPointerOffsetRef.current =
      clientY - (containerRef.current?.getBoundingClientRect().top ?? 0) - coordinate;
    dragActivatedRef.current = false;
    target.setPointerCapture(pointerId);
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="relative flex h-full min-h-[20rem] gap-1.5">
        <aside className="relative z-[100] flex h-full w-[2.5rem] shrink-0 flex-col py-1">
          <div className="pointer-events-none absolute bottom-1 right-0 top-1 w-px bg-white/8" />
          <div className="flex flex-1 flex-col gap-0.5">
              {TOOL_ITEMS.map((item, index) => {
                const Icon = item.icon;
                const active = activeDrawingTool === item.tool;
                const needsDivider =
                  item.tool === "cursor" ||
                  item.tool === "extendedLine" ||
                  item.tool === "parallelChannel" ||
                  item.tool === "longShortPosition";

                return (
                  <div className="relative" key={item.tool}>
                    <button
                      aria-label={item.label}
                      className={`group relative mx-auto flex h-8 w-8 items-center justify-center rounded-sm border border-transparent transition ${
                        active
                          ? "border-white/12 bg-[#0a0f14] text-slate-100"
                          : "text-slate-500 hover:bg-white/[0.025] hover:text-slate-200"
                      }`}
                      onClick={() => {
                        if (item.tool === "cursor") {
                          activateCursor();
                          return;
                        }

                        startTool(item.tool as Exclude<BacktestDrawingTool, "cursor">);
                      }}
                      title={
                        TOOL_SHORTCUTS[item.tool]
                          ? `${item.label} (${TOOL_SHORTCUTS[item.tool]})`
                          : item.label
                      }
                      type="button"
                    >
                      {active ? (
                        <span className="absolute -left-[5px] top-1/2 h-4 w-px -translate-y-1/2 bg-white/70" />
                      ) : null}
                      <Icon className="h-[15px] w-[15px]" strokeWidth={1.55} />
                      <span className="pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap bg-[#060a0f] px-2 py-1 text-[10px] font-medium text-slate-300 group-hover:block">
                        {item.label}
                        {TOOL_SHORTCUTS[item.tool] ? (
                          <span className="ml-2 text-slate-500">
                            {TOOL_SHORTCUTS[item.tool]}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    {needsDivider && index < TOOL_ITEMS.length - 1 ? (
                      <span className="pointer-events-none mx-auto my-1 block h-px w-3 bg-white/8" />
                    ) : null}
                  </div>
                );
              })}
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5 border-t border-white/8 pt-1">
              <button
                aria-label="Delete selected drawing"
                className="group relative mx-auto flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-slate-500 transition hover:bg-white/[0.025] hover:text-slate-200 disabled:opacity-35"
                disabled={!hasSelectedLineTools}
                onClick={deleteSelectedTool}
                title="Delete selected drawing (Delete / Backspace)"
                type="button"
              >
                <ToolDeleteIcon className="h-4 w-4" strokeWidth={1.5} />
                <span className="pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap bg-[#060a0f] px-2 py-1 text-[10px] font-medium text-slate-300 group-hover:block">
                  Delete selected
                  <span className="ml-2 text-slate-500">Del</span>
                </span>
              </button>
              <button
                aria-label="Clear drawings"
                className="group relative mx-auto flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-slate-500 transition hover:bg-white/[0.025] hover:text-slate-200 disabled:opacity-35"
                disabled={!hasLineTools}
                onClick={clearAllTools}
                title="Clear drawings"
                type="button"
              >
                <ToolClearIcon className="h-4 w-4" strokeWidth={1.5} />
                <span className="pointer-events-none absolute left-[calc(100%+0.55rem)] top-1/2 hidden -translate-y-1/2 whitespace-nowrap bg-[#060a0f] px-2 py-1 text-[10px] font-medium text-slate-300 group-hover:block">
                  Clear drawings
                </span>
              </button>
          </div>
        </aside>

        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#05090e]">
          <div className="h-full w-full" ref={containerRef} />

          {canEditLines && showTradeControls ? (
            <div className="absolute left-3 top-3 z-[95]">
              {hasTargetLine ? (
                <div className={TRADE_CONTROL_ACTIVE_CLASS}>
                  <span>TP</span>
                  <button
                    aria-label="Remove take profit"
                    className={TRADE_CONTROL_REMOVE_CLASS}
                    onClick={() => onRemoveOptionalLine("target")}
                    type="button"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button
                  className={TRADE_CONTROL_ADD_CLASS}
                  onClick={() => onAddOptionalLine("target")}
                  type="button"
                >
                  + TP
                </button>
              )}
            </div>
          ) : null}

          {canEditLines && showTradeControls ? (
            <div className="absolute bottom-16 left-3 z-[95]">
              {hasStopLine ? (
                <div className={TRADE_CONTROL_ACTIVE_CLASS}>
                  <span>SL</span>
                  <button
                    aria-label="Remove stop loss"
                    className={TRADE_CONTROL_REMOVE_CLASS}
                    onClick={() => onRemoveOptionalLine("stop")}
                    type="button"
                  >
                    X
                  </button>
                </div>
              ) : (
                <button
                  className={TRADE_CONTROL_ADD_CLASS}
                  onClick={() => onAddOptionalLine("stop")}
                  type="button"
                >
                  + SL
                </button>
              )}
            </div>
          ) : null}

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
                className={`pointer-events-auto absolute inset-x-0 z-[70] bg-transparent ${
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
                    coordinate,
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

                  const startClientY = dragStartClientYRef.current;
                  if (startClientY === null) {
                    return;
                  }

                  const distance = Math.abs(event.clientY - startClientY);
                  if (!dragActivatedRef.current) {
                    if (distance < LINE_DRAG_ACTIVATION_THRESHOLD_PX) {
                      return;
                    }

                    dragActivatedRef.current = true;
                    setIsDragging(true);
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
                  height: `${LINE_HIT_AREA_HEIGHT_PX}px`,
                  transform: "translateY(-50%)",
                  touchAction: "none",
                }}
              >
                <span
                  className="absolute inset-x-0 top-1/2 z-0 h-0.5 -translate-y-1/2"
                  style={{ backgroundColor: style.color }}
                />
                <span
                  className={`pointer-events-none absolute right-1.5 top-1/2 z-[80] inline-flex min-h-8 -translate-y-1/2 flex-col items-end justify-center rounded-sm border px-2 py-1 text-right shadow-[0_8px_18px_rgba(0,0,0,0.24)] transition ${style.pillClassName}`}
                >
                  <span className="text-[8px] font-semibold uppercase tracking-[0.08em] opacity-70">
                    {style.title}
                  </span>
                  <span className="mt-0.5 text-[10px] font-semibold">
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
    </div>
  );
}
