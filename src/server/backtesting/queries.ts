import "server-only";

import type {
  BacktestDirection,
  BacktestSessionRecord,
  BacktestTimeframe,
} from "@/features/backtesting/types";
import {
  BACKTEST_BARS_REQUESTED,
  BACKTEST_INITIAL_REVEAL_COUNT,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import { sanitizeSnapshot } from "@/features/backtesting/utils/session-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_BACKTEST_SESSIONS_PER_USER = 25;
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
const FULL_BACKTEST_SESSION_SELECT =
  "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json";
const LEGACY_BACKTEST_SESSION_SELECT =
  "id, symbol, timeframe, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json";

type BacktestSessionRow = {
  id: string;
  symbol: string;
  timeframe: string;
  window_start_at?: string | null;
  bars_requested: number | null;
  direction: string;
  entry: number | null;
  stop: number | null;
  target: number | null;
  status: string;
  result_r: number | null;
  started_at: string;
  finished_at: string | null;
  thesis: string | null;
  review_notes: string | null;
  session_state_json: unknown;
};

function isLegacyBacktestSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("window_start_at") || message.includes("bars_requested");
}

export function normalizeBacktestSession(
  row: BacktestSessionRow,
): BacktestSessionRecord {
  const direction = (row.direction === "Short" ? "Short" : "Long") as BacktestDirection;
  const instrument = getBacktestInstrument(row.symbol);
  const pricePrecision = instrument.pricePrecision;
  const fallbackDraft = {
    direction,
    orderType: "market" as const,
    entry:
      typeof row.entry === "number" ? row.entry.toFixed(pricePrecision) : "",
    hasStop: typeof row.stop === "number",
    stop:
      typeof row.stop === "number" ? row.stop.toFixed(pricePrecision) : "",
    hasTarget: typeof row.target === "number",
    target:
      typeof row.target === "number" ? row.target.toFixed(pricePrecision) : "",
    volume: "1.00",
    thesis: row.thesis ?? "",
    reviewNotes: row.review_notes ?? "",
  };

  return {
    id: row.id,
    symbol: row.symbol,
    timeframe: row.timeframe as BacktestTimeframe,
    windowStartAt: row.window_start_at ?? row.started_at,
    barsRequested:
      typeof row.bars_requested === "number" && row.bars_requested > 0
        ? row.bars_requested
        : BACKTEST_BARS_REQUESTED,
    direction,
    entry: row.entry,
    stop: row.stop,
    target: row.target,
    status: row.status as BacktestSessionRecord["status"],
    resultR: row.result_r,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    thesis: row.thesis ?? "",
    reviewNotes: row.review_notes ?? "",
    sessionStateJson: sanitizeSnapshot(
      row.session_state_json,
      fallbackDraft,
      BACKTEST_INITIAL_REVEAL_COUNT,
    ),
  };
}

export async function getBacktestSessions(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [] as BacktestSessionRecord[];
  }

  const baseQuery = supabase
    .from("backtest_sessions")
    .select(FULL_BACKTEST_SESSION_SELECT)
    .eq("user_id", userId)
    .in("status", [...COMPLETED_HISTORY_STATUSES])
    .order("started_at", { ascending: false });

  const primaryResult = await baseQuery.limit(MAX_BACKTEST_SESSIONS_PER_USER);
  let data: unknown = primaryResult.data;
  let error = primaryResult.error;

  if (error && isLegacyBacktestSchemaError(error)) {
    const legacyResult = await supabase
      .from("backtest_sessions")
      .select(LEGACY_BACKTEST_SESSION_SELECT)
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
