import "server-only";

import { BATTLE_PENALTY_MS } from "@/features/battle/constants";
import type { BattlePenaltyReason, BattlePenaltyRecord } from "@/features/battle/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

function normalizePenaltyRow(row: {
  id: string;
  room_id: string | null;
  user_id: string;
  reason: BattlePenaltyReason;
  starts_at: string;
  ends_at: string;
  created_at: string;
}): BattlePenaltyRecord {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    reason: row.reason,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  };
}

export async function getActiveBattlePenalty(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("battle_penalties")
    .select("id, room_id, user_id, reason, starts_at, ends_at, created_at")
    .eq("user_id", userId)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizePenaltyRow(data);
}

export async function createBattlePenalty(input: {
  userId: string;
  roomId: string | null;
  reason: BattlePenaltyReason;
}) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data: existing } = await supabase
    .from("battle_penalties")
    .select("id, room_id, user_id, reason, starts_at, ends_at, created_at")
    .eq("user_id", input.userId)
    .eq("reason", input.reason)
    .eq("room_id", input.roomId)
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return normalizePenaltyRow(existing);
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + BATTLE_PENALTY_MS);

  const { data, error } = await supabase
    .from("battle_penalties")
    .insert({
      user_id: input.userId,
      room_id: input.roomId,
      reason: input.reason,
      starts_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select("id, room_id, user_id, reason, starts_at, ends_at, created_at")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizePenaltyRow(data);
}
