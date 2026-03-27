import type {
  BacktestAccountState,
  BacktestCandle,
  BacktestDirection,
  BacktestInstrument,
  BacktestOrderType,
  BacktestTradeMoneySummary,
  BacktestTimeframe,
  BacktestTradeDraft,
  BacktestTradeExecution,
  BacktestTradeValidation,
} from "../types";

export function formatPrice(value: number, instrument: BacktestInstrument) {
  return value.toFixed(instrument.pricePrecision);
}

export function buildTradeDraftFromPrice(
  instrument: BacktestInstrument,
  timeframe: BacktestTimeframe,
  referencePrice: number,
  direction: BacktestDirection,
  orderType: BacktestOrderType = "limit",
  volume = "",
): BacktestTradeDraft {
  const multiplier =
    timeframe === "1min"
      ? 6
      : timeframe === "5min"
        ? 10
        : timeframe === "15min"
          ? 18
          : timeframe === "30min"
            ? 26
            : timeframe === "1h"
              ? 34
              : timeframe === "4h"
                ? 58
                : 96;
  const riskDistance = instrument.tickSize * multiplier;
  const rewardDistance = riskDistance * 1.8;

  const entry = referencePrice;
  const stop = direction === "Long" ? entry - riskDistance : entry + riskDistance;
  const target = direction === "Long" ? entry + rewardDistance : entry - rewardDistance;

  return {
    direction,
    orderType,
    entry: formatPrice(entry, instrument),
    stop: formatPrice(stop, instrument),
    target: formatPrice(target, instrument),
    volume,
    thesis:
      direction === "Long"
        ? "Continuation bias after structure holds and price reclaims momentum."
        : "Fade the sweep and only stay involved while the invalidation remains intact.",
    reviewNotes: "",
  };
}

export function validateTradeDraft(
  draft: BacktestTradeDraft,
): BacktestTradeValidation {
  const entry = Number(draft.entry);
  const stop = Number(draft.stop);
  const target = Number(draft.target);

  if ([entry, stop, target].some(Number.isNaN)) {
    return {
      isValid: false,
      message: "Entry, stop, and target all need valid numeric prices.",
      entry: null,
      stop: null,
      target: null,
      riskPerUnit: null,
      rewardPerUnit: null,
      riskReward: null,
    };
  }

  if (draft.direction === "Long" && !(stop < entry && target > entry)) {
    return {
      isValid: false,
      message: "For a long setup, stop must be below entry and target must be above entry.",
      entry,
      stop,
      target,
      riskPerUnit: null,
      rewardPerUnit: null,
      riskReward: null,
    };
  }

  if (draft.direction === "Short" && !(stop > entry && target < entry)) {
    return {
      isValid: false,
      message: "For a short setup, stop must be above entry and target must be below entry.",
      entry,
      stop,
      target,
      riskPerUnit: null,
      rewardPerUnit: null,
      riskReward: null,
    };
  }

  const riskPerUnit = Math.abs(entry - stop);
  const rewardPerUnit = Math.abs(target - entry);

  if (riskPerUnit === 0) {
    return {
      isValid: false,
      message: "Stop cannot be equal to entry.",
      entry,
      stop,
      target,
      riskPerUnit: null,
      rewardPerUnit: null,
      riskReward: null,
    };
  }

  return {
    isValid: true,
    entry,
    stop,
    target,
    riskPerUnit,
    rewardPerUnit,
    riskReward: rewardPerUnit / riskPerUnit,
  };
}

export function createDraftExecution(): BacktestTradeExecution {
  return {
    status: "draft",
    orderType: null,
    entry: null,
    stop: null,
    target: null,
    riskPercent: null,
    riskAmount: null,
    volume: null,
    balanceBeforeTrade: null,
    openedAtIndex: null,
    openedAtTime: null,
    closedAtIndex: null,
    closedAtTime: null,
    exitPrice: null,
    resultR: null,
    resultAmount: null,
    balanceAfterTrade: null,
    maxFavorableR: null,
    maxAdverseR: null,
    durationBars: null,
  };
}

export function deriveRiskSettings(
  account: BacktestAccountState,
  input: Partial<Pick<BacktestTradeMoneySummary, "riskPercent" | "riskAmount">>,
) {
  const currentBalance = Number.isFinite(account.currentBalance) && account.currentBalance > 0
    ? account.currentBalance
    : 100000;
  const requestedPercent = Number(input.riskPercent);
  const requestedAmount = Number(input.riskAmount);

  if (Number.isFinite(requestedAmount) && requestedAmount > 0) {
    return {
      riskAmount: requestedAmount,
      riskPercent: currentBalance === 0 ? 0 : (requestedAmount / currentBalance) * 100,
    };
  }

  const fallbackPercent =
    Number.isFinite(requestedPercent) && requestedPercent > 0
      ? requestedPercent
      : account.defaultRiskPercent > 0
        ? account.defaultRiskPercent
        : 1;

  return {
    riskPercent: fallbackPercent,
    riskAmount: (currentBalance * fallbackPercent) / 100,
  };
}

