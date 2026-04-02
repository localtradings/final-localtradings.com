"use server";

import { z } from "zod";

import {
  BACKTEST_BARS_REQUESTED,
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
const BACKTEST_SESSION_LEGACY_SELECT =
  "id, symbol, timeframe, direction, entry, stop, target, status, result_r, started_at, finished_at, session_state_json";

function resolveWindowStartAt(windowStartAt: string | null | undefined, startedAt: string) {
  if (
    typeof windowStartAt === "string" &&
    windowStartAt.length > 0 &&
    Number.isFinite(Date.parse(windowStartAt))
  ) {
    return new Date(windowStartAt).toISOString();
  }

  return new Date(startedAt).toISOString();
}

function buildScenarioId(input: {
  symbol: string;
  timeframe: string;
  windowStartAt: string;
}) {
  return `${input.symbol}:${input.timeframe}:${input.windowStartAt}`;
}

const backtestSessionSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.enum(
    BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]],
  ),
  timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
  windowStartAt: z.iso.datetime(),
  barsRequested: z.number().int().positive().max(BACKTEST_BARS_REQUESTED),
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

function isLegacySchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("order_type") ||
    message.includes("exit_price") ||
    message.includes("result_amount") ||
    message.includes("balance_after_trade") ||
    message.includes("volume") ||
    message.includes("window_start_at") ||
    message.includes("bars_requested")
  );
}

function isHistoricalWindowSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("window_start_at") || message.includes("bars_requested");
}

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

  const resolvedWindowStartAt = resolveWindowStartAt(
    parsed.data.windowStartAt,
    parsed.data.startedAt,
  );
  const resolvedBarsRequested =
    Number.isInteger(parsed.data.barsRequested) && parsed.data.barsRequested > 0
      ? parsed.data.barsRequested
      : BACKTEST_BARS_REQUESTED;

  const payload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    scenario_id: buildScenarioId({
      symbol: parsed.data.symbol,
      timeframe: parsed.data.timeframe,
      windowStartAt: resolvedWindowStartAt,
    }),
    window_start_at: resolvedWindowStartAt,
    bars_requested: resolvedBarsRequested,
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
  const legacyPayload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    scenario_id: buildScenarioId({
      symbol: parsed.data.symbol,
      timeframe: parsed.data.timeframe,
      windowStartAt: resolvedWindowStartAt,
    }),
    window_start_at: resolvedWindowStartAt,
    bars_requested: resolvedBarsRequested,
    direction: parsed.data.direction,
    entry: parsed.data.entry,
    stop: parsed.data.stop,
    target: parsed.data.target,
    status: parsed.data.status,
    result_r: parsed.data.resultR,
    started_at: parsed.data.startedAt,
    finished_at: parsed.data.finishedAt,
    thesis: "",
    review_notes: "",
    session_state_json: {
      execution: {
        orderType: parsed.data.orderType,
        volume: parsed.data.volume,
        exitPrice: parsed.data.exitPrice,
        resultAmount: parsed.data.resultAmount,
        balanceAfterTrade: parsed.data.balanceAfter,
      },
    },
  };
  const legacyPreWindowPayload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    scenario_id: buildScenarioId({
      symbol: parsed.data.symbol,
      timeframe: parsed.data.timeframe,
      windowStartAt: resolvedWindowStartAt,
    }),
    direction: parsed.data.direction,
    entry: parsed.data.entry,
    stop: parsed.data.stop,
    target: parsed.data.target,
    status: parsed.data.status,
    result_r: parsed.data.resultR,
    started_at: parsed.data.startedAt,
    finished_at: parsed.data.finishedAt,
    thesis: "",
    review_notes: "",
    session_state_json: {
      execution: {
        orderType: parsed.data.orderType,
        volume: parsed.data.volume,
        exitPrice: parsed.data.exitPrice,
        resultAmount: parsed.data.resultAmount,
        balanceAfterTrade: parsed.data.balanceAfter,
      },
    },
  };

  const primaryResult = parsed.data.id
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

  let data: unknown = primaryResult.data;
  let error = primaryResult.error;

  if (error && isLegacySchemaError(error)) {
    const legacyResult = parsed.data.id
      ? await supabase
          .from("backtest_sessions")
          .update(legacyPayload)
          .eq("id", parsed.data.id)
          .eq("user_id", user.id)
          .select(BACKTEST_SESSION_LEGACY_SELECT)
          .single()
      : await supabase
          .from("backtest_sessions")
          .insert(legacyPayload)
          .select(BACKTEST_SESSION_LEGACY_SELECT)
          .single();

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error && isHistoricalWindowSchemaError(error)) {
    const legacyPreWindowResult = parsed.data.id
      ? await supabase
          .from("backtest_sessions")
          .update(legacyPreWindowPayload)
          .eq("id", parsed.data.id)
          .eq("user_id", user.id)
          .select(BACKTEST_SESSION_LEGACY_SELECT)
          .single()
      : await supabase
          .from("backtest_sessions")
          .insert(legacyPreWindowPayload)
          .select(BACKTEST_SESSION_LEGACY_SELECT)
          .single();

    data = legacyPreWindowResult.data;
    error = legacyPreWindowResult.error;
  }

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "save_failed" };
  }

  if (!parsed.data.id) {
    await pruneBacktestSessionsForUser(user.id);
  }

  return {
    ok: true,
    session: normalizeBacktestSession(
      data as Parameters<typeof normalizeBacktestSession>[0],
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
