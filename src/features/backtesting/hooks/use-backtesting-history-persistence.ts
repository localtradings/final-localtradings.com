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

  useEffect(() => {
    const isTradeFinished =
      execution.status === "target_hit" ||
      execution.status === "stop_hit" ||
      execution.status === "unfinished" ||
      execution.status === "manual_close" ||
      execution.status === "breakeven";

    if (!isTradeFinished || execution.closedAtTime === null) {
      return;
    }

    const executionKey = createSettledExecutionKey(execution);
    if (
      !executionKey ||
      settledExecutionKeyRef.current === executionKey ||
      pendingSaveExecutionKeyRef.current === executionKey
    ) {
      return;
    }

    const isCompletedHistoryStatus = COMPLETED_HISTORY_STATUSES.includes(execution.status);

    if (isCompletedHistoryStatus && typeof execution.balanceAfterTrade === "number") {
      setAccount((current) => ({
        ...current,
        currentBalance: execution.balanceAfterTrade ?? current.currentBalance,
      }));
    }

    if (!isCompletedHistoryStatus || !datasetRef.current) {
      settledExecutionKeyRef.current = executionKey;
      return;
    }

    const activeDataset = datasetRef.current;
    const closedAtTime = execution.closedAtTime;
    if (closedAtTime === null) {
      return;
    }

    pendingSaveExecutionKeyRef.current = executionKey;

    void (async () => {
      const result = await saveBacktestSession({
        symbol: activeDataset.selection.symbol,
        timeframe: activeDataset.selection.timeframe,
        direction: draftRef.current.direction,
        orderType: execution.orderType,
        volume: execution.volume,
        entry: execution.entry,
        stop: execution.stop,
        target: execution.target,
        exitPrice: execution.exitPrice,
        status: execution.status,
        resultR: execution.resultR,
        resultAmount: execution.resultAmount,
        balanceAfter: execution.balanceAfterTrade,
        startedAt: sessionStartedAtRef.current,
        finishedAt: new Date(closedAtTime * 1000).toISOString(),
      });

      if (result.ok) {
        settledExecutionKeyRef.current = executionKey;
        pendingSaveExecutionKeyRef.current = null;
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