export function calculatePositionSize(
  validation: BacktestTradeValidation,
  riskAmount: number,
) {
  if (
    !validation.isValid ||
    !validation.riskPerUnit ||
    !Number.isFinite(riskAmount) ||
    riskAmount <= 0
  ) {
    return null;
  }

  return riskAmount / validation.riskPerUnit;
}

export function calculateRiskFromVolume(
  validation: BacktestTradeValidation,
  volume: number,
  currentBalance: number,
) {
  if (
    !validation.isValid ||
    !validation.riskPerUnit ||
    !Number.isFinite(volume) ||
    volume <= 0
  ) {
    return {
      riskAmount: null,
      riskPercent: null,
    };
  }

  const riskAmount = volume * validation.riskPerUnit;

  return {
    riskAmount,
    riskPercent:
      Number.isFinite(currentBalance) && currentBalance > 0
        ? (riskAmount / currentBalance) * 100
        : null,
  };
}

export function armPendingTradeExecution(
  validation: BacktestTradeValidation,
  money: {
    orderType: BacktestOrderType;
    riskPercent: number;
    riskAmount: number;
    volume: number | null;
    balanceBeforeTrade: number;
  },
): BacktestTradeExecution {
  return {
    status: "armed",
    orderType: money.orderType,
    entry: validation.entry,
    stop: validation.stop,
    target: validation.target,
    riskPercent: money.riskPercent,
    riskAmount: money.riskAmount,
    volume: money.volume,
    balanceBeforeTrade: money.balanceBeforeTrade,
    openedAtIndex: null,
    openedAtTime: null,
    closedAtIndex: null,
    closedAtTime: null,
    exitPrice: null,
    resultR: null,
    resultAmount: null,
    balanceAfterTrade: null,
    maxFavorableR: 0,
    maxAdverseR: 0,
    durationBars: null,
  };
}

export function activateTradeExecution(
  validation: BacktestTradeValidation,
  replayIndex: number,
  time: number,
  money: Pick<
    BacktestTradeExecution,
    "orderType" | "riskPercent" | "riskAmount" | "volume" | "balanceBeforeTrade"
  >,
): BacktestTradeExecution {
  return {
    status: "active",
    orderType: money.orderType ?? null,
    entry: validation.entry,
    stop: validation.stop,
    target: validation.target,
    riskPercent: money.riskPercent ?? null,
    riskAmount: money.riskAmount ?? null,
    volume: money.volume ?? null,
    balanceBeforeTrade: money.balanceBeforeTrade ?? null,
    openedAtIndex: replayIndex,
    openedAtTime: time,
    closedAtIndex: null,
    closedAtTime: null,
    exitPrice: null,
    resultR: null,
    resultAmount: null,
    balanceAfterTrade: null,
    maxFavorableR: 0,
    maxAdverseR: 0,
    durationBars: null,
  };
}

function getResultR(
  direction: BacktestDirection,
  entry: number,
  exitPrice: number,
  riskPerUnit: number,
) {
  if (riskPerUnit === 0) {
    return 0;
  }

  const signedMove =
    direction === "Long" ? exitPrice - entry : entry - exitPrice;

  return signedMove / riskPerUnit;
}

export function advanceTradeExecution(
  execution: BacktestTradeExecution,
  candle: BacktestCandle,
  candleIndex: number,
  direction: BacktestDirection,
): BacktestTradeExecution {
  if (
    execution.status !== "active" ||
    execution.entry === null ||
    execution.stop === null ||
    execution.target === null ||
    execution.openedAtIndex === null
  ) {
    return execution;
  }

  const riskPerUnit = Math.abs(execution.entry - execution.stop);
  const favorableR =
    direction === "Long"
      ? (candle.high - execution.entry) / riskPerUnit
      : (execution.entry - candle.low) / riskPerUnit;
  const adverseR =
    direction === "Long"
      ? (execution.entry - candle.low) / riskPerUnit
      : (candle.high - execution.entry) / riskPerUnit;

  const baseExecution: BacktestTradeExecution = {
    ...execution,
    maxFavorableR: Math.max(execution.maxFavorableR ?? 0, favorableR),
    maxAdverseR: Math.max(execution.maxAdverseR ?? 0, adverseR),
    durationBars: candleIndex - execution.openedAtIndex,
  };

  if (direction === "Long") {
    const hitStop = candle.low <= execution.stop;
    const hitTarget = candle.high >= execution.target;

    if (hitStop && hitTarget) {
      return resolveTrade(baseExecution, "stop_hit", execution.stop, candleIndex, candle.time, direction);
    }

    if (hitStop) {
      return resolveTrade(baseExecution, "stop_hit", execution.stop, candleIndex, candle.time, direction);
    }

    if (hitTarget) {
      return resolveTrade(baseExecution, "target_hit", execution.target, candleIndex, candle.time, direction);
    }
  } else {
    const hitStop = candle.high >= execution.stop;
    const hitTarget = candle.low <= execution.target;

    if (hitStop && hitTarget) {
      return resolveTrade(baseExecution, "stop_hit", execution.stop, candleIndex, candle.time, direction);
    }

    if (hitStop) {
      return resolveTrade(baseExecution, "stop_hit", execution.stop, candleIndex, candle.time, direction);
    }

    if (hitTarget) {
      return resolveTrade(baseExecution, "target_hit", execution.target, candleIndex, candle.time, direction);
    }
  }

  return baseExecution;
}

