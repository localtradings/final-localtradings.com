import {
  DEFAULT_REPLAY_SPEED_ID,
} from "../constants";
import type {
  BacktestSessionRecord,
  BacktestSessionSnapshot,
  BacktestTradeDraft,
  BacktestTradeExecution,
  ReplayState,
} from "../types";
import { createDraftExecution } from "./trade-engine";

export function createDefaultReplayState(initialRevealCount: number): ReplayState {
  return {
    replayIndex: Math.max(initialRevealCount - 1, 0),
    isPlaying: false,
    speedId: DEFAULT_REPLAY_SPEED_ID,
  };
}

export function createDefaultSnapshot(
  draft: BacktestTradeDraft,
  initialRevealCount: number,
): BacktestSessionSnapshot {
  return {
    replay: createDefaultReplayState(initialRevealCount),
    tradeDraft: draft,
    execution: createDraftExecution(),
  };
}

export function sanitizeSnapshot(
  raw: unknown,
  fallbackDraft: BacktestTradeDraft,
  initialRevealCount: number,
): BacktestSessionSnapshot {
  const snapshot = (raw ?? {}) as Partial<BacktestSessionSnapshot>;
  const replay = (snapshot.replay ?? {}) as Partial<ReplayState>;
  const execution = (snapshot.execution ?? {}) as Partial<BacktestTradeExecution>;

  return {
    replay: {
      replayIndex:
        typeof replay.replayIndex === "number"
          ? Math.max(initialRevealCount - 1, replay.replayIndex)
          : initialRevealCount - 1,
      isPlaying: false,
      speedId:
        typeof replay.speedId === "string" && replay.speedId.length > 0
          ? replay.speedId
          : DEFAULT_REPLAY_SPEED_ID,
    },
    tradeDraft: {
      direction:
        snapshot.tradeDraft?.direction === "Short" ? "Short" : fallbackDraft.direction,
      orderType:
        snapshot.tradeDraft?.orderType === "market" ||
        snapshot.tradeDraft?.orderType === "stop" ||
        snapshot.tradeDraft?.orderType === "limit"
          ? snapshot.tradeDraft.orderType
          : fallbackDraft.orderType,
      entry:
        typeof snapshot.tradeDraft?.entry === "string"
          ? snapshot.tradeDraft.entry
          : fallbackDraft.entry,
      hasStop:
        typeof snapshot.tradeDraft?.hasStop === "boolean"
          ? snapshot.tradeDraft.hasStop
          : fallbackDraft.hasStop,
      stop:
        typeof snapshot.tradeDraft?.stop === "string"
          ? snapshot.tradeDraft.stop
          : fallbackDraft.stop,
      hasTarget:
        typeof snapshot.tradeDraft?.hasTarget === "boolean"
          ? snapshot.tradeDraft.hasTarget
          : fallbackDraft.hasTarget,
      target:
        typeof snapshot.tradeDraft?.target === "string"
          ? snapshot.tradeDraft.target
          : fallbackDraft.target,
      volume:
        typeof snapshot.tradeDraft?.volume === "string"
          ? snapshot.tradeDraft.volume
          : fallbackDraft.volume,
      thesis:
        typeof snapshot.tradeDraft?.thesis === "string"
          ? snapshot.tradeDraft.thesis
          : fallbackDraft.thesis,
      reviewNotes:
        typeof snapshot.tradeDraft?.reviewNotes === "string"
          ? snapshot.tradeDraft.reviewNotes
          : fallbackDraft.reviewNotes,
    },
    execution: {
      status:
        typeof execution.status === "string"
          ? (execution.status as BacktestTradeExecution["status"])
          : "draft",
      orderType:
        execution.orderType === "market" || execution.orderType === "stop"
          ? execution.orderType
          : execution.orderType === "limit"
            ? execution.orderType
            : null,
      entry: typeof execution.entry === "number" ? execution.entry : null,
      stop: typeof execution.stop === "number" ? execution.stop : null,
      target: typeof execution.target === "number" ? execution.target : null,
      riskPercent:
        typeof execution.riskPercent === "number" ? execution.riskPercent : null,
      riskAmount:
        typeof execution.riskAmount === "number" ? execution.riskAmount : null,
      volume:
        typeof execution.volume === "number" ? execution.volume : null,
      balanceBeforeTrade:
        typeof execution.balanceBeforeTrade === "number"
          ? execution.balanceBeforeTrade
          : null,
      openedAtIndex:
        typeof execution.openedAtIndex === "number" ? execution.openedAtIndex : null,
      openedAtTime:
        typeof execution.openedAtTime === "number" ? execution.openedAtTime : null,
      closedAtIndex:
        typeof execution.closedAtIndex === "number" ? execution.closedAtIndex : null,
      closedAtTime:
        typeof execution.closedAtTime === "number" ? execution.closedAtTime : null,
      exitPrice: typeof execution.exitPrice === "number" ? execution.exitPrice : null,
      resultR: typeof execution.resultR === "number" ? execution.resultR : null,
      resultAmount:
        typeof execution.resultAmount === "number" ? execution.resultAmount : null,
      balanceAfterTrade:
        typeof execution.balanceAfterTrade === "number"
          ? execution.balanceAfterTrade
          : null,
      maxFavorableR:
        typeof execution.maxFavorableR === "number" ? execution.maxFavorableR : null,
      maxAdverseR:
        typeof execution.maxAdverseR === "number" ? execution.maxAdverseR : null,
      durationBars:
        typeof execution.durationBars === "number" ? execution.durationBars : null,
    },
  };
}

export function buildSavePayload(
  input: Omit<BacktestSessionRecord, "id"> & { id?: string },
) {
  return {
    id: input.id,
    symbol: input.symbol,
    timeframe: input.timeframe,
    windowStartAt: input.windowStartAt,
    barsRequested: input.barsRequested,
    direction: input.direction,
    entry: input.entry,
    stop: input.stop,
    target: input.target,
    status: input.status,
    resultR: input.resultR,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
    thesis: input.thesis,
    reviewNotes: input.reviewNotes,
    sessionStateJson: input.sessionStateJson,
  };
}
