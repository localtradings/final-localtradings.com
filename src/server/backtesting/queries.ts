import "server-only";

import type {
  BacktestDirection,
  BacktestOrderType,
  BacktestSessionRecord,
  BacktestTimeframe,
} from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BACKTEST_SESSIONS_PER_USER = 5;
const COMPLETED_HISTORY_STATUSES = [
  "target_hit",
  "stop_hit",
  "manual_close",
  "breakeven",
] as const;
const INCOMPLETE_SESSION_STATUSES = [
  "draft",
  "armed",
  "active",
  "unfinished",
] as const;
const BACKTEST_SESSION_SUMMARY_SELECT =
  "id, symbol, timeframe, historical_window_id, direction, order_type, volume, entry, stop, target, exit_price, status, result_r, result_amount, balance_after_trade, started_at, finished_at";
const BACKTEST_SESSION_LEGACY_SELECT =
  "id, symbol, timeframe, historical_window_id, direction, entry, stop, target, status, result_r, started_at, finished_at, session_state_json";

type BacktestSessionRow = {
  id: string;
  symbol: string;
  timeframe: string;
  historical_window_id?: string | null;
  direction: string;
  order_type?: string | null;
  volume?: number | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  exit_price?: number | null;
  status: string;
  result_r: number | null;
  result_amount?: number | null;
  balance_after_trade?: number | null;
  started_at: string;
  finished_at: string | null;
  session_state_json?: {
    execution?: {
      orderType?: string | null;
      volume?: number | null;
      exitPrice?: number | null;
      resultAmount?: number | null;
      balanceAfterTrade?: number | null;
    };
  } | null;
};

function isSummarySchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("historical_window_id") ||
    message.includes("order_type") ||
    message.includes("exit_price") ||
    message.includes("result_amount") ||
    message.includes("balance_after_trade") ||
    message.includes("volume")
  );
}

export function normalizeBacktestSession(
  row: BacktestSessionRow,
): BacktestSessionRecord {
  const direction = (row.direction === "Short" ? "Short" : "Long") as BacktestDirection;
  const orderType =
    row.order_type === "market" || row.order_type === "limit" || row.order_type === "stop"
      ? (row.order_type as BacktestOrderType)
      : row.session_state_json?.execution?.orderType === "market" ||
          row.session_state_json?.execution?.orderType === "limit" ||
          row.session_state_json?.execution?.orderType === "stop"
        ? (row.session_state_json.execution.orderType as BacktestOrderType)
      : null;

  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe as BacktestTimeframe,
    historicalWindowId: row.historical_window_id ?? null,
    direction,
    orderType,
    volume:
      typeof row.volume === "number"
        ? row.volume
        : typeof row.session_state_json?.execution?.volume === "number"
          ? row.session_state_json.execution.volume
          : null,
    entry: row.entry,
    stop: row.stop,
    target: row.target,
    exitPrice:
      typeof row.exit_price === "number"
        ? row.exit_price
        : typeof row.session_state_json?.execution?.exitPrice === "number"
          ? row.session_state_json.execution.exitPrice
          : null,
    status: row.status as BacktestSessionRecord["status"],
    resultR: row.result_r,
    resultAmount:
      typeof row.result_amount === "number"
        ? row.result_amount
        : typeof row.session_state_json?.execution?.resultAmount === "number"
          ? row.session_state_json.execution.resultAmount
          : null,
    balanceAfter:
      typeof row.balance_after_trade === "number"
        ? row.balance_after_trade
        : typeof row.session_state_json?.execution?.balanceAfterTrade === "number"
          ? row.session_state_json.execution.balanceAfterTrade
          : null,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function getBacktestSessions(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as BacktestSessionRecord[];
  }

  const primaryResult = await supabase
    .from("backtest_sessions")
    .select(BACKTEST_SESSION_SUMMARY_SELECT)
    .eq("user_id", userId)
    .in("status", [...COMPLETED_HISTORY_STATUSES])
    .order("started_at", { ascending: false })
    .limit(MAX_BACKTEST_SESSIONS_PER_USER);

  let data: unknown = primaryResult.data;
  let error = primaryResult.error;

  if (error && isSummarySchemaError(error)) {
    const legacyResult = await supabase
      .from("backtest_sessions")
      .select(BACKTEST_SESSION_LEGACY_SELECT)
      .eq("user_id", userId)
      .in("status", [...COMPLETED_HISTORY_STATUSES])
      .order("started_at", { ascending: false })
      .limit(MAX_BACKTEST_SESSIONS_PER_USER);

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error || !data) {
    return [] as BacktestSessionRecord[];
  }

  return (data as BacktestSessionRow[]).map(normalizeBacktestSession);
}

export async function deleteIncompleteBacktestSessions(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("backtest_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", [...INCOMPLETE_SESSION_STATUSES]);

  if (error || !data || data.length === 0) {
    return;
  }

  const sessionIds = data.map((item) => item.id);

  if (sessionIds.length === 0) {
    return;
  }

  await supabase
    .from("backtest_sessions")
    .delete()
    .eq("user_id", userId)
    .in("id", sessionIds);
}