export function advancePendingTradeExecution(
  execution: BacktestTradeExecution,
  candle: BacktestCandle,
  candleIndex: number,
  direction: BacktestDirection,
): BacktestTradeExecution {
  if (
    execution.status !== "armed" ||
    execution.entry === null ||
    execution.stop === null ||
    execution.target === null
  ) {
    return execution;
  }

  const orderType = execution.orderType ?? "limit";
  const entryTouched =
    orderType === "stop"
      ? direction === "Long"
        ? candle.high >= execution.entry
        : candle.low <= execution.entry
      : direction === "Long"
        ? candle.low <= execution.entry
        : candle.high >= execution.entry;

  if (!entryTouched) {
    return execution;
  }

  const activated = activateTradeExecution(
    {
      isValid: true,
      entry: execution.entry,
      stop: execution.stop,
      target: execution.target,
      riskPerUnit: Math.abs(execution.entry - execution.stop),
      rewardPerUnit: Math.abs(execution.target - execution.entry),
      riskReward:
        Math.abs(execution.entry - execution.stop) === 0
          ? null
          : Math.abs(execution.target - execution.entry) /
            Math.abs(execution.entry - execution.stop),
    },
    candleIndex,
    candle.time,
    {
      orderType: execution.orderType,
      riskPercent: execution.riskPercent,
      riskAmount: execution.riskAmount,
      volume: execution.volume,
      balanceBeforeTrade: execution.balanceBeforeTrade,
    },
  );

  return advanceTradeExecution(activated, candle, candleIndex, direction);
}

function resolveTrade(
  execution: BacktestTradeExecution,
  status: BacktestTradeExecution["status"],
  exitPrice: number,
  candleIndex: number,
  candleTime: number,
  direction: BacktestDirection,
): BacktestTradeExecution {
  const riskPerUnit = Math.abs((execution.entry ?? 0) - (execution.stop ?? 0));
  const resultR = getResultR(direction, execution.entry ?? 0, exitPrice, riskPerUnit);
  const resultAmount =
    typeof execution.riskAmount === "number" ? execution.riskAmount * resultR : null;
  const balanceAfterTrade =
    typeof execution.balanceBeforeTrade === "number" && typeof resultAmount === "number"
      ? execution.balanceBeforeTrade + resultAmount
      : null;

  return {
    ...execution,
    status,
    exitPrice,
    resultR,
    resultAmount,
    balanceAfterTrade,
    closedAtIndex: candleIndex,
    closedAtTime: candleTime,
    durationBars:
      execution.openedAtIndex === null ? null : candleIndex - execution.openedAtIndex,
  };
}

export function manuallyCloseTrade(
  execution: BacktestTradeExecution,
  candle: BacktestCandle,
  candleIndex: number,
  direction: BacktestDirection,
): BacktestTradeExecution {
  if (
    execution.status !== "active" ||
    execution.entry === null ||
    execution.stop === null
  ) {
    return execution;
  }

  const riskPerUnit = Math.abs(execution.entry - execution.stop);
  const resultR = getResultR(direction, execution.entry, candle.close, riskPerUnit);
  const status = Math.abs(resultR) < 0.05 ? "breakeven" : "manual_close";

  return {
    ...execution,
    status,
    exitPrice: candle.close,
    resultR,
    resultAmount:
      typeof execution.riskAmount === "number" ? execution.riskAmount * resultR : null,
    balanceAfterTrade:
      typeof execution.balanceBeforeTrade === "number" &&
      typeof execution.riskAmount === "number"
        ? execution.balanceBeforeTrade + execution.riskAmount * resultR
        : null,
    closedAtIndex: candleIndex,
    closedAtTime: candle.time,
    durationBars:
      execution.openedAtIndex === null ? null : candleIndex - execution.openedAtIndex,
  };
}

export function finalizeUnfinishedTrade(
  execution: BacktestTradeExecution,
  candle: BacktestCandle,
  candleIndex: number,
  direction: BacktestDirection,
): BacktestTradeExecution {
  if (
    execution.status !== "active" ||
    execution.entry === null ||
    execution.stop === null
  ) {
    return execution;
  }

  const riskPerUnit = Math.abs(execution.entry - execution.stop);
  const resultR = getResultR(direction, execution.entry, candle.close, riskPerUnit);

  return {
    ...execution,
    status: "unfinished",
    exitPrice: candle.close,
    resultR,
    resultAmount:
      typeof execution.riskAmount === "number" ? execution.riskAmount * resultR : null,
    balanceAfterTrade:
      typeof execution.balanceBeforeTrade === "number" &&
      typeof execution.riskAmount === "number"
        ? execution.balanceBeforeTrade + execution.riskAmount * resultR
        : null,
    closedAtIndex: candleIndex,
    closedAtTime: candle.time,
    durationBars:
      execution.openedAtIndex === null ? null : candleIndex - execution.openedAtIndex,
  };
}
