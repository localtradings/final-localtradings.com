import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const BATTLE_CACHE_CLEANUP_INTERVAL_HOURS = 6;
export const BATTLE_STALE_LOBBY_RETENTION_HOURS = 12;
export const BATTLE_CANCELLED_ROOM_RETENTION_DAYS = 30;
export const BATTLE_PENALTY_RETENTION_DAYS = 90;
export const SECURITY_RATE_LIMIT_RETENTION_DAYS = 7;

export type BattleRetentionSummary = {
  cacheRowsDeleted: number;
  staleLobbyRoomsDeleted: number;
  cancelledRoomsDeleted: number;
  penaltiesDeleted: number;
  rateLimitRowsDeleted: number;
  executedAt: string;
};

function hoursAgo(now: Date, hours: number) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function deleteExpiredBattleCandleCache(nowIso: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { count, error } = await supabase
    .from("battle_candle_cache")
    .delete({ count: "exact" })
    .lte("expires_at", nowIso);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function deleteStaleLobbyRooms(lobbyCutoffIso: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { count, error } = await supabase
    .from("battle_rooms")
    .delete({ count: "exact" })
    .eq("status", "lobby")
    .lt("updated_at", lobbyCutoffIso);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function deleteCancelledRooms(cancelledCutoffIso: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const endedCancelled = await supabase
    .from("battle_rooms")
    .delete({ count: "exact" })
    .eq("status", "cancelled")
    .lt("ended_at", cancelledCutoffIso);

  if (endedCancelled.error) {
    throw new Error(endedCancelled.error.message);
  }

  const updatedCancelled = await supabase
    .from("battle_rooms")
    .delete({ count: "exact" })
    .eq("status", "cancelled")
    .is("ended_at", null)
    .lt("updated_at", cancelledCutoffIso);

  if (updatedCancelled.error) {
    throw new Error(updatedCancelled.error.message);
  }

  return (endedCancelled.count ?? 0) + (updatedCancelled.count ?? 0);
}

async function deleteExpiredBattlePenalties(penaltyCutoffIso: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { count, error } = await supabase
    .from("battle_penalties")
    .delete({ count: "exact" })
    .lt("ends_at", penaltyCutoffIso);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function deleteExpiredSecurityRateLimits(rateLimitCutoffIso: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const { count, error } = await supabase
    .from("security_rate_limits")
    .delete({ count: "exact" })
    .lt("window_starts_at", rateLimitCutoffIso);

  if (error) {
    if (error.code === "42P01" || error.message.includes("security_rate_limits")) {
      console.error("[battle-retention] security_rate_limits_missing", error.message);
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function runBattleRetentionCleanup(now = new Date()): Promise<BattleRetentionSummary> {
  const nowIso = now.toISOString();
  const staleLobbyCutoffIso = hoursAgo(now, BATTLE_STALE_LOBBY_RETENTION_HOURS);
  const cancelledCutoffIso = daysAgo(now, BATTLE_CANCELLED_ROOM_RETENTION_DAYS);
  const penaltyCutoffIso = daysAgo(now, BATTLE_PENALTY_RETENTION_DAYS);
  const rateLimitCutoffIso = daysAgo(now, SECURITY_RATE_LIMIT_RETENTION_DAYS);

  const [
    cacheRowsDeleted,
    staleLobbyRoomsDeleted,
    cancelledRoomsDeleted,
    penaltiesDeleted,
    rateLimitRowsDeleted,
  ] = await Promise.all([
    deleteExpiredBattleCandleCache(nowIso),
    deleteStaleLobbyRooms(staleLobbyCutoffIso),
    deleteCancelledRooms(cancelledCutoffIso),
    deleteExpiredBattlePenalties(penaltyCutoffIso),
    deleteExpiredSecurityRateLimits(rateLimitCutoffIso),
  ]);

  return {
    cacheRowsDeleted,
    staleLobbyRoomsDeleted,
    cancelledRoomsDeleted,
    penaltiesDeleted,
    rateLimitRowsDeleted,
    executedAt: nowIso,
  };
}
