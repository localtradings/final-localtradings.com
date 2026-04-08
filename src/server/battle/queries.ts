import "server-only";

import type {
  BattleHomeData,
  BattleResultRecord,
  BattleRoomSession,
} from "@/features/battle/types";
import { BATTLE_RECENT_RESULTS_LIMIT } from "@/features/battle/constants";
import { hasBattleWorkerEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

import { getActiveBattlePenalty } from "./penalties";
import { refreshBattleRoomView } from "./worker-client";

function normalizeBattleResultRecord(row: {
  room_id: string;
  room_type: BattleResultRecord["roomType"];
  duration_minutes: BattleResultRecord["durationMinutes"];
  symbol: string;
  timeframe: BattleResultRecord["timeframe"];
  started_at: string;
  ended_at: string;
  winner_user_id: string | null;
  winner_display_name: string | null;
  entries: BattleResultRecord["entries"];
}): BattleResultRecord {
  return {
    roomId: row.room_id,
    roomType: row.room_type,
    durationMinutes: row.duration_minutes,
    symbol: row.symbol,
    timeframe: row.timeframe,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    winnerUserId: row.winner_user_id,
    winnerDisplayName: row.winner_display_name,
    entries: row.entries,
  };
}

function isMissingBattleSchemaError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("battle_rooms") ||
    message.includes("battle_results") ||
    message.includes("battle_penalties") ||
    message.includes("battle_room_players") ||
    message.includes("is_pro")
  );
}

export async function getBattleHomeData(userId: string): Promise<BattleHomeData> {
  const supabase = await createSupabaseServerClient();
  const serviceRole = createSupabaseServiceRoleClient();
  const activePenalty = await getActiveBattlePenalty(userId);

  if (!supabase) {
    return {
      isWorkerConfigured: hasBattleWorkerEnv(),
      isPro: false,
      activePenalty,
      recentResults: [],
    };
  }

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_pro")
      .eq("id", userId)
      .maybeSingle(),
    (serviceRole ?? supabase)
      .from("battle_room_players")
      .select("room_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(200),
  ]);

  const recentRoomIds = Array.from(
    new Set(
      (membershipResult.data ?? []).flatMap((row) =>
        typeof row.room_id === "string" && row.room_id.length > 0 ? [row.room_id] : [],
      ),
    ),
  );

  const resultsResult =
    recentRoomIds.length > 0
      ? await (serviceRole ?? supabase)
          .from("battle_results")
          .select(
            "room_id, room_type, duration_minutes, symbol, timeframe, started_at, ended_at, winner_user_id, winner_display_name, entries",
          )
          .in("room_id", recentRoomIds)
          .order("ended_at", { ascending: false })
          .limit(BATTLE_RECENT_RESULTS_LIMIT)
      : { data: [], error: null };

  const isSchemaMissing =
    isMissingBattleSchemaError(profileResult.error) ||
    isMissingBattleSchemaError(membershipResult.error) ||
    isMissingBattleSchemaError(resultsResult.error);

  return {
    isWorkerConfigured: hasBattleWorkerEnv(),
    isPro: !profileResult.error && !isSchemaMissing ? Boolean(profileResult.data?.is_pro) : false,
    activePenalty,
    recentResults:
      !resultsResult.error && Array.isArray(resultsResult.data)
        ? (resultsResult.data as Array<Parameters<typeof normalizeBattleResultRecord>[0]>).map(
            normalizeBattleResultRecord,
          )
        : [],
  };
}

export async function getBattleRoomSession(
  roomId: string,
  userId: string,
  options?: { hydrateFromWorker?: boolean },
): Promise<BattleRoomSession> {
  const hydrateFromWorker = options?.hydrateFromWorker ?? true;
  if (!hasBattleWorkerEnv()) {
    return {
      roomId,
      viewerUserId: userId,
      isParticipant: false,
      initialView: null,
      roomToken: null,
      workerConfigured: false,
      workerSocketUrl: null,
    };
  }

  if (!hydrateFromWorker) {
    return {
      roomId,
      viewerUserId: userId,
      isParticipant: true,
      initialView: null,
      roomToken: null,
      workerConfigured: true,
      workerSocketUrl: null,
    };
  }

  const roomResult = await refreshBattleRoomView({ roomId, userId });
  if (!roomResult.ok) {
    return {
      roomId,
      viewerUserId: userId,
      isParticipant: false,
      initialView: null,
      roomToken: null,
      workerConfigured: true,
      workerSocketUrl: null,
    };
  }

  return {
    roomId,
    viewerUserId: userId,
    isParticipant: roomResult.data.room.viewerUserId === userId,
    initialView: roomResult.data.room,
    roomToken: null,
    workerConfigured: true,
    workerSocketUrl: null,
  };
}

export async function getBattleResult(userId: string, roomId: string) {
  const supabase = createSupabaseServiceRoleClient() ?? await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const participant = await supabase
    .from("battle_room_players")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (participant.error || !participant.data) {
    return null;
  }

  const { data, error } = await supabase
    .from("battle_results")
    .select(
      "room_id, room_type, duration_minutes, symbol, timeframe, started_at, ended_at, winner_user_id, winner_display_name, entries",
    )
    .eq("room_id", roomId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeBattleResultRecord(
    data as Parameters<typeof normalizeBattleResultRecord>[0],
  );
}
