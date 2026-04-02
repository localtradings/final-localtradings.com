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
  "id, symbol, timeframe, direction, order_type, volume, entry, stop, target, exit_price, status, result_r, result_amount, balance_after_trade, started_at, finished_at";

type BacktestSessionRow = {
  id: string;
  symbol: string;
  timeframe: string;
  direction: string;
  order_type: string | null;
  volume: number | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  exit_price: number | null;
  status: string;
  result_r: number | null;
  result_amount: number | null;
  balance_after_trade: number | null;
  started_at: string;
  finished_at: string | null;
};

export function normalizeBacktestSession(
  row: BacktestSessionRow,
): BacktestSessionRecord {
  const direction = (row.direction === "Short" ? "Short" : "Long") as BacktestDirection;
  const orderType =
    row.order_type === "market" || row.order_type === "limit" || row.order_type === "stop"
      ? (row.order_type as BacktestOrderType)
      : null;

  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe as BacktestTimeframe,
    direction,
    orderType,
    volume: row.volume,
    entry: row.entry,
    stop: row.stop,
    target: row.target,
    exitPrice: row.exit_price,
    status: row.status as BacktestSessionRecord["status"],
    resultR: row.result_r,
    resultAmount: row.result_amount,
    balanceAfter: row.balance_after_trade,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}

export async function getBacktestSessions(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as BacktestSessionRecord[];
  }

  const { data, error } = await supabase
    .from("backtest_sessions")
    .select(BACKTEST_SESSION_SUMMARY_SELECT)
    .eq("user_id", userId)
    .in("status", [...COMPLETED_HISTORY_STATUSES])
    .order("started_at", { ascending: false })
    .limit(MAX_BACKTEST_SESSIONS_PER_USER);

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
