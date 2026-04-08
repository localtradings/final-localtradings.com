import "server-only";

import type { BattleRoomSnapshot } from "@/features/battle/types";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function persistBattleRoomSnapshot(room: BattleRoomSnapshot) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return;
  }

  await supabase.from("battle_rooms").upsert({
    id: room.roomId,
    creator_user_id: room.players.find((player) => player.isCreator)?.userId ?? null,
    room_type: room.roomType,
    status: room.phase,
    duration_minutes: room.durationMinutes,
    symbol: room.symbol,
    timeframe: room.timeframe,
    lobby_code: room.lobbyCode,
    max_players: room.maxPlayers,
    countdown_ends_at: room.countdownEndsAt,
    started_at: room.officialStartAt,
    ended_at: room.phase === "finished" || room.phase === "cancelled" ? room.officialEndAt : null,
    winner_user_id: room.winnerUserId,
    cancel_reason: room.cancelReason,
    updated_at: new Date().toISOString(),
  });

  const playerIds = room.players.map((player) => player.userId);

  if (playerIds.length === 0) {
    await supabase.from("battle_room_players").delete().eq("room_id", room.roomId);
    return;
  }

  await supabase.from("battle_room_players").upsert(
    room.players.map((player) => ({
      room_id: room.roomId,
      user_id: player.userId,
      display_name: player.displayName,
      is_creator: player.isCreator,
      status: player.status,
      joined_at: player.joinedAt,
      ready_at: player.isReady ? new Date().toISOString() : null,
      removed_at:
        player.status === "removed_unready" ||
        player.status === "left_lobby" ||
        player.status === "left_early" ||
        player.status === "forfeit" ||
        player.status === "no_trade"
          ? new Date().toISOString()
          : null,
      last_heartbeat_at: player.lastHeartbeatAt,
      disconnected_at: player.disconnectedAt,
      official_balance: player.officialBalance,
      official_rank: player.officialRank,
      trades_closed: player.tradesClosed,
      winning_trades: player.wins,
      losing_trades: player.losses,
      has_open_trade: player.hasOpenTrade,
    })),
    { onConflict: "room_id,user_id" },
  );

  const { data: persistedPlayers } = await supabase
    .from("battle_room_players")
    .select("user_id")
    .eq("room_id", room.roomId);

  const stalePlayerIds =
    persistedPlayers
      ?.map((player) => player.user_id)
      .filter((userId): userId is string => !playerIds.includes(userId)) ?? [];

  if (stalePlayerIds.length > 0) {
    await supabase
      .from("battle_room_players")
      .delete()
      .eq("room_id", room.roomId)
      .in("user_id", stalePlayerIds);
  }
}
