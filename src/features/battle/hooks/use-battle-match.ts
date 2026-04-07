"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  BATTLE_DEFAULT_RISK_PERCENT,
  BATTLE_REPLAY_BATCH_INTERVAL_MS,
  BATTLE_REPLAY_BATCH_STEP_COUNT,
  BATTLE_REPLAY_INTERVAL_MS,
  BATTLE_REPLAY_RESOLUTION_SYNC_MS,
} from "@/features/battle/constants";
import type { BattleRoomSession, BattleRoomView, BattleTradeForm } from "@/features/battle/types";
import { getBacktestInstrument } from "@/features/backtesting/constants";
import type {
  BacktestDirection,
  BacktestLineField,
  BacktestLineValues,
  BacktestTimeframe,
  BacktestTradeExecution,
  BacktestTradeDraft,
} from "@/features/backtesting/types";
import {
  advancePendingTradeExecution,
  advanceTradeExecution,
  buildTradeDraftFromPrice,
  calculatePositionSizeFromNotional,
  createDraftExecution,
  deriveRiskSettings,
  finalizeUnfinishedTrade,
} from "@/features/trading-shared/execution-engine";
import {
  buildOrderAwareValidation,
  derivePrimaryValidation,
  parseDraftPrice,
  parsePositiveNumber,
} from "@/features/backtesting/utils/workspace-helpers";
import {
  closeBattleTradeAction,
  openBattleTradeAction,
  syncBattleReplayAction,
} from "@/server/battle/actions";

import { useBattleRoomSync } from "./use-battle-room-sync";

function formatRiskPercent(value: number) {
  return value.toFixed(2);
}

function seedBattleTradeForm(input: {
  symbol: string;
  timeframe: BacktestTimeframe | null;
  referencePrice: number;
  direction?: BacktestDirection;
  orderType?: BattleTradeForm["orderType"];
  riskPercent?: string;
}): BattleTradeForm {
  const instrument = getBacktestInstrument(input.symbol);
  const baseDraft = buildTradeDraftFromPrice(
    instrument,
    input.timeframe ?? "15min",
    input.referencePrice,
    input.direction ?? "Long",
    input.orderType ?? "market",
  );

  return {
    direction: baseDraft.direction,
    orderType: baseDraft.orderType,
    entry: baseDraft.entry,
    hasStop: false,
    stop: baseDraft.stop,
    hasTarget: false,
    target: baseDraft.target,
    riskPercent: input.riskPercent ?? formatRiskPercent(BATTLE_DEFAULT_RISK_PERCENT),
  };
}

function buildDraftFromRoom(session: BattleRoomSession["initialView"]) {
  const symbol = session?.room.symbol ?? "XAUUSD";
  const timeframe = session?.room.timeframe ?? "15min";
  const referencePrice =
    session?.room.candles[session.self.replayIndex]?.close ??
    session?.room.candles.at(-1)?.close ??
    getBacktestInstrument(symbol).basePrice;

  return seedBattleTradeForm({
    symbol,
    timeframe,
    referencePrice,
  });
}

function toValidationDraft(draft: BattleTradeForm): BacktestTradeDraft {
  return {
    direction: draft.direction,
    orderType: draft.orderType,
    entry: draft.entry,
    hasStop: draft.hasStop,
    stop: draft.stop,
    hasTarget: draft.hasTarget,
    target: draft.target,
    volume: "",
  };
}

