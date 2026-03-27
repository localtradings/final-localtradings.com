"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { saveBacktestAccount } from "@/server/backtesting/account-actions";
import {
  deleteBacktestSession,
  saveBacktestSession,
} from "@/server/backtesting/actions";

import {
  BACKTEST_INITIAL_REVEAL_COUNT,
  BACKTEST_INSTRUMENTS,
  BACKTEST_STATUS_LABELS,
  BACKTEST_TIMEFRAMES,
  DEFAULT_BACKTEST_ACCOUNT,
  DEFAULT_BACKTEST_SELECTION,
  getBacktestInstrument,
  getReplaySpeed,
} from "../constants";
import type {
  BacktestAccountState,
  BacktestCandlesResponse,
  BacktestDirection,
  BacktestLineField,
  BacktestLineValues,
  BacktestOrderType,
  BacktestSelection,
  BacktestSessionRecord,
  BacktestSessionStatus,
  BacktestTradeDraft,
  BacktestTradeExecution,
} from "../types";
import { createDefaultReplayState } from "../utils/session-state";
import {
  activateTradeExecution,
  advancePendingTradeExecution,
  advanceTradeExecution,
  armPendingTradeExecution,
  buildTradeDraftFromPrice,
  calculatePositionSize,
  calculateRiskFromVolume,
  createDraftExecution,
  deriveRiskSettings,
  finalizeUnfinishedTrade,
  formatPrice,
  manuallyCloseTrade,
  validateTradeDraft,
} from "../utils/trade-engine";

type UseBacktestingWorkspaceOptions = {
  initialAccount?: BacktestAccountState | null;
  initialSessions?: BacktestSessionRecord[];
  userId?: string | null;
};

const SESSION_LIMIT = 25;
const COMPLETED_HISTORY_STATUSES: BacktestSessionStatus[] = [
  "target_hit",
  "stop_hit",
  "manual_close",
  "breakeven",
];

function parseDraftPrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function replaceDraftPrice(
  draft: BacktestTradeDraft,
  field: BacktestLineField,
  value: string,
) {
  return {
    ...draft,
    [field]: value,
  };
}

