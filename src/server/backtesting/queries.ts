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

type BacktestSessionRow = {
  id: string;
  symbol: string;
  timeframe: string;
  window_start_at: string;
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

export function normalizeBacktestSession(
  row: BacktestSessionRow,
): BacktestSessionRecord {
  const direction = (row.direction === "Short" ? "Short" : "Long") as BacktestDirection;
  const instrument = getBacktestInstrument(row.symbol);
  const pricePrecision = instrument.pricePrecision;
  const fallbackDraft = {
    direction,
    orderType: "limit" as const,
    entry:
      typeof row.entry === "number" ? row.entry.toFixed(pricePrecision) : "",
    stop:
      typeof row.stop === "number" ? row.stop.toFixed(pricePrecision) : "",
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
    windowStartAt: row.window_start_at,
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

  const { data, error } = await supabase
    .from("backtest_sessions")
    .select(
      "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json",
    )
    .eq("user_id", userId)
    .order("started_at", { ascending: false });

  if (error || !data) {
    return [] as BacktestSessionRecord[];
  }

  return (data as BacktestSessionRow[]).map(normalizeBacktestSession);
}

export async function getBacktestSessionById(sessionId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("backtest_sessions")
    .select(
      "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeBacktestSession(data as BacktestSessionRow);
}