function deriveLocalExecutionView(input: {
  roomView: BattleRoomView | null;
  localReplayIndex: number;
}): BacktestTradeExecution | null {
  const roomView = input.roomView;
  const authoritativeExecution = roomView?.self.execution ?? null;
  if (!roomView || !authoritativeExecution) {
    return null;
  }

  const baseExecution: BacktestTradeExecution = {
    status: authoritativeExecution.status,
    orderType: authoritativeExecution.orderType,
    entry: authoritativeExecution.entry,
    stop: authoritativeExecution.stop,
    target: authoritativeExecution.target,
    riskPercent: authoritativeExecution.riskPercent,
    riskAmount: authoritativeExecution.riskAmount,
    volume: authoritativeExecution.volume,
    balanceBeforeTrade: null,
    openedAtIndex: authoritativeExecution.openedAtIndex,
    openedAtTime: authoritativeExecution.openedAtTime,
    closedAtIndex: authoritativeExecution.closedAtIndex,
    closedAtTime: authoritativeExecution.closedAtTime,
    exitPrice: authoritativeExecution.exitPrice,
    resultR: authoritativeExecution.resultR,
    resultAmount: authoritativeExecution.resultAmount,
    balanceAfterTrade: authoritativeExecution.balanceAfterTrade,
    maxFavorableR: null,
    maxAdverseR: null,
    durationBars: null,
  };

  if (
    authoritativeExecution.status !== "armed" &&
    authoritativeExecution.status !== "active"
  ) {
    return baseExecution;
  }

  let nextExecution: BacktestTradeExecution = baseExecution;
  const startIndex = roomView.self.replayIndex + 1;
  const endIndex = Math.min(input.localReplayIndex, roomView.room.candles.length - 1);

  for (let replayIndex = startIndex; replayIndex <= endIndex; replayIndex += 1) {
    const candle = roomView.room.candles[replayIndex];
    if (!candle) {
      break;
    }

    if (nextExecution.status === "armed") {
      nextExecution = advancePendingTradeExecution(
        nextExecution,
        candle,
        replayIndex,
        authoritativeExecution.direction,
      );
      continue;
    }

    if (nextExecution.status === "active") {
      nextExecution = advanceTradeExecution(
        nextExecution,
        candle,
        replayIndex,
        authoritativeExecution.direction,
      );
    }
  }

  if (
    roomView.room.phase === "finished" &&
    nextExecution.status === "active" &&
    roomView.room.candles.length > 0
  ) {
    const finalIndex = roomView.room.candles.length - 1;
    nextExecution = finalizeUnfinishedTrade(
      nextExecution,
      roomView.room.candles[finalIndex],
      finalIndex,
      authoritativeExecution.direction,
    );
  }

  return nextExecution;
}