function formatMoney(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function buildStatusNotice(
  status: BacktestTradeExecution["status"],
  resultAmount: number | null,
  options?: {
    direction?: BacktestDirection;
    entry?: number | null;
  },
) {
  const moneyLabel = formatMoney(resultAmount);

  if (status === "target_hit") {
    return moneyLabel ? `Target hit ${moneyLabel}. Replay paused.` : "Target hit. Replay paused.";
  }

  if (status === "stop_hit") {
    return moneyLabel ? `Stop hit ${moneyLabel}. Replay paused.` : "Stop hit. Replay paused.";
  }

  if (status === "unfinished") {
    return moneyLabel
      ? `Replay ended ${moneyLabel}. No history entry was saved.`
      : "Replay window ended before the trade resolved.";
  }

  if (status === "manual_close") {
    return moneyLabel ? `Trade closed ${moneyLabel}.` : "Trade closed.";
  }

  if (status === "breakeven") {
    return "Trade closed near breakeven.";
  }

  if (status === "armed") return "Pending order armed. Price must touch entry first.";
  if (status === "active") {
    const sideLabel =
      options?.direction === "Short"
        ? "Sold"
        : options?.direction === "Long"
          ? "Bought"
          : "Order filled";
    const entryLabel =
      typeof options?.entry === "number" ? ` @ ${options.entry}` : "";
    return `${sideLabel}${entryLabel}. TP and stop are now live.`;
  }

  return null;
}

function derivePrimaryValidation(
  preferredDirection: BacktestDirection,
  buyValidation: ReturnType<typeof validateTradeDraft>,
  sellValidation: ReturnType<typeof validateTradeDraft>,
) {
  if (preferredDirection === "Short") {
    return sellValidation.isValid ? sellValidation : buyValidation;
  }

  return buyValidation.isValid ? buyValidation : sellValidation;
}

function sanitizePositiveNumber(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildOrderAwareValidation(
  draft: BacktestTradeDraft,
  direction: BacktestDirection,
  marketEntryPrice: number | null,
  fallbackEntryPrice: number | null,
) {
  const entryPrice =
    draft.orderType === "market"
      ? marketEntryPrice ?? fallbackEntryPrice
      : parseDraftPrice(draft.entry);

  return validateTradeDraft({
    ...draft,
    direction,
    entry:
      typeof entryPrice === "number"
        ? entryPrice.toString()
        : draft.entry,
  });
}

function createBalanceKey(userId?: string | null) {
  return `backtesting-balance:${userId ?? "guest"}`;
}

function isBacktestCandlesResponse(
  value: unknown,
): value is BacktestCandlesResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<BacktestCandlesResponse>;
  return (
    Array.isArray(payload.candles) &&
    !!payload.instrument &&
    !!payload.selection &&
    typeof payload.selection.initialRevealCount === "number" &&
    typeof payload.selection.windowStartAt === "string"
  );
}

function getReplayLoadErrorMessage(status?: number) {
  if (status === 401) {
    return "Sign in again to keep backtesting.";
  }

  if (status === 503) {
    return "Backtesting is unavailable right now.";
  }

  if (status === 400) {
    return "Try loading a different chart.";
  }

  return "Unable to load a new chart right now.";
}

function mergeSessions(
  current: BacktestSessionRecord[],
  session: BacktestSessionRecord,
) {
  return [session, ...current.filter((item) => item.id !== session.id)]
    .sort(
      (left, right) =>
        new Date(right.finishedAt ?? right.startedAt).getTime() -
        new Date(left.finishedAt ?? left.startedAt).getTime(),
    )
    .slice(0, SESSION_LIMIT);
}

function removeSession(
  current: BacktestSessionRecord[],
  sessionId: string,
) {
  return current.filter((item) => item.id !== sessionId);
}

function createSettledExecutionKey(execution: BacktestTradeExecution) {
  if (
    execution.closedAtTime === null ||
    execution.status === "draft" ||
    execution.status === "armed" ||
    execution.status === "active"
  ) {
    return null;
  }

  return `${execution.status}:${execution.closedAtTime}:${execution.resultAmount ?? "na"}`;
}

export function useBacktestingWorkspace(
  options: UseBacktestingWorkspaceOptions = {},
) {
  const defaultInstrument = getBacktestInstrument(DEFAULT_BACKTEST_SELECTION.symbol);
  const baseDefaultDraft = buildTradeDraftFromPrice(
    defaultInstrument,
    DEFAULT_BACKTEST_SELECTION.timeframe,
    defaultInstrument.basePrice,
    "Long",
  );
  const defaultValidation = validateTradeDraft(baseDefaultDraft);
  const defaultRiskSettings = deriveRiskSettings(
    options.initialAccount ?? DEFAULT_BACKTEST_ACCOUNT,
    {
      riskPercent:
        (options.initialAccount ?? DEFAULT_BACKTEST_ACCOUNT).defaultRiskPercent,
    },
  );
  const defaultVolume = calculatePositionSize(
    defaultValidation,
    defaultRiskSettings.riskAmount,
  );
  const defaultDraft = {
    ...baseDefaultDraft,
    volume: defaultVolume ? defaultVolume.toFixed(2) : "1.00",
  };

  const [selectionDraft, setSelectionDraft] = useState<BacktestSelection>(
    DEFAULT_BACKTEST_SELECTION,
  );
  const [activeSelection, setActiveSelection] = useState<BacktestSelection>(
    DEFAULT_BACKTEST_SELECTION,
  );
  const [dataset, setDataset] = useState<BacktestCandlesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tradeDraft, setTradeDraft] = useState<BacktestTradeDraft>(defaultDraft);
  const [execution, setExecution] = useState<BacktestTradeExecution>(
    createDraftExecution(),
  );
  const [replay, setReplay] = useState(
    createDefaultReplayState(BACKTEST_INITIAL_REVEAL_COUNT),
  );
  const [account, setAccount] = useState<BacktestAccountState>(
    options.initialAccount ?? DEFAULT_BACKTEST_ACCOUNT,
  );
  const [sessions, setSessions] = useState<BacktestSessionRecord[]>(
    (options.initialSessions ?? []).slice(0, SESSION_LIMIT),
  );
  const [pendingSessionActionId, setPendingSessionActionId] = useState<string | null>(
    null,
  );

  const requestIdRef = useRef(0);
  const datasetRef = useRef<BacktestCandlesResponse | null>(null);
  const replayRef = useRef(replay);
  const executionRef = useRef(execution);
  const draftRef = useRef(tradeDraft);
  const selectionRef = useRef(activeSelection);
  const accountRef = useRef(account);
  const sessionsRef = useRef(sessions);
  const defaultVolumeRef = useRef(defaultDraft.volume);
  const persistedAccountRef = useRef<BacktestAccountState>(
    options.initialAccount ?? DEFAULT_BACKTEST_ACCOUNT,
  );
  const settledExecutionKeyRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef(new Date().toISOString());

  useEffect(() => {
    datasetRef.current = dataset;
  }, [dataset]);

  useEffect(() => {
    replayRef.current = replay;
  }, [replay]);

  useEffect(() => {
    executionRef.current = execution;
  }, [execution]);

  useEffect(() => {
    draftRef.current = tradeDraft;
  }, [tradeDraft]);

  useEffect(() => {
    selectionRef.current = activeSelection;
  }, [activeSelection]);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    if (!options.userId) {
      return;
    }

    if (
      account.startingBalance === persistedAccountRef.current.startingBalance &&
      account.currentBalance === persistedAccountRef.current.currentBalance &&
      account.defaultRiskPercent === persistedAccountRef.current.defaultRiskPercent
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveBacktestAccount(account);
      persistedAccountRef.current = account;
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [account, options.userId]);

  const currentInstrument = dataset?.instrument ?? getBacktestInstrument(activeSelection.symbol);
  const revealedCandles = useMemo(
    () =>
      dataset
        ? dataset.candles.slice(0, Math.min(replay.replayIndex + 1, dataset.candles.length))
        : [],
    [dataset, replay.replayIndex],
  );
  const currentCandle = revealedCandles.at(-1) ?? null;
  const referenceEntryPrice =
    currentCandle?.close ??
    revealedCandles.at(-1)?.close ??
    dataset?.candles[0]?.close ??
    currentInstrument.basePrice;
  const buyValidation = useMemo(
    () =>
      buildOrderAwareValidation(
        tradeDraft,
        "Long",
        currentCandle?.close ?? null,
        referenceEntryPrice,
      ),
    [currentCandle?.close, referenceEntryPrice, tradeDraft],
  );
  const sellValidation = useMemo(
    () =>
      buildOrderAwareValidation(
        tradeDraft,
        "Short",
        currentCandle?.close ?? null,
        referenceEntryPrice,
      ),
    [currentCandle?.close, referenceEntryPrice, tradeDraft],
  );
  const primaryValidation = useMemo(
    () => derivePrimaryValidation(tradeDraft.direction, buyValidation, sellValidation),
    [buyValidation, sellValidation, tradeDraft.direction],
  );
  const statusLabel = BACKTEST_STATUS_LABELS[execution.status];
  const canStepForward = Boolean(dataset && replay.replayIndex < dataset.candles.length - 1);
  const isTradeFinished =
    execution.status === "target_hit" ||
    execution.status === "stop_hit" ||
    execution.status === "unfinished" ||
    execution.status === "manual_close" ||
    execution.status === "breakeven";

  const lineValues = useMemo<BacktestLineValues>(() => {
    if (execution.status === "draft") {
      const draftEntry =
        tradeDraft.orderType === "market"
          ? referenceEntryPrice
          : parseDraftPrice(tradeDraft.entry);
      return {
        entry: draftEntry,
        stop: parseDraftPrice(tradeDraft.stop),
        target: parseDraftPrice(tradeDraft.target),
      };
    }

    return {
      entry: execution.entry,
      stop: execution.stop,
      target: execution.target,
    };
  }, [
    execution,
    referenceEntryPrice,
    tradeDraft.entry,
    tradeDraft.orderType,
    tradeDraft.stop,
    tradeDraft.target,
  ]);

  const draftVolume = useMemo(
    () => parsePositiveNumber(tradeDraft.volume),
    [tradeDraft.volume],
  );

  const riskSettings = useMemo(
    () =>
      calculateRiskFromVolume(
        primaryValidation,
        draftVolume ?? Number.NaN,
        account.currentBalance,
      ),
    [account.currentBalance, draftVolume, primaryValidation],
  );

  const liveResultR = useMemo(() => {
    if (
      execution.status !== "active" ||
      execution.entry === null ||
      execution.stop === null ||
      !currentCandle
    ) {
      return execution.resultR;
    }

    const risk = Math.abs(execution.entry - execution.stop);
    if (risk === 0) {
      return execution.resultR;
    }

    const priceMove =
      draftRef.current.direction === "Long"
        ? currentCandle.close - execution.entry
        : execution.entry - currentCandle.close;

    return priceMove / risk;
  }, [currentCandle, execution]);

  const liveResultAmount = useMemo(() => {
    if (typeof execution.resultAmount === "number") {
      return execution.resultAmount;
    }

    if (typeof liveResultR === "number" && typeof execution.riskAmount === "number") {
      return liveResultR * execution.riskAmount;
    }

    return null;
  }, [execution.resultAmount, execution.riskAmount, liveResultR]);

  const displayBalance = useMemo(() => {
    if (execution.status === "active" && typeof liveResultAmount === "number") {
      return account.currentBalance + liveResultAmount;
    }

    return account.currentBalance;
  }, [account.currentBalance, execution.status, liveResultAmount]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = createBalanceKey(options.userId);
    window.localStorage.setItem(key, displayBalance.toString());
    window.dispatchEvent(
      new CustomEvent("backtesting:balance", {
        detail: {
          key,
          balance: displayBalance,
        },
      }),
    );
  }, [displayBalance, options.userId]);

  const loadRandomWindow = useCallback(
    async (selection: BacktestSelection) => {
      setIsLoading(true);
      setLoadError(null);
      setNotice(null);
      setReplay((current) => ({ ...current, isPlaying: false }));

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        const params = new URLSearchParams({
          symbol: selection.symbol,
          timeframe: selection.timeframe,
        });

        const response = await fetch(`/api/backtesting/candles?${params.toString()}`, {
          cache: "no-store",
        });
        let payload: unknown = null;

        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(getReplayLoadErrorMessage(response.status));
        }

        if (requestIdRef.current !== requestId) {
          return;
        }

        if (!isBacktestCandlesResponse(payload)) {
          throw new Error("Unable to load a new chart right now.");
        }

        const data = payload;
        const anchorCandle =
          data.candles[Math.max(0, data.selection.initialRevealCount - 1)] ??
          data.candles.at(-1);

        if (!anchorCandle) {
          throw new Error("Unable to load a new chart right now.");
        }

        const nextDraft = buildTradeDraftFromPrice(
          data.instrument,
          selection.timeframe,
          anchorCandle.close,
          "Long",
        );
        const nextValidation = validateTradeDraft(nextDraft);
        const seededRisk = deriveRiskSettings(accountRef.current, {
          riskPercent: accountRef.current.defaultRiskPercent,
        });
        const seededVolume = calculatePositionSize(nextValidation, seededRisk.riskAmount);
        const hydratedDraft = {
          ...nextDraft,
          volume: seededVolume ? seededVolume.toFixed(2) : defaultVolumeRef.current,
        };

        settledExecutionKeyRef.current = null;
        sessionStartedAtRef.current = new Date().toISOString();
        setDataset(data);
        setSelectionDraft(selection);
        setActiveSelection(selection);
        setTradeDraft(hydratedDraft);
        setExecution(createDraftExecution());
        setReplay({
          replayIndex: Math.max(data.selection.initialRevealCount - 1, 0),
          isPlaying: false,
          speedId: replayRef.current.speedId,
        });

      } catch (error) {
        setLoadError(
          error instanceof Error && error.message
            ? error.message
            : "Unable to load a new chart right now.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadRandomWindow(DEFAULT_BACKTEST_SELECTION);
  }, [loadRandomWindow]);

  const stepReplayForward = useCallback(() => {
    const activeDataset = datasetRef.current;
    const replayState = replayRef.current;
    const executionState = executionRef.current;
    const direction = draftRef.current.direction;

    if (!activeDataset) {
      return;
    }

    if (replayState.replayIndex >= activeDataset.candles.length - 1) {
      setReplay((current) => ({ ...current, isPlaying: false }));
      return;
    }

    const nextIndex = replayState.replayIndex + 1;
    const nextCandle = activeDataset.candles[nextIndex];
    let nextExecution = executionState;

    if (executionState.status === "armed") {
      nextExecution = advancePendingTradeExecution(
        executionState,
        nextCandle,
        nextIndex,
        direction,
      );
    } else {
      nextExecution = advanceTradeExecution(
        executionState,
        nextCandle,
        nextIndex,
        direction,
      );
    }

    if (nextIndex === activeDataset.candles.length - 1) {
      nextExecution = finalizeUnfinishedTrade(
        nextExecution,
        nextCandle,
        nextIndex,
        direction,
      );
    }

    const shouldPause =
      nextExecution.status === "target_hit" ||
      nextExecution.status === "stop_hit" ||
      nextExecution.status === "unfinished";
    const statusChanged = executionState.status !== nextExecution.status;

    setExecution(nextExecution);
    setReplay((current) => ({
      ...current,
      replayIndex: nextIndex,
      isPlaying:
        nextIndex < activeDataset.candles.length - 1 &&
        current.isPlaying &&
        !shouldPause,
    }));

    if (statusChanged) {
      const nextNotice = buildStatusNotice(
        nextExecution.status,
        nextExecution.resultAmount,
        {
          direction,
          entry: nextExecution.entry,
        },
      );
      if (nextNotice) {
        setNotice(nextNotice);
      }
    }
  }, []);

  useEffect(() => {
    if (!dataset || !replay.isPlaying) {
      return;
    }

    const timeout = window.setTimeout(
      () => stepReplayForward(),
      getReplaySpeed(replay.speedId).intervalMs,
    );

    return () => window.clearTimeout(timeout);
  }, [dataset, replay.isPlaying, replay.replayIndex, replay.speedId, stepReplayForward]);

  useEffect(() => {
    if (!isTradeFinished || execution.closedAtTime === null) {
      return;
    }

    const executionKey = createSettledExecutionKey(execution);
    if (!executionKey || settledExecutionKeyRef.current === executionKey) {
      return;
    }

    settledExecutionKeyRef.current = executionKey;

    const isCompletedHistoryStatus = COMPLETED_HISTORY_STATUSES.includes(execution.status);

    if (isCompletedHistoryStatus && typeof execution.balanceAfterTrade === "number") {
      setAccount((current) => ({
        ...current,
        currentBalance: execution.balanceAfterTrade ?? current.currentBalance,
      }));
    }

    if (!isCompletedHistoryStatus || !datasetRef.current) {
      return;
    }

    const closedAtTime = execution.closedAtTime;
    if (closedAtTime === null) {
      return;
    }

    const snapshot = {
      replay: {
        ...replayRef.current,
        isPlaying: false,
      },
      tradeDraft: draftRef.current,
      execution,
    };

    void (async () => {
      const result = await saveBacktestSession({
        symbol: datasetRef.current?.selection.symbol ?? selectionRef.current.symbol,
        timeframe: datasetRef.current?.selection.timeframe ?? selectionRef.current.timeframe,
        windowStartAt: datasetRef.current?.selection.windowStartAt ?? new Date().toISOString(),
        barsRequested:
          datasetRef.current?.selection.barsRequested ?? BACKTEST_INITIAL_REVEAL_COUNT,
        direction: draftRef.current.direction,
        entry: execution.entry,
        stop: execution.stop,
        target: execution.target,
        status: execution.status,
        resultR: execution.resultR,
        startedAt: sessionStartedAtRef.current,
        finishedAt: new Date(closedAtTime * 1000).toISOString(),
        thesis: "",
        reviewNotes: "",
        sessionStateJson: snapshot,
      });

      if (result.ok) {
        setSessions((current) => mergeSessions(current, result.session));
      } else {
        setNotice("Trade completed, but history could not be saved.");
      }
    })();
  }, [execution, isTradeFinished]);

  function togglePlayback() {
    if (!canStepForward) {
      return;
    }

    setReplay((current) => ({ ...current, isPlaying: !current.isPlaying }));
  }

  function updateDraftField(field: BacktestLineField, nextValue: string) {
    if (executionRef.current.status !== "draft") {
      return;
    }

    if (field === "entry" && draftRef.current.orderType === "market") {
      return;
    }

    setTradeDraft((current) => replaceDraftPrice(current, field, nextValue));
  }

  function setLineValue(field: BacktestLineField, nextPrice: number) {
    if (executionRef.current.status !== "draft") {
      return;
    }

    if (field === "entry" && draftRef.current.orderType === "market") {
      return;
    }

    updateDraftField(field, nextPrice.toFixed(currentInstrument.pricePrecision));
  }

  function updateOrderType(nextOrderType: BacktestOrderType) {
    setTradeDraft((current) => ({
      ...current,
      orderType: nextOrderType,
      entry:
        nextOrderType === "market"
          ? formatPrice(referenceEntryPrice, currentInstrument)
          : current.entry,
    }));
  }

  function updateVolume(nextValue: number) {
    const safeValue = sanitizePositiveNumber(nextValue, draftVolume ?? 1);
    setTradeDraft((current) => ({
      ...current,
      volume: safeValue.toFixed(2),
    }));
  }

  function updateStartingBalance(nextValue: number) {
    const safeValue = sanitizePositiveNumber(
      nextValue,
      DEFAULT_BACKTEST_ACCOUNT.startingBalance,
    );

    setAccount((current) => ({
      ...current,
      startingBalance: safeValue,
    }));
  }

  function resetAccountBalance() {
    if (
      executionRef.current.status === "armed" ||
      executionRef.current.status === "active"
    ) {
      setNotice("Close or cancel the current trade before resetting the balance.");
      return;
    }

    setAccount((current) => ({
      ...current,
      currentBalance: current.startingBalance,
    }));
    setNotice("Balance reset to the starting amount.");
  }

  function armPendingOrder(direction: BacktestDirection) {
    const validation = direction === "Long" ? buyValidation : sellValidation;
    const nextOrderType = draftRef.current.orderType;
    const volume = draftVolume;

    if (!validation.isValid) {
      setNotice(validation.message ?? "Move the lines into a valid setup first.");
      return;
    }

    if (!volume) {
      setNotice("Enter a valid volume first.");
      return;
    }

    if (
      typeof riskSettings.riskAmount !== "number" ||
      typeof riskSettings.riskPercent !== "number"
    ) {
      setNotice("Move the lines into a valid setup first.");
      return;
    }

    setTradeDraft((current) => ({
      ...current,
      direction,
      entry:
        nextOrderType === "market"
          ? formatPrice(referenceEntryPrice, currentInstrument)
          : current.entry,
    }));

    sessionStartedAtRef.current = new Date().toISOString();

    if (nextOrderType === "market") {
      const activeDataset = datasetRef.current;
      const activeReplay = replayRef.current;
      const fillCandle =
        activeDataset?.candles[activeReplay.replayIndex] ?? currentCandle;

      if (!fillCandle) {
        setNotice("No visible candle is available to fill the market order.");
        return;
      }

      const marketValidation = buildOrderAwareValidation(
        {
          ...draftRef.current,
          direction,
          orderType: "market",
          entry: formatPrice(fillCandle.close, currentInstrument),
        },
        direction,
        fillCandle.close,
        fillCandle.close,
      );

      if (!marketValidation.isValid) {
        setNotice(
          marketValidation.message ?? "Move stop and target into a valid setup first.",
        );
        return;
      }

      setExecution(
        activateTradeExecution(
          marketValidation,
          activeReplay.replayIndex,
          fillCandle.time,
          {
            orderType: "market",
            riskPercent: riskSettings.riskPercent,
            riskAmount: riskSettings.riskAmount,
            volume,
            balanceBeforeTrade: account.currentBalance,
          },
        ),
      );
      setNotice(
        buildStatusNotice("active", null, {
          direction,
          entry: marketValidation.entry,
        }),
      );
      return;
    }

    setExecution(
      armPendingTradeExecution(validation, {
        orderType: nextOrderType,
        riskPercent: riskSettings.riskPercent,
        riskAmount: riskSettings.riskAmount,
        volume,
        balanceBeforeTrade: account.currentBalance,
      }),
    );
    setNotice(buildStatusNotice("armed", null));
  }

  function closeTrade() {
    const activeDataset = datasetRef.current;
    const replayState = replayRef.current;
    const visibleCandle =
      activeDataset?.candles[replayState.replayIndex] ?? currentCandle;

    if (!visibleCandle) {
      setNotice("No candle is visible to close this trade.");
      return;
    }

    const nextExecution = manuallyCloseTrade(
      executionRef.current,
      visibleCandle,
      replayState.replayIndex,
      draftRef.current.direction,
    );

    setExecution(nextExecution);
    setReplay((current) => ({ ...current, isPlaying: false }));
    setNotice(buildStatusNotice(nextExecution.status, nextExecution.resultAmount));
  }

  function resetTradeLines() {
    if (executionRef.current.status !== "draft") {
      setNotice("Reset Setup is only available before a trade is active.");
      return;
    }

    const instrument = datasetRef.current?.instrument ?? currentInstrument;
    const referencePrice = currentCandle?.close ?? instrument.basePrice;
    const nextDraft = buildTradeDraftFromPrice(
      instrument,
      selectionRef.current.timeframe,
      referencePrice,
      "Long",
    );
    const nextValidation = validateTradeDraft(nextDraft);
    const seededRisk = deriveRiskSettings(account, {
      riskPercent: account.defaultRiskPercent,
    });
    const seededVolume = calculatePositionSize(nextValidation, seededRisk.riskAmount);

    settledExecutionKeyRef.current = null;
    setTradeDraft({
      ...nextDraft,
      volume: seededVolume ? seededVolume.toFixed(2) : defaultDraft.volume,
    });
    setExecution(createDraftExecution());
    setNotice("Lines reset around the current price.");
  }

  function randomizeWindow() {
    void loadRandomWindow(selectionDraft);
  }

  function updateSelectionField(field: keyof BacktestSelection, value: string) {
    setSelectionDraft((current) => ({ ...current, [field]: value }));
  }

  async function removeSavedSession(sessionId: string) {
    setPendingSessionActionId(sessionId);
    const result = await deleteBacktestSession(sessionId);

    if (!result.ok) {
      setPendingSessionActionId(null);
      setNotice("Unable to delete that session right now.");
      return;
    }

    const nextSessions = removeSession(sessionsRef.current, sessionId);
    setSessions(nextSessions);

    setPendingSessionActionId(null);
    setNotice("History item deleted.");
  }

  return {
    account,
    activeSelection,
    activeWindowStartAt: dataset?.selection.windowStartAt ?? null,
    canArmBuy: execution.status === "draft" && buyValidation.isValid,
    canArmSell: execution.status === "draft" && sellValidation.isValid,
    canCloseTrade: execution.status === "active",
    canDragLines: execution.status === "draft",
    canStepForward,
    currentCandle,
    currentInstrument,
    dataset,
    draftVolume,
    execution,
    initialCatalog: {
      instruments: BACKTEST_INSTRUMENTS,
      timeframes: BACKTEST_TIMEFRAMES,
    },
    isLoading,
    isTradeFinished,
    lineValues,
    liveResultAmount,
    liveResultR,
    loadError,
    notice,
    orderType: tradeDraft.orderType,
    pendingSessionActionId,
    primaryValidation,
    displayBalance,
    randomizeWindow,
    replay,
    resetAccountBalance,
    resetTradeLines,
    revealedCandles,
    riskSettings,
    selectionDraft,
    sessions,
    setLineValue,
    setReplay,
    stagedSelectionChanged:
      selectionDraft.symbol !== activeSelection.symbol ||
      selectionDraft.timeframe !== activeSelection.timeframe,
    statusLabel,
    stepReplayForward,
    togglePlayback,
    tradeDraft,
    updateDraftField,
    updateOrderType,
    updateSelectionField,
    updateStartingBalance,
    updateVolume,
    armBuy: () => armPendingOrder("Long"),
    armSell: () => armPendingOrder("Short"),
    closeTrade,
    deleteSession: removeSavedSession,
    windowKey:
      dataset?.selection.windowStartAt ??
      `${activeSelection.symbol}:${activeSelection.timeframe}`,
  };
}
