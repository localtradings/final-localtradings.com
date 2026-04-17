import "server-only";

import type { BacktestCandle, BacktestSelection } from "@/features/backtesting/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const REPLAY_WINDOW_PROVIDER = "twelve_data";
export const REPLAY_WINDOW_READY_STATUS = "ready";

type ReplayWindowRow = {
  id: string;
  provider: string;
  source: string;
  symbol: string;
  timeframe: BacktestSelection["timeframe"];
  window_start_at: string;
  window_end_at: string;
  bars_count: number;
  initial_reveal_count: number;
  candles_json: unknown;
  quality_status: string;
  generated_at: string;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type ReplayWindowRecord = {
  id: string;
  provider: string;
  source: string;
  symbol: string;
  timeframe: BacktestSelection["timeframe"];
  windowStartAt: string;
  windowEndAt: string;
  barsCount: number;
  initialRevealCount: number;
  candles: BacktestCandle[];
  qualityStatus: string;
  generatedAt: string;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReplayWindowUpsertInput = {
  provider?: string;
  source?: string;
  symbol: string;
  timeframe: BacktestSelection["timeframe"];
  windowStartAt: string;
  windowEndAt: string;
  barsCount: number;
  initialRevealCount: number;
  candles: BacktestCandle[];
  qualityStatus?: string;
  generatedAt: string;
};

const REPLAY_WINDOW_SELECT =
  "id, provider, source, symbol, timeframe, window_start_at, window_end_at, bars_count, initial_reveal_count, candles_json, quality_status, generated_at, last_used_at, usage_count, created_at, updated_at";

function isReplayWindowSchemaError(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    message.includes("historical_replay_windows") ||
    message.includes("historical_window_id")
  );
}

function normalizeReplayWindowCandles(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const candles: BacktestCandle[] = [];
  const seenTimes = new Set<number>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candle = item as Record<string, unknown>;
    if (
      typeof candle.time !== "number" ||
      typeof candle.open !== "number" ||
      typeof candle.high !== "number" ||
      typeof candle.low !== "number" ||
      typeof candle.close !== "number" ||
      typeof candle.volume !== "number"
    ) {
      return null;
    }

    if (seenTimes.has(candle.time)) {
      continue;
    }

    seenTimes.add(candle.time);
    candles.push({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    });
  }

  candles.sort((left, right) => left.time - right.time);
  return candles.length > 0 ? candles : null;
}

function normalizeReplayWindow(row: ReplayWindowRow | null) {
  if (!row) {
    return null;
  }

  const candles = normalizeReplayWindowCandles(row.candles_json);
  if (!candles) {
    return null;
  }

  return {
    id: row.id,
    provider: row.provider,
    source: row.source,
    symbol: row.symbol,
    timeframe: row.timeframe,
    windowStartAt: row.window_start_at,
    windowEndAt: row.window_end_at,
    barsCount: row.bars_count,
    initialRevealCount: row.initial_reveal_count,
    candles,
    qualityStatus: row.quality_status,
    generatedAt: row.generated_at,
    lastUsedAt: row.last_used_at,
    usageCount: row.usage_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ReplayWindowRecord;
}

export function sliceReplayWindowCandles(window: ReplayWindowRecord, barsRequested: number) {
  const boundedBarsRequested = Math.max(1, Math.min(barsRequested, window.candles.length));
  return window.candles.slice(0, boundedBarsRequested);
}

export async function getReadyReplayWindowCount(selection: BacktestSelection) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("historical_replay_windows")
    .select("id", { count: "exact", head: true })
    .eq("symbol", selection.symbol)
    .eq("timeframe", selection.timeframe)
    .eq("quality_status", REPLAY_WINDOW_READY_STATUS);

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function listReadyReplayWindows(selection: BacktestSelection, limit = 10) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return [] as ReplayWindowRecord[];
  }

  const { data, error } = await supabase
    .from("historical_replay_windows")
    .select(REPLAY_WINDOW_SELECT)
    .eq("symbol", selection.symbol)
    .eq("timeframe", selection.timeframe)
    .eq("quality_status", REPLAY_WINDOW_READY_STATUS)
    .order("usage_count", { ascending: true })
    .order("last_used_at", { ascending: true, nullsFirst: true })
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return [] as ReplayWindowRecord[];
    }

    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => normalizeReplayWindow(row as ReplayWindowRow))
    .filter((row): row is ReplayWindowRecord => Boolean(row));
}