export function useBattleMatch(session: BattleRoomSession) {
  const { roomView, setRoomView, error, setError, hasBootstrapped } = useBattleRoomSync(session);
  const [isActionPending, setIsActionPending] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [localReplayIndex, setLocalReplayIndex] = useState(
    session.initialView?.self.replayIndex ?? 0,
  );
  const [tradeDraft, setTradeDraft] = useState<BattleTradeForm>(() =>
    buildDraftFromRoom(session.initialView),
  );
  const roomViewRef = useRef(roomView);
  const localReplayIndexRef = useRef(localReplayIndex);
  const lastReplayFlushAtRef = useRef(Date.now());
  const replayFlushPromiseRef = useRef<Promise<BattleRoomView | null> | null>(null);
  const prevExecutionStatusRef = useRef<string | null>(
    session.initialView?.self.execution?.status ?? null,
  );

  useEffect(() => {
    roomViewRef.current = roomView;
  }, [roomView]);

  useEffect(() => {
    localReplayIndexRef.current = localReplayIndex;
  }, [localReplayIndex]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
    });
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const currentInstrument = useMemo(
    () => getBacktestInstrument(roomView?.room.symbol ?? "XAUUSD"),
    [roomView?.room.symbol],
  );
  const currentCandle = roomView?.room.candles[localReplayIndex] ?? null;
  const referenceEntryPrice =
    currentCandle?.close ??
    roomView?.room.candles.at(-1)?.close ??
    currentInstrument.basePrice;
  const authoritativeExecution = roomView?.self.execution ?? null;
  const activeExecution = useMemo(
    () => deriveLocalExecutionView({ roomView, localReplayIndex }),
    [localReplayIndex, roomView],
  );
  const isLocked =
    roomView?.self.lockReason !== null ||
    roomView?.room.phase !== "active" ||
    roomView?.self.participationStatus === "eliminated";
  const canConfigureDraft =
    !isLocked &&
    (!activeExecution ||
      (activeExecution.status !== "armed" && activeExecution.status !== "active"));
  const canStepForward =
    !isLocked &&
    localReplayIndex < (roomView?.room.candles.length ?? 0) - 1;

  useEffect(() => {
    if (!roomView) {
      return;
    }

    const authoritativeReplayIndex = roomView.self.replayIndex;
    if (
      authoritativeReplayIndex >= localReplayIndexRef.current ||
      localReplayIndexRef.current > roomView.room.candles.length - 1
    ) {
      setLocalReplayIndex(authoritativeReplayIndex);
      lastReplayFlushAtRef.current = Date.now();
    }
  }, [roomView]);

  useEffect(() => {
    if (!roomView) {
      return;
    }

    const currentStatus = roomView.self.execution?.status ?? null;
    const previousStatus = prevExecutionStatusRef.current;
    prevExecutionStatusRef.current = currentStatus;

    const shouldSeedDraft =
      !roomView.self.execution &&
      (previousStatus === "armed" ||
        previousStatus === "active" ||
        previousStatus === "manual_close" ||
        previousStatus === "stop_hit" ||
        previousStatus === "target_hit" ||
        previousStatus === "breakeven" ||
        previousStatus === "unfinished");

    if (!shouldSeedDraft) {
      return;
    }

    setTradeDraft((current) =>
      seedBattleTradeForm({
        symbol: roomView.room.symbol ?? "XAUUSD",
        timeframe: roomView.room.timeframe ?? "15min",
        referencePrice: referenceEntryPrice,
        direction: current.direction,
        orderType: "market",
        riskPercent: current.riskPercent,
      }),
    );
  }, [referenceEntryPrice, roomView]);

  const flushReplayCheckpoint = useCallback(async () => {
    const activeRoomView = roomViewRef.current;
    if (!activeRoomView) {
      return null;
    }

    const authoritativeReplayIndex = activeRoomView.self.replayIndex;
    const targetReplayIndex = localReplayIndexRef.current;

    if (targetReplayIndex <= authoritativeReplayIndex) {
      lastReplayFlushAtRef.current = Date.now();
      return activeRoomView;
    }

    if (replayFlushPromiseRef.current) {
      return replayFlushPromiseRef.current;
    }

    const flushPromise = (async () => {
      const result = await syncBattleReplayAction({
        roomId: activeRoomView.room.roomId,
        replayIndex: targetReplayIndex,
      });

      if (result.ok) {
        setRoomView(result.room);
        setError(null);
        lastReplayFlushAtRef.current = Date.now();
        return result.room;
      }

      if (result.room) {
        setRoomView(result.room);
        setLocalReplayIndex(result.room.self.replayIndex);
      } else {
        setLocalReplayIndex(authoritativeReplayIndex);
      }

      setIsPlaying(false);
      setError(result.message);
      return result.room ?? activeRoomView;
    })();

    replayFlushPromiseRef.current = flushPromise;
    try {
      return await flushPromise;
    } finally {
      replayFlushPromiseRef.current = null;
    }
  }, [setError, setRoomView]);

  useEffect(() => {
    if (!roomView || !isPlaying || isActionPending || !canStepForward) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setLocalReplayIndex((current) => Math.min(current + 1, roomView.room.candles.length - 1));
    }, BATTLE_REPLAY_INTERVAL_MS);

    return () => window.clearTimeout(timeout);
  }, [canStepForward, isActionPending, isPlaying, roomView]);

  useEffect(() => {
    if (!roomView || isActionPending || isLocked) {
      return;
    }

    const delta = localReplayIndex - roomView.self.replayIndex;
    if (delta <= 0) {
      return;
    }

    const elapsedSinceLastFlushMs = Date.now() - lastReplayFlushAtRef.current;
    const localExecutionRequiresSync =
      activeExecution?.status === "armed" ||
      activeExecution?.status === "active" ||
      (authoritativeExecution !== null &&
        activeExecution !== null &&
        activeExecution.status !== authoritativeExecution.status);
    const resolvedLocally =
      activeExecution !== null &&
      activeExecution.status !== "armed" &&
      activeExecution.status !== "active";

    const shouldFlushReplay =
      !isPlaying ||
      (localExecutionRequiresSync &&
        (delta >= BATTLE_REPLAY_BATCH_STEP_COUNT ||
          elapsedSinceLastFlushMs >= BATTLE_REPLAY_BATCH_INTERVAL_MS)) ||
      (resolvedLocally && elapsedSinceLastFlushMs >= BATTLE_REPLAY_RESOLUTION_SYNC_MS);

    if (shouldFlushReplay) {
      void flushReplayCheckpoint();
    }
  }, [
    activeExecution,
    authoritativeExecution,
    flushReplayCheckpoint,
    isActionPending,
    isLocked,
    isPlaying,
    localReplayIndex,
    roomView,
  ]);

  useEffect(() => {
    if (!canStepForward) {
      setIsPlaying(false);
    }
  }, [canStepForward]);

  useEffect(() => {
    if (!roomView) {
      return;
    }

    const flushIfNeeded = () => {
      if (localReplayIndexRef.current > (roomViewRef.current?.self.replayIndex ?? 0)) {
        void flushReplayCheckpoint();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushIfNeeded();
      }
    };

    window.addEventListener("pagehide", flushIfNeeded);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushIfNeeded);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [flushReplayCheckpoint, roomView]);

  const validationDraft = useMemo(() => toValidationDraft(tradeDraft), [tradeDraft]);
  const buyValidation = useMemo(
    () =>
      buildOrderAwareValidation(
        validationDraft,
        "Long",
        currentCandle?.close ?? null,
        referenceEntryPrice,
      ),
    [currentCandle?.close, referenceEntryPrice, validationDraft],
  );
  const sellValidation = useMemo(
    () =>
      buildOrderAwareValidation(
        validationDraft,
        "Short",
        currentCandle?.close ?? null,
        referenceEntryPrice,
      ),
    [currentCandle?.close, referenceEntryPrice, validationDraft],
  );
  const primaryValidation = useMemo(
    () => derivePrimaryValidation(tradeDraft.direction, buyValidation, sellValidation),
    [buyValidation, sellValidation, tradeDraft.direction],
  );

  const parsedRiskPercent = useMemo(
    () => parsePositiveNumber(tradeDraft.riskPercent),
    [tradeDraft.riskPercent],
  );
  const riskSettings = useMemo(
    () =>
      deriveRiskSettings(
        {
          startingBalance: roomView?.self.privateBalance ?? 100_000,
          currentBalance: roomView?.self.privateBalance ?? 100_000,
          defaultRiskPercent: BATTLE_DEFAULT_RISK_PERCENT,
        },
        { riskPercent: parsedRiskPercent ?? BATTLE_DEFAULT_RISK_PERCENT },
      ),
    [parsedRiskPercent, roomView?.self.privateBalance],
  );
  const volumePreview = useMemo(
    () => calculatePositionSizeFromNotional(primaryValidation.entry, riskSettings.riskAmount),
    [primaryValidation.entry, riskSettings.riskAmount],
  );

  const lineValues = useMemo<BacktestLineValues>(() => {
    if (canConfigureDraft) {
      return {
        entry:
          tradeDraft.orderType === "market" ? null : parseDraftPrice(tradeDraft.entry),
        stop: tradeDraft.hasStop ? parseDraftPrice(tradeDraft.stop) : null,
        target: tradeDraft.hasTarget ? parseDraftPrice(tradeDraft.target) : null,
      };
    }

    return {
      entry: activeExecution?.entry ?? null,
      stop: activeExecution?.stop ?? null,
      target: activeExecution?.target ?? null,
    };
  }, [
    activeExecution?.entry,
    activeExecution?.stop,
    activeExecution?.target,
    canConfigureDraft,
    tradeDraft.entry,
    tradeDraft.hasStop,
    tradeDraft.hasTarget,
    tradeDraft.orderType,
    tradeDraft.stop,
    tradeDraft.target,
  ]);

  const remainingMs = useMemo(() => {
    if (now === null) {
      return null;
    }

    if (!roomView?.room.officialEndAt) {
      return 0;
    }

    return Math.max(0, Date.parse(roomView.room.officialEndAt) - now);
  }, [now, roomView?.room.officialEndAt]);

  const participationRemainingMs = useMemo(() => {
    if (now === null) {
      return null;
    }

    if (!roomView?.self.participationDeadlineAt) {
      return 0;
    }

    return Math.max(0, Date.parse(roomView.self.participationDeadlineAt) - now);
  }, [now, roomView?.self.participationDeadlineAt]);

  function updateDraftField(field: BacktestLineField, nextValue: string) {
    if (!canConfigureDraft) {
      return;
    }

    if (field === "entry" && tradeDraft.orderType === "market") {
      return;
    }

    setError(null);
    setTradeDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));
  }

  function setLineValue(field: BacktestLineField, nextPrice: number) {
    if (!canConfigureDraft) {
      return;
    }

    if (field === "entry" && tradeDraft.orderType === "market") {
      return;
    }

    if (field === "stop" && !tradeDraft.hasStop) {
      return;
    }

    if (field === "target" && !tradeDraft.hasTarget) {
      return;
    }

    updateDraftField(field, nextPrice.toFixed(currentInstrument.pricePrecision));
  }

  function addDraftLine(field: Extract<BacktestLineField, "stop" | "target">) {
    if (!canConfigureDraft) {
      return;
    }

    setError(null);
    const seededDraft = seedBattleTradeForm({
      symbol: roomView?.room.symbol ?? "XAUUSD",
      timeframe: roomView?.room.timeframe ?? "15min",
      referencePrice:
        tradeDraft.orderType === "market"
          ? referenceEntryPrice
          : parseDraftPrice(tradeDraft.entry) ?? referenceEntryPrice,
      direction: tradeDraft.direction,
      orderType: tradeDraft.orderType,
      riskPercent: tradeDraft.riskPercent,
    });

    setTradeDraft((current) =>
      field === "stop"
        ? {
            ...current,
            hasStop: true,
            stop: parseDraftPrice(current.stop) !== null ? current.stop : seededDraft.stop,
          }
        : {
            ...current,
            hasTarget: true,
            target: parseDraftPrice(current.target) !== null ? current.target : seededDraft.target,
          },
    );
  }

  function removeDraftLine(field: Extract<BacktestLineField, "stop" | "target">) {
    if (!canConfigureDraft) {
      return;
    }

    setError(null);
    setTradeDraft((current) =>
      field === "stop"
        ? { ...current, hasStop: false }
        : { ...current, hasTarget: false },
    );
  }

  function updateOrderType(nextOrderType: "market" | "limit" | "stop") {
    if (!canConfigureDraft) {
      return;
    }

    setError(null);
    setTradeDraft((current) => {
      const seededDraft = seedBattleTradeForm({
        symbol: roomView?.room.symbol ?? "XAUUSD",
        timeframe: roomView?.room.timeframe ?? "15min",
        referencePrice:
          nextOrderType === "market"
            ? referenceEntryPrice
            : parseDraftPrice(current.entry) ?? referenceEntryPrice,
        direction: current.direction,
        orderType: nextOrderType,
        riskPercent: current.riskPercent,
      });

      return {
        ...seededDraft,
        entry:
          nextOrderType === "market"
            ? seededDraft.entry
            : parseDraftPrice(current.entry) !== null
              ? current.entry
              : seededDraft.entry,
        hasStop: current.hasStop,
        stop:
          current.hasStop && parseDraftPrice(current.stop) !== null
            ? current.stop
            : seededDraft.stop,
        hasTarget: current.hasTarget,
        target:
          current.hasTarget && parseDraftPrice(current.target) !== null
            ? current.target
            : seededDraft.target,
      };
    });
  }

  function updateRiskPercent(nextValue: string) {
    if (!canConfigureDraft) {
      return;
    }

    setError(null);
    setTradeDraft((current) => ({
      ...current,
      riskPercent: nextValue,
    }));
  }

  function resetTradeLines() {
    if (!canConfigureDraft) {
      return;
    }

    setError(null);
    setTradeDraft((current) =>
      seedBattleTradeForm({
        symbol: roomView?.room.symbol ?? "XAUUSD",
        timeframe: roomView?.room.timeframe ?? "15min",
        referencePrice: referenceEntryPrice,
        direction: current.direction,
        orderType: current.orderType,
        riskPercent: current.riskPercent,
      }),
    );
  }

  async function openTrade(direction: BacktestDirection) {
    if (!roomView || !canConfigureDraft || isActionPending) {
      return;
    }

    const validation = direction === "Long" ? buyValidation : sellValidation;
    if (!validation.isValid) {
      setError(validation.message ?? "Enter a valid battle trade.");
      return;
    }

    if (!parsedRiskPercent || !Number.isFinite(riskSettings.riskAmount) || riskSettings.riskAmount <= 0) {
      setError("Enter a valid risk percentage.");
      return;
    }

    if (!volumePreview || !Number.isFinite(volumePreview) || volumePreview <= 0) {
      setError("This setup cannot derive a valid position size.");
      return;
    }

    setIsActionPending(true);
    try {
      const syncedRoomView = await flushReplayCheckpoint();
      if (!syncedRoomView || syncedRoomView.self.replayIndex !== localReplayIndexRef.current) {
        setError("Replay is still syncing. Try opening the trade again.");
        return;
      }

      const result = await openBattleTradeAction({
        roomId: syncedRoomView.room.roomId,
        direction,
        orderType: tradeDraft.orderType,
        entryPrice: tradeDraft.orderType === "market" ? null : validation.entry,
        stopLoss: validation.stop,
        takeProfit: validation.target,
        riskPercent: parsedRiskPercent,
        replayIndex: syncedRoomView.self.replayIndex,
      });

      if (result.ok) {
        setRoomView(result.room);
        setError(null);
        return;
      }

      if (result.room) {
        setRoomView(result.room);
      }
      setError(result.message);
    } finally {
      setIsActionPending(false);
    }
  }

  async function closeTrade() {
    if (!roomView || isActionPending || activeExecution?.status !== "active") {
      return;
    }

    setIsActionPending(true);
    try {
      const syncedRoomView = await flushReplayCheckpoint();
      if (!syncedRoomView) {
        setError("Replay is still syncing. Try closing the trade again.");
        return;
      }

      const authoritativeReplayIndex = syncedRoomView.self.replayIndex;
      if (authoritativeReplayIndex !== localReplayIndexRef.current) {
        setLocalReplayIndex(authoritativeReplayIndex);
      }

      const result = await closeBattleTradeAction({
        roomId: syncedRoomView.room.roomId,
        replayIndex: authoritativeReplayIndex,
      });

      if (result.ok) {
        setRoomView(result.room);
        setError(null);
        return;
      }

      if (result.room) {
        setRoomView(result.room);
      }
      setError(result.message);
    } finally {
      setIsActionPending(false);
    }
  }

  return {
    roomView,
    hasBootstrapped,
    currentInstrument,
    currentCandle,
    tradeDraft,
    replay: {
      isPlaying,
      speedId: "4x",
    },
    revealedCandles:
      roomView?.room.candles.slice(0, localReplayIndex + 1) ?? [],
    execution: activeExecution ?? createDraftExecution(),
    lineValues,
    primaryValidation,
    riskSettings,
    volumePreview,
    hasStop: canConfigureDraft ? tradeDraft.hasStop : activeExecution?.stop !== null,
    hasTarget: canConfigureDraft ? tradeDraft.hasTarget : activeExecution?.target !== null,
    canConfigureDraft,
    canManageTradeLines: canConfigureDraft,
    canStepForward,
    canArmBuy:
      canConfigureDraft &&
      buyValidation.isValid &&
      parsedRiskPercent !== null &&
      volumePreview !== null,
    canArmSell:
      canConfigureDraft &&
      sellValidation.isValid &&
      parsedRiskPercent !== null &&
      volumePreview !== null,
    canCloseTrade: activeExecution?.status === "active",
    remainingMs,
    participationRemainingMs,
    error,
    isPending: isActionPending,
    updateDraftField,
    setLineValue,
    addDraftLine,
    removeDraftLine,
    updateOrderType,
    updateRiskPercent,
    resetTradeLines,
    togglePlayback: () => {
      if (!canStepForward || isLocked) {
        return;
      }

      setError(null);
      setIsPlaying((current) => {
        const next = !current;
        if (next) {
          lastReplayFlushAtRef.current = Date.now();
        }

        return next;
      });
    },
    armBuy: () => void openTrade("Long"),
    armSell: () => void openTrade("Short"),
    closeTrade: () => void closeTrade(),
  };
}
