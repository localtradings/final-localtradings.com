"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import {
  BACKTEST_INITIAL_REVEAL_COUNT,
} from "@/features/backtesting/constants";
import type {
  BacktestAccountState,
  BacktestCandlesResponse,
  BacktestSelection,
  BacktestSessionRecord,
  BacktestTradeDraft,
  BacktestTradeExecution,
  ReplayState,
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
  replayRef,
  selectionRef,
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
  replayRef: MutableRefObject<ReplayState>;
  selectionRef: MutableRefObject<BacktestSelection>;
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

    pendingSaveExecutionKeyRef.current = executionKey;

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
    replayRef,
    selectionRef,
    sessionStartedAtRef,
    setAccount,
    setHistorySaveTick,
    setNotice,
    setSessions,
    settledExecutionKeyRef,
  ]);
}
