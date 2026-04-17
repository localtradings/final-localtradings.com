"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type {
  BacktestAccountState,
  BacktestCandlesResponse,
  BacktestTradeDraft,
  BacktestSessionRecord,
  BacktestTradeExecution,
} from "@/features/backtesting/types";
import {
  COMPLETED_HISTORY_STATUSES,
  createSettledExecutionKey,
  mergeSessions,
} from "@/features/backtesting/utils/workspace-helpers";
import { saveBacktestSession } from "@/server/backtesting/actions";

function resolveWindowStartAt(windowStartAt: string | null | undefined, startedAt: string) {
  if (
    typeof windowStartAt === "string" &&
    windowStartAt.length > 0 &&
    Number.isFinite(Date.parse(windowStartAt))
  ) {
    return new Date(windowStartAt).toISOString();
  }

  return new Date(startedAt).toISOString();
}

export function useBacktestingHistoryPersistence({
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
  datasetRef,
}: {
  datasetRef: MutableRefObject<BacktestCandlesResponse | null>;
  draftRef: MutableRefObject<BacktestTradeDraft>;
  execution: BacktestTradeExecution;
  historySaveTick: number;
  pendingSaveExecutionKeyRef: MutableRefObject<string | null>;
  sessionStartedAtRef: MutableRefObject<string>;
  setAccount: Dispatch<SetStateAction<BacktestAccountState>>;
  setHistorySaveTick: Dispatch<SetStateAction<number>>;
  setNotice: Dispatch<SetStateAction<string | null>>;
  setSessions: Dispatch<SetStateAction<BacktestSessionRecord[]>>;
  settledExecutionKeyRef: MutableRefObject<string | null>;
}) {
  const historySaveAttemptsRef = useRef<Record<string, number>>({});
  const pendingSettledExecutionRef = useRef<BacktestTradeExecution | null>(null);

  useEffect(() => {
    const isTradeFinished =
      execution.status === "target_hit" ||
      execution.status === "stop_hit" ||
      execution.status === "unfinished" ||
      execution.status === "manual_close" ||
      execution.status === "breakeven";

    if (isTradeFinished && execution.closedAtTime !== null) {
      pendingSettledExecutionRef.current = execution;
    }

    const executionToPersist = pendingSettledExecutionRef.current;

    if (!executionToPersist || executionToPersist.closedAtTime === null) {
      return;
    }

    const executionKey = createSettledExecutionKey(executionToPersist);
    if (
      !executionKey ||
      settledExecutionKeyRef.current === executionKey ||
      pendingSaveExecutionKeyRef.current === executionKey
    ) {
      return;
    }

    const isCompletedHistoryStatus = COMPLETED_HISTORY_STATUSES.includes(
      executionToPersist.status,
    );

    if (
      isCompletedHistoryStatus &&
      typeof executionToPersist.balanceAfterTrade === "number"
    ) {
      setAccount((current) => ({
        ...current,
        currentBalance: executionToPersist.balanceAfterTrade ?? current.currentBalance,
      }));
    }

    if (!isCompletedHistoryStatus || !datasetRef.current) {
      settledExecutionKeyRef.current = executionKey;
      pendingSettledExecutionRef.current = null;
      return;
    }

    const activeDataset = datasetRef.current;
    const closedAtTime = executionToPersist.closedAtTime;
    if (closedAtTime === null) {
      return;
    }

    pendingSaveExecutionKeyRef.current = executionKey;

    void (async () => {
      const resolvedStartedAt = new Date(sessionStartedAtRef.current).toISOString();
      const resolvedFinishedAt = new Date(closedAtTime * 1000).toISOString();
      const result = await saveBacktestSession({
        symbol: activeDataset.selection.symbol,
        timeframe: activeDataset.selection.timeframe,
        historicalWindowId: activeDataset.selection.historicalWindowId,
        windowStartAt: resolveWindowStartAt(
          activeDataset.selection.windowStartAt,
          resolvedStartedAt,
        ),
        barsRequested:
          Number.isInteger(activeDataset.selection.barsRequested) &&
          activeDataset.selection.barsRequested > 0
            ? activeDataset.selection.barsRequested
            : activeDataset.candles.length,
        direction: draftRef.current.direction,
        orderType: executionToPersist.orderType,
        volume: executionToPersist.volume,
        entry: executionToPersist.entry,
        stop: executionToPersist.stop,
        target: executionToPersist.target,
        exitPrice: executionToPersist.exitPrice,
        status: executionToPersist.status,
        resultR: executionToPersist.resultR,
        resultAmount: executionToPersist.resultAmount,
        balanceAfter: executionToPersist.balanceAfterTrade,
        startedAt: resolvedStartedAt,
        finishedAt: resolvedFinishedAt,
      });

      if (result.ok) {
        settledExecutionKeyRef.current = executionKey;
        pendingSaveExecutionKeyRef.current = null;
        pendingSettledExecutionRef.current = null;
        delete historySaveAttemptsRef.current[executionKey];
        setSessions((current) => mergeSessions(current, result.session));
      } else {
        pendingSaveExecutionKeyRef.current = null;

        const nextAttemptCount = (historySaveAttemptsRef.current[executionKey] ?? 0) + 1;
        historySaveAttemptsRef.current[executionKey] = nextAttemptCount;

        if (nextAttemptCount < 3) {
          window.setTimeout(() => {
            setHistorySaveTick((current) => current + 1);
          }, 1200);
          return;
        }

        settledExecutionKeyRef.current = executionKey;
        pendingSettledExecutionRef.current = null;
        setNotice("Trade completed, but history could not be saved.");
      }
    })();
  }, [
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
  ]);
}