export async function pickReadyReplayWindow(selection: BacktestSelection) {
  const candidates = await listReadyReplayWindows(selection, 10);
  if (candidates.length === 0) {
    return null;
  }

  const lowestUsageCount = Math.min(...candidates.map((candidate) => candidate.usageCount));
  const leastUsed = candidates.filter((candidate) => candidate.usageCount === lowestUsageCount);
  const oldestLastUsed = leastUsed.reduce<string | null>((oldest, candidate) => {
    if (!candidate.lastUsedAt) {
      return null;
    }

    if (!oldest) {
      return candidate.lastUsedAt;
    }

    return candidate.lastUsedAt < oldest ? candidate.lastUsedAt : oldest;
  }, leastUsed[0]?.lastUsedAt ?? null);
  const selectionPool =
    oldestLastUsed === null
      ? leastUsed.filter((candidate) => candidate.lastUsedAt === null)
      : leastUsed.filter((candidate) => candidate.lastUsedAt === oldestLastUsed);
  const picked = selectionPool[Math.floor(Math.random() * selectionPool.length)] ?? leastUsed[0];

  if (!picked) {
    return null;
  }

  await recordReplayWindowUsage(picked.id);
  return picked;
}

export async function getReplayWindowById(id: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("historical_replay_windows")
    .select(REPLAY_WINDOW_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return normalizeReplayWindow((data as ReplayWindowRow | null) ?? null);
}

export async function recordReplayWindowUsage(id: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return;
  }

  const nowIso = new Date().toISOString();
  const existing = await supabase
    .from("historical_replay_windows")
    .select("usage_count")
    .eq("id", id)
    .maybeSingle();

  if (existing.error) {
    if (isReplayWindowSchemaError(existing.error)) {
      return;
    }

    throw new Error(existing.error.message);
  }

  const usageCount = Math.max(0, Number(existing.data?.usage_count ?? 0)) + 1;
  const { error } = await supabase
    .from("historical_replay_windows")
    .update({
      usage_count: usageCount,
      last_used_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", id);

  if (error && !isReplayWindowSchemaError(error)) {
    throw new Error(error.message);
  }
}

export async function upsertReplayWindow(input: ReplayWindowUpsertInput) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("historical_replay_windows")
    .upsert(
      {
        provider: input.provider ?? REPLAY_WINDOW_PROVIDER,
        source: input.source ?? "generated",
        symbol: input.symbol,
        timeframe: input.timeframe,
        window_start_at: input.windowStartAt,
        window_end_at: input.windowEndAt,
        bars_count: input.barsCount,
        initial_reveal_count: input.initialRevealCount,
        candles_json: input.candles,
        quality_status: input.qualityStatus ?? REPLAY_WINDOW_READY_STATUS,
        generated_at: input.generatedAt,
        updated_at: nowIso,
      },
      { onConflict: "provider,symbol,timeframe,window_start_at,bars_count" },
    )
    .select(REPLAY_WINDOW_SELECT)
    .single();

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  return normalizeReplayWindow((data as ReplayWindowRow | null) ?? null);
}

export async function deleteReplayWindowsOlderThan(input: {
  readyBeforeIso: string;
  badBeforeIso: string;
}) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return { readyDeleted: 0, badDeleted: 0 };
  }

  const readyDelete = await supabase
    .from("historical_replay_windows")
    .delete({ count: "exact" })
    .eq("quality_status", REPLAY_WINDOW_READY_STATUS)
    .lt("generated_at", input.readyBeforeIso);

  if (readyDelete.error) {
    if (isReplayWindowSchemaError(readyDelete.error)) {
      return { readyDeleted: 0, badDeleted: 0 };
    }

    throw new Error(readyDelete.error.message);
  }

  const badDelete = await supabase
    .from("historical_replay_windows")
    .delete({ count: "exact" })
    .neq("quality_status", REPLAY_WINDOW_READY_STATUS)
    .lt("generated_at", input.badBeforeIso);

  if (badDelete.error) {
    if (isReplayWindowSchemaError(badDelete.error)) {
      return {
        readyDeleted: readyDelete.count ?? 0,
        badDeleted: 0,
      };
    }

    throw new Error(badDelete.error.message);
  }

  return {
    readyDeleted: readyDelete.count ?? 0,
    badDeleted: badDelete.count ?? 0,
  };
}

export async function listReplayWindowIdsExceedingCap(
  selection: BacktestSelection,
  keepCount: number,
) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return [] as string[];
  }

  const { data, error } = await supabase
    .from("historical_replay_windows")
    .select("id")
    .eq("symbol", selection.symbol)
    .eq("timeframe", selection.timeframe)
    .eq("quality_status", REPLAY_WINDOW_READY_STATUS)
    .order("last_used_at", { ascending: false, nullsFirst: false })
    .order("generated_at", { ascending: false });

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return [] as string[];
    }

    throw new Error(error.message);
  }

  return (data ?? [])
    .slice(keepCount)
    .flatMap((row) => (typeof row.id === "string" ? [row.id] : []));
}

export async function deleteReplayWindowIds(ids: string[]) {
  if (ids.length === 0) {
    return 0;
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from("historical_replay_windows")
    .delete({ count: "exact" })
    .in("id", ids);

  if (error) {
    if (isReplayWindowSchemaError(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}
