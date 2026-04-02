"use server";

import { z } from "zod";

import {
  BACKTEST_INSTRUMENTS,
  BACKTEST_TIMEFRAMES,
} from "@/features/backtesting/constants";
import type {
  BacktestSessionRecord,
  BacktestSessionSaveInput,
} from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { normalizeBacktestSession } from "./queries";

type BacktestActionFailure = {
  ok: false;
  reason: string;
};

type BacktestSaveActionSuccess = {
  ok: true;
  session: BacktestSessionRecord;
};

type BacktestDeleteActionSuccess = {
  ok: true;
};

const MAX_BACKTEST_SESSIONS_PER_USER = 5;
const BACKTEST_SESSION_SUMMARY_SELECT =
  "id, symbol, timeframe, direction, order_type, volume, entry, stop, target, exit_price, status, result_r, result_amount, balance_after_trade, started_at, finished_at";

const backtestSessionSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.enum(
    BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]],
  ),
  timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
  direction: z.enum(["Long", "Short"]),
  orderType: z.enum(["market", "limit", "stop"]).nullable(),
  volume: z.number().positive().nullable(),
  entry: z.number().nullable(),
  stop: z.number().nullable(),
  target: z.number().nullable(),
  exitPrice: z.number().nullable(),
  status: z.enum([
    "draft",
    "armed",
    "active",
    "target_hit",
    "stop_hit",
    "manual_close",
    "unfinished",
    "breakeven",
  ]),
  resultR: z.number().nullable(),
  resultAmount: z.number().nullable(),
  balanceAfter: z.number().nullable(),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
});

async function pruneBacktestSessionsForUser(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return;
  }

  const { data, error } = await supabase
    .from("backtest_sessions")
    .select("id")
    .eq("user_id", userId)
    .order("started_at", { ascending: false })
    .range(MAX_BACKTEST_SESSIONS_PER_USER, MAX_BACKTEST_SESSIONS_PER_USER + 99);

  if (error || !data || data.length === 0) {
    return;
  }

  const sessionIdsToDelete = data.map((item) => item.id);
  if (sessionIdsToDelete.length === 0) {
    return;
  }

  await supabase
    .from("backtest_sessions")
    .delete()
    .eq("user_id", userId)
    .in("id", sessionIdsToDelete);
}

export async function saveBacktestSession(
  input: BacktestSessionSaveInput,
): Promise<BacktestSaveActionSuccess | BacktestActionFailure> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const parsed = backtestSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_session_payload" };
  }

  const payload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    direction: parsed.data.direction,
    order_type: parsed.data.orderType,
    volume: parsed.data.volume,
    entry: parsed.data.entry,
    stop: parsed.data.stop,
    target: parsed.data.target,
    exit_price: parsed.data.exitPrice,
    status: parsed.data.status,
    result_r: parsed.data.resultR,
    result_amount: parsed.data.resultAmount,
    balance_after_trade: parsed.data.balanceAfter,
    started_at: parsed.data.startedAt,
    finished_at: parsed.data.finishedAt,
  };

  const result = parsed.data.id
    ? await supabase
        .from("backtest_sessions")
        .update(payload)
        .eq("id", parsed.data.id)
        .eq("user_id", user.id)
        .select(BACKTEST_SESSION_SUMMARY_SELECT)
        .single()
    : await supabase
        .from("backtest_sessions")
        .insert(payload)
        .select(BACKTEST_SESSION_SUMMARY_SELECT)
        .single();

  if (result.error || !result.data) {
    return { ok: false, reason: result.error?.message ?? "save_failed" };
  }

  if (!parsed.data.id) {
    await pruneBacktestSessionsForUser(user.id);
  }

  return {
    ok: true,
    session: normalizeBacktestSession(
      result.data as Parameters<typeof normalizeBacktestSession>[0],
    ),
  };
}

export async function deleteBacktestSession(
  sessionId: string,
): Promise<BacktestDeleteActionSuccess | BacktestActionFailure> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const { error } = await supabase
    .from("backtest_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, reason: error.message };
  }

  return { ok: true };
}
