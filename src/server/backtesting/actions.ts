"use server";

import { z } from "zod";

import {
  BACKTEST_BARS_REQUESTED,
  BACKTEST_INITIAL_REVEAL_COUNT,
  BACKTEST_INSTRUMENTS,
  BACKTEST_TIMEFRAMES,
  getBacktestInstrument,
} from "@/features/backtesting/constants";
import { createDuplicateSnapshot } from "@/features/backtesting/utils/session-state";
import { sanitizeSnapshot } from "@/features/backtesting/utils/session-state";
import type {
  BacktestSessionRecord,
  BacktestSessionSaveInput,
  BacktestSessionWorkspaceData,
} from "@/features/backtesting/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  getHistoricalBacktestCandlesForWindow,
} from "./provider-candles";
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

type BacktestLoadActionSuccess = {
  ok: true;
  workspace: BacktestSessionWorkspaceData;
};

const MAX_BACKTEST_SESSIONS_PER_USER = 25;

const backtestSessionSchema = z.object({
  id: z.string().uuid().optional(),
  symbol: z.enum(
    BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]],
  ),
  timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
  windowStartAt: z.iso.datetime(),
  barsRequested: z.number().int().positive().max(BACKTEST_BARS_REQUESTED),
  direction: z.enum(["Long", "Short"]),
  entry: z.number().nullable(),
  stop: z.number().nullable(),
  target: z.number().nullable(),
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
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  thesis: z.string().max(1200),
  reviewNotes: z.string().max(2400),
  sessionStateJson: z.unknown(),
});

function buildFallbackDraft(input: z.infer<typeof backtestSessionSchema>) {
  const instrument = getBacktestInstrument(input.symbol);
  const pricePrecision = instrument.pricePrecision;

  return {
    direction: input.direction,
    orderType: "limit" as const,
    entry: typeof input.entry === "number" ? input.entry.toFixed(pricePrecision) : "",
    stop: typeof input.stop === "number" ? input.stop.toFixed(pricePrecision) : "",
    target: typeof input.target === "number" ? input.target.toFixed(pricePrecision) : "",
    volume: "1.00",
    thesis: input.thesis,
    reviewNotes: input.reviewNotes,
  };
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
    .order("finished_at", { ascending: false })
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
    return { ok: false, reason: "supabase_not_configured" as const };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, reason: "not_authenticated" as const };
  }

  const parsed = backtestSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_session_payload" as const };
  }

  const sanitizedSnapshot = sanitizeSnapshot(
    parsed.data.sessionStateJson,
    buildFallbackDraft(parsed.data),
    BACKTEST_INITIAL_REVEAL_COUNT,
  );

  const payload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    window_start_at: parsed.data.windowStartAt,
    bars_requested: parsed.data.barsRequested,
    direction: parsed.data.direction,
    entry: parsed.data.entry,
    stop: parsed.data.stop,
    target: parsed.data.target,
    status: parsed.data.status,
    result_r: parsed.data.resultR,
    started_at: parsed.data.startedAt,
    finished_at: parsed.data.finishedAt,
    thesis: parsed.data.thesis,
    review_notes: parsed.data.reviewNotes,
    session_state_json: sanitizedSnapshot,
  };

  const query = parsed.data.id
    ? supabase
        .from("backtest_sessions")
        .update(payload)
        .eq("id", parsed.data.id)
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

  if (!parsed.data.id) {
    await pruneBacktestSessionsForUser(user.id);
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

  const existing = await getBacktestSessionById(sessionId, user.id);
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

export async function loadBacktestSessionWorkspace(
  sessionId: string,
): Promise<BacktestLoadActionSuccess | BacktestActionFailure> {
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

  const session = await getBacktestSessionById(sessionId, user.id);
  if (!session) {
    return { ok: false, reason: "session_not_found" as const };
  }

  try {
    const dataset = await getHistoricalBacktestCandlesForWindow(
      {
        symbol: session.symbol,
        timeframe: session.timeframe,
      },
      session.windowStartAt,
      session.barsRequested,
    );

    return {
      ok: true,
      workspace: {
        session,
        dataset,
      },
    };
  } catch {
    return { ok: false, reason: "session_window_unavailable" as const };
  }
}
