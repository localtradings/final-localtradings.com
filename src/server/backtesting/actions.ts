"use server";

import { createDuplicateSnapshot } from "@/features/backtesting/utils/session-state";
import type {
  BacktestSessionRecord,
  BacktestSessionSaveInput,
} from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getBacktestSessionById,
  normalizeBacktestSession,
} from "./queries";

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

export async function saveBacktestSession(
  input: BacktestSessionSaveInput,
): Promise<BacktestSaveActionSuccess | BacktestActionFailure> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" as const };
  }

  const payload = {
    user_id: user.id,
    symbol: input.symbol,
    timeframe: input.timeframe,
    window_start_at: input.windowStartAt,
    bars_requested: input.barsRequested,
    direction: input.direction,
    entry: input.entry,
    stop: input.stop,
    target: input.target,
    status: input.status,
    result_r: input.resultR,
    started_at: input.startedAt,
    finished_at: input.finishedAt,
    thesis: input.thesis,
    review_notes: input.reviewNotes,
    session_state_json: input.sessionStateJson,
  };

  const query = input.id
    ? supabase
        .from("backtest_sessions")
        .update(payload)
        .eq("id", input.id)
        .eq("user_id", user.id)
        .select(
          "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json",
        )
        .single()
    : supabase
        .from("backtest_sessions")
        .insert(payload)
        .select(
          "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json",
        )
        .single();

  const { data, error } = await query;

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "save_failed" as const };
  }

  return {
    ok: true,
    session: normalizeBacktestSession(data),
  };
}

export async function duplicateBacktestSession(
  sessionId: string,
): Promise<BacktestSaveActionSuccess | BacktestActionFailure> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" as const };
  }

  const existing = await getBacktestSessionById(sessionId);
  if (!existing) {
    return { ok: false, reason: "session_not_found" as const };
  }

  const snapshot = createDuplicateSnapshot(existing);
  const now = new Date().toISOString();

  return saveBacktestSession({
    symbol: existing.symbol,
    timeframe: existing.timeframe,
    windowStartAt: existing.windowStartAt,
    barsRequested: existing.barsRequested,
    direction: snapshot.tradeDraft.direction,
    entry: Number(snapshot.tradeDraft.entry),
    stop: Number(snapshot.tradeDraft.stop),
    target: Number(snapshot.tradeDraft.target),
    status: "draft",
    resultR: null,
    startedAt: now,
    finishedAt: null,
    thesis: snapshot.tradeDraft.thesis,
    reviewNotes: "",
    sessionStateJson: snapshot,
  });
}

export async function deleteBacktestSession(
  sessionId: string,
): Promise<BacktestDeleteActionSuccess | BacktestActionFailure> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, reason: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" as const };
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
