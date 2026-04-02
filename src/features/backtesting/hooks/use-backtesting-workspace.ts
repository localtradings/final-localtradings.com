"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  deleteBacktestSession,
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
  BacktestTradeDraft,
  BacktestTradeExecution,
} from "../types";
import {
  useBacktestingAccountPersistence,
  useBacktestingBalanceBroadcast,
} from "./use-backtesting-account-effects";
import { useBacktestingHistoryPersistence } from "./use-backtesting-history-persistence";
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
  manuallyCloseTrade,
  validateTradeDraft,
} from "../utils/trade-engine";
import {
  buildOrderAwareValidation,
  buildStatusNotice,
  createSettledExecutionKey,
  derivePrimaryValidation,
  formatPrice,
  getReplayLoadErrorMessage,
  isBacktestCandlesResponse,
  parseDraftPrice,
  parsePositiveNumber,
  removeSession,
  replaceDraftPrice,
  sanitizePositiveNumber,
  SESSION_LIMIT,
} from "../utils/workspace-helpers";

type UseBacktestingWorkspaceOptions = {
  initialAccount?: BacktestAccountState | null;
  initialSessions?: BacktestSessionRecord[];
  userId?: string | null;
};

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
  const [historySaveTick, setHistorySaveTick] = useState(0);

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
  const pendingSaveExecutionKeyRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef(new Date().toISOString());
  const resetCompletedTradeKeyRef = useRef<string | null>(null);

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
  const isExecutionLive =
    execution.status === "armed" || execution.status === "active";
  const canConfigureDraft = !isExecutionLive;
  const canAdjustActiveExitLines =
    execution.status === "armed" || execution.status === "active";
  const hasStop = isExecutionLive ? execution.stop !== null : tradeDraft.hasStop;
  const hasTarget = isExecutionLive ? execution.target !== null : tradeDraft.hasTarget;

  const lineValues = useMemo<BacktestLineValues>(() => {
    if (canConfigureDraft) {
      return {
        entry:
          tradeDraft.orderType === "market"
            ? null
            : parseDraftPrice(tradeDraft.entry),
        stop: hasStop ? parseDraftPrice(tradeDraft.stop) : null,
        target: hasTarget ? parseDraftPrice(tradeDraft.target) : null,
      };
    }

    return {
      entry: execution.entry,
      stop: execution.stop,
      target: execution.target,
    };
  }, [
    execution,
    canConfigureDraft,
    hasStop,
    hasTarget,
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

    if (
      execution.status === "active" &&
      execution.entry !== null &&
      currentCandle &&
      typeof execution.volume === "number"
    ) {
      const priceMove =
        draftRef.current.direction === "Long"
          ? currentCandle.close - execution.entry
          : execution.entry - currentCandle.close;

      return priceMove * execution.volume;
    }

    return null;
  }, [
    currentCandle,
    execution.entry,
    execution.resultAmount,
    execution.status,
    execution.volume,
  ]);

  const displayBalance = useMemo(() => {
    if (execution.status === "active" && typeof liveResultAmount === "number") {
      return account.currentBalance + liveResultAmount;
    }

    return account.currentBalance;
  }, [account.currentBalance, execution.status, liveResultAmount]);

  useBacktestingAccountPersistence({
    account,
    persistedAccountRef,
    userId: options.userId,
  });

  useBacktestingBalanceBroadcast({
    displayBalance,
    userId: options.userId,
  });

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
        resetCompletedTradeKeyRef.current = null;
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

  useBacktestingHistoryPersistence({
    datasetRef,
    draftRef,
    execution,
    historySaveTick,
    pendingSaveExecutionKeyRef,
    sessionStartedAtRef,
    setAccount,
    setHistorySaveTick,
    setNotice,
    setSessions,
    settledExecutionKeyRef,
  });

  useEffect(() => {
    if (!isTradeFinished) {
      return;
    }

    const executionKey = createSettledExecutionKey(execution);
    if (!executionKey || resetCompletedTradeKeyRef.current === executionKey) {
      return;
    }

    resetCompletedTradeKeyRef.current = executionKey;

    const instrument = datasetRef.current?.instrument ?? currentInstrument;
    const referencePrice =
      execution.exitPrice ??
      currentCandle?.close ??
      (typeof execution.entry === "number" ? execution.entry : instrument.basePrice);
    const resetDraft = buildTradeDraftFromPrice(
      instrument,
      selectionRef.current.timeframe,
      referencePrice,
      draftRef.current.direction,
      "market",
      draftRef.current.volume || defaultDraft.volume,
    );

    setTradeDraft({
      ...resetDraft,
      orderType: "market",
      hasStop: false,
      hasTarget: false,
      volume: draftRef.current.volume || defaultDraft.volume,
    });
    setExecution(createDraftExecution());
    setReplay((current) => ({ ...current, isPlaying: false }));
  }, [
    currentCandle?.close,
    currentInstrument,
    defaultDraft.volume,
    execution,
    isTradeFinished,
  ]);

  function togglePlayback() {
    if (!canStepForward) {
      return;
    }

    setReplay((current) => ({ ...current, isPlaying: !current.isPlaying }));
  }

  function updateDraftField(field: BacktestLineField, nextValue: string) {
    if (canConfigureDraft) {
      if (field === "entry" && draftRef.current.orderType === "market") {
        return;
      }

      setTradeDraft((current) => replaceDraftPrice(current, field, nextValue));
    }
  }

  function setLineValue(field: BacktestLineField, nextPrice: number) {
    if (canConfigureDraft) {
      if (field === "entry" && draftRef.current.orderType === "market") {
        return;
      }

      if (field === "stop" && !draftRef.current.hasStop) {
        return;
      }

      if (field === "target" && !draftRef.current.hasTarget) {
        return;
      }

      updateDraftField(field, nextPrice.toFixed(currentInstrument.pricePrecision));
      return;
    }

    if (!canAdjustActiveExitLines || field === "entry") {
      return;
    }

    setExecution((current) => {
      if (current.status !== "armed" && current.status !== "active") {
        return current;
      }

      if (field === "stop" && current.stop === null) {
        return current;
      }

      if (field === "target" && current.target === null) {
        return current;
      }

      return {
        ...current,
        [field]: nextPrice,
      };
    });
  }

  function updateOrderType(nextOrderType: BacktestOrderType) {
    setTradeDraft((current) => {
      const seededDraft = buildTradeDraftFromPrice(
        currentInstrument,
        selectionRef.current.timeframe,
        nextOrderType === "market"
          ? referenceEntryPrice
          : parseDraftPrice(current.entry) ?? referenceEntryPrice,
        current.direction,
        nextOrderType,
        current.volume,
      );

      return {
        ...current,
        orderType: nextOrderType,
        entry:
          nextOrderType === "market"
            ? formatPrice(referenceEntryPrice, currentInstrument)
            : parseDraftPrice(current.entry) !== null
              ? current.entry
              : seededDraft.entry,
        stop: current.hasStop ? current.stop : seededDraft.stop,
        target: current.hasTarget ? current.target : seededDraft.target,
      };
    });
  }

  function addDraftLine(field: Extract<BacktestLineField, "stop" | "target">) {
    if (canConfigureDraft) {
      setTradeDraft((current) => {
        if ((field === "stop" && current.hasStop) || (field === "target" && current.hasTarget)) {
          return current;
        }

        const seededDraft = buildTradeDraftFromPrice(
          currentInstrument,
          selectionRef.current.timeframe,
          current.orderType === "market"
            ? referenceEntryPrice
            : parseDraftPrice(current.entry) ?? referenceEntryPrice,
          current.direction,
          current.orderType,
          current.volume,
        );

        return field === "stop"
          ? {
              ...current,
              hasStop: true,
              stop: parseDraftPrice(current.stop) !== null ? current.stop : seededDraft.stop,
            }
          : {
              ...current,
              hasTarget: true,
              target:
                parseDraftPrice(current.target) !== null ? current.target : seededDraft.target,
            };
      });
      return;
    }

    if (!canAdjustActiveExitLines) {
      return;
    }

    setExecution((current) => {
      if (current.status !== "armed" && current.status !== "active") {
        return current;
      }

      if ((field === "stop" && current.stop !== null) || (field === "target" && current.target !== null)) {
        return current;
      }

      const seededDraft = buildTradeDraftFromPrice(
        currentInstrument,
        selectionRef.current.timeframe,
        current.entry ?? referenceEntryPrice,
        draftRef.current.direction,
        current.orderType ?? draftRef.current.orderType,
        draftRef.current.volume,
      );

      return field === "stop"
        ? {
            ...current,
            stop: parseDraftPrice(seededDraft.stop),
          }
        : {
            ...current,
            target: parseDraftPrice(seededDraft.target),
          };
    });
  }

  function removeDraftLine(field: Extract<BacktestLineField, "stop" | "target">) {
    if (canConfigureDraft) {
      setTradeDraft((current) =>
        field === "stop"
          ? { ...current, hasStop: false }
          : { ...current, hasTarget: false },
      );
      return;
    }

    if (!canAdjustActiveExitLines) {
      return;
    }

    setExecution((current) => {
      if (current.status !== "armed" && current.status !== "active") {
        return current;
      }

      return field === "stop"
        ? { ...current, stop: null }
        : { ...current, target: null };
    });
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
    if (!canConfigureDraft) {
      setNotice("Reset Setup is only available before a trade is active.");
      return;
    }

    const instrument = datasetRef.current?.instrument ?? currentInstrument;
    const referencePrice = currentCandle?.close ?? instrument.basePrice;
    const nextDraft = buildTradeDraftFromPrice(
      instrument,
      selectionRef.current.timeframe,
      referencePrice,
      draftRef.current.direction,
      draftRef.current.orderType,
      draftRef.current.volume,
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
    canArmBuy: canConfigureDraft && buyValidation.isValid && draftVolume !== null,
    canArmSell: canConfigureDraft && sellValidation.isValid && draftVolume !== null,
    canAdjustActiveExitLines,
    canConfigureDraft,
    canCloseTrade: execution.status === "active",
    canDragLines: canConfigureDraft,
    canManageTradeLines: canConfigureDraft || canAdjustActiveExitLines,
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
    addDraftLine,
    removeDraftLine,
    selectionDraft,
    sessions,
    hasStop,
    hasTarget,
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
