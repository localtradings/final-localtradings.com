import {
  DEFAULT_BACKTEST_ACCOUNT,
} from "@/features/backtesting/constants";
import type {
  BacktestCandlesResponse,
  BacktestDirection,
  BacktestLineField,
  BacktestSessionRecord,
  BacktestSessionStatus,
  BacktestTradeDraft,
  BacktestTradeExecution,
} from "@/features/backtesting/types";
import { formatPrice, validateTradeDraft } from "@/features/backtesting/utils/trade-engine";

const SESSION_LIMIT = 25;
export const COMPLETED_HISTORY_STATUSES: BacktestSessionStatus[] = [
  "target_hit",
  "stop_hit",
  "manual_close",
  "breakeven",
];

function formatSignedMoney(value: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

export function parseDraftPrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function replaceDraftPrice(
  draft: BacktestTradeDraft,
  field: BacktestLineField,
  value: string,
) {
  return {
    ...draft,
    [field]: value,
  };
}

export function buildStatusNotice(
  status: BacktestTradeExecution["status"],
  resultAmount: number | null,
  options?: {
    direction?: BacktestDirection;
    entry?: number | null;
  },
) {
  const moneyLabel = formatSignedMoney(resultAmount);

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

export function derivePrimaryValidation(
  preferredDirection: BacktestDirection,
  buyValidation: ReturnType<typeof validateTradeDraft>,
  sellValidation: ReturnType<typeof validateTradeDraft>,
) {
  if (preferredDirection === "Short") {
    return sellValidation.isValid ? sellValidation : buyValidation;
  }

  return buyValidation.isValid ? buyValidation : sellValidation;
}

export function sanitizePositiveNumber(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function buildOrderAwareValidation(
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

export function createBalanceKey(userId?: string | null) {
  return `backtesting-balance:${userId ?? "guest"}`;
}

export function isBacktestCandlesResponse(
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

export function getReplayLoadErrorMessage(status?: number) {
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

export function mergeSessions(
  current: BacktestSessionRecord[],
  session: BacktestSessionRecord,
) {
  return [session, ...current.filter((item) => item.id !== session.id)]
    .sort(
      (left, right) =>
        new Date(right.startedAt).getTime() -
        new Date(left.startedAt).getTime(),
    )
    .slice(0, SESSION_LIMIT);
}

export function removeSession(
  current: BacktestSessionRecord[],
  sessionId: string,
) {
  return current.filter((item) => item.id !== sessionId);
}

export function createSettledExecutionKey(execution: BacktestTradeExecution) {
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

export { DEFAULT_BACKTEST_ACCOUNT, SESSION_LIMIT, formatPrice };
