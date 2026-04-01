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
const FULL_BACKTEST_SESSION_SELECT =
  "id, symbol, timeframe, window_start_at, bars_requested, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json";
const LEGACY_BACKTEST_SESSION_SELECT =
  "id, symbol, timeframe, direction, entry, stop, target, status, result_r, started_at, finished_at, thesis, review_notes, session_state_json";

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
    orderType: "market" as const,
    entry: typeof input.entry === "number" ? input.entry.toFixed(pricePrecision) : "",
    hasStop: typeof input.stop === "number",
    stop: typeof input.stop === "number" ? input.stop.toFixed(pricePrecision) : "",
    hasTarget: typeof input.target === "number",
    target: typeof input.target === "number" ? input.target.toFixed(pricePrecision) : "",
    volume: "1.00",
    thesis: input.thesis,
    reviewNotes: input.reviewNotes,
  };
}

function isLegacyBacktestSchemaError(error: { message?: string } | null) {
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
    scenario_id: buildScenarioId(parsed.data),
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
  const legacyPayload = {
    user_id: user.id,
    symbol: parsed.data.symbol,
    timeframe: parsed.data.timeframe,
    scenario_id: buildScenarioId(parsed.data),
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
        .select(FULL_BACKTEST_SESSION_SELECT)
        .single()
    : supabase
        .from("backtest_sessions")
        .insert(payload)
        .select(FULL_BACKTEST_SESSION_SELECT)
        .single();

  const primaryResult = await query;
  let data: unknown = primaryResult.data;
  let error = primaryResult.error;

  if (error && isLegacyBacktestSchemaError(error)) {
    const legacyQuery = parsed.data.id
      ? supabase
          .from("backtest_sessions")
          .update(legacyPayload)
          .eq("id", parsed.data.id)
          .eq("user_id", user.id)
          .select(LEGACY_BACKTEST_SESSION_SELECT)
          .single()
      : supabase
          .from("backtest_sessions")
          .insert(legacyPayload)
          .select(LEGACY_BACKTEST_SESSION_SELECT)
          .single();

    const legacyResult = await legacyQuery;
    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "save_failed" as const };
  }

  if (!parsed.data.id) {
    await pruneBacktestSessionsForUser(user.id);
  }

  return {
    ok: true,
    session: normalizeBacktestSession(data as Parameters<typeof normalizeBacktestSession>[0]),
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
  const duplicateEntry = Number.parseFloat(snapshot.tradeDraft.entry);
  const duplicateStop = snapshot.tradeDraft.hasStop
    ? Number.parseFloat(snapshot.tradeDraft.stop)
    : Number.NaN;
  const duplicateTarget = snapshot.tradeDraft.hasTarget
    ? Number.parseFloat(snapshot.tradeDraft.target)
    : Number.NaN;
  const duplicateDraft = {
    ...snapshot.tradeDraft,
    reviewNotes: "",
  };
  const sanitizedSnapshot = sanitizeSnapshot(
    snapshot,
    duplicateDraft,
    BACKTEST_INITIAL_REVEAL_COUNT,
  );
  const payload = {
    user_id: user.id,
    symbol: existing.symbol,
    timeframe: existing.timeframe,
    scenario_id: buildScenarioId({
      symbol: existing.symbol,
      timeframe: existing.timeframe,
      windowStartAt: existing.windowStartAt,
    }),
    window_start_at: existing.windowStartAt,
    bars_requested: existing.barsRequested,
    direction: duplicateDraft.direction,
    entry: Number.isFinite(duplicateEntry) ? duplicateEntry : existing.entry,
    stop: Number.isFinite(duplicateStop) ? duplicateStop : existing.stop,
    target: Number.isFinite(duplicateTarget) ? duplicateTarget : existing.target,
    status: "draft" as const,
    result_r: null,
    started_at: now,
    finished_at: null,
    thesis: duplicateDraft.thesis,
    review_notes: "",
    session_state_json: sanitizedSnapshot,
  };
  const legacyPayload = {
    user_id: user.id,
    symbol: existing.symbol,
    timeframe: existing.timeframe,
    scenario_id: buildScenarioId({
      symbol: existing.symbol,
      timeframe: existing.timeframe,
      windowStartAt: existing.windowStartAt,
    }),
    direction: duplicateDraft.direction,
    entry: Number.isFinite(duplicateEntry) ? duplicateEntry : existing.entry,
    stop: Number.isFinite(duplicateStop) ? duplicateStop : existing.stop,
    target: Number.isFinite(duplicateTarget) ? duplicateTarget : existing.target,
    status: "draft" as const,
    result_r: null,
    started_at: now,
    finished_at: null,
    thesis: duplicateDraft.thesis,
    review_notes: "",
    session_state_json: sanitizedSnapshot,
  };

  const primaryResult = await supabase
    .from("backtest_sessions")
    .insert(payload)
    .select(FULL_BACKTEST_SESSION_SELECT)
    .single();

  let data: unknown = primaryResult.data;
  let error = primaryResult.error;

  if (error && isLegacyBacktestSchemaError(error)) {
    const legacyResult = await supabase
      .from("backtest_sessions")
      .insert(legacyPayload)
      .select(LEGACY_BACKTEST_SESSION_SELECT)
      .single();

    data = legacyResult.data;
    error = legacyResult.error;
  }

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "duplicate_failed" };
  }

  await pruneBacktestSessionsForUser(user.id);

  return {
    ok: true,
    session: normalizeBacktestSession(data as Parameters<typeof normalizeBacktestSession>[0]),
  };
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
