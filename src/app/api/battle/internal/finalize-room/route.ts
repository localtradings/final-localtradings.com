import { NextResponse } from "next/server";
import { z } from "zod";

import type { BattleFinalizePayload } from "@/features/battle/types";
import { env, hasBattleWorkerEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { createBattlePenalty } from "@/server/battle/penalties";
import {
  buildBattleResultEntries,
  getPenaltyReasonForStatus,
} from "@/server/battle/result-calculation";

const finalizeSchema = z.object({
  room: z.object({
    roomId: z.string().uuid(),
    roomType: z.union([z.literal("public"), z.literal("private")]),
    durationMinutes: z.union([z.literal(10), z.literal(15), z.literal(30), z.literal(45)]),
    symbol: z.string(),
    timeframe: z.string(),
    phase: z.union([z.literal("finished"), z.literal("cancelled")]),
    startedAt: z.string().nullable(),
    endedAt: z.string(),
    winnerUserId: z.string().uuid().nullable(),
    cancelReason: z.string().nullable(),
    lobbyCode: z.string().nullable(),
  }),
  players: z.array(
    z.object({
      userId: z.string().uuid(),
      displayName: z.string(),
      status: z.string(),
      finalBalance: z.number(),
      realizedPnl: z.number(),
      rank: z.number().int().positive(),
      totalTrades: z.number().int().nonnegative(),
      winningTrades: z.number().int().nonnegative(),
      losingTrades: z.number().int().nonnegative(),
      penaltyReason: z
        .union([z.literal("left_early"), z.literal("forfeit"), z.literal("no_trade")])
        .nullable(),
    }),
  ),
});

export async function POST(request: Request) {
  if (
    !hasBattleWorkerEnv() ||
    request.headers.get("x-battle-internal-secret") !== env.battleSharedSecret
  ) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized", message: "Battle worker secret mismatch." },
      { status: 401 },
    );
  }

  const parsed = finalizeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload", message: "Battle room finalize payload is invalid." },
      { status: 400 },
    );
  }

  const payload = parsed.data as BattleFinalizePayload;
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "supabase_not_configured", message: "Supabase service role is not configured." },
      { status: 500 },
    );
  }

  const resultEntries = buildBattleResultEntries(payload);
  const winner = resultEntries.find((entry) => entry.rank === 1) ?? null;

  const { error: roomError } = await supabase.from("battle_rooms").upsert({
    id: payload.room.roomId,
    room_type: payload.room.roomType,
    status: payload.room.phase,
    duration_minutes: payload.room.durationMinutes,
    symbol: payload.room.symbol,
    timeframe: payload.room.timeframe,
    lobby_code: payload.room.lobbyCode,
    started_at: payload.room.startedAt,
    ended_at: payload.room.endedAt,
    winner_user_id: payload.room.winnerUserId,
    cancel_reason: payload.room.cancelReason,
    updated_at: new Date().toISOString(),
  });

  if (roomError) {
    return NextResponse.json(
      { ok: false, reason: "room_upsert_failed", message: roomError.message },
      { status: 500 },
    );
  }

  if (payload.players.length > 0) {
    const { error: playersError } = await supabase.from("battle_room_players").upsert(
      payload.players.map((player) => ({
        room_id: payload.room.roomId,
        user_id: player.userId,
        display_name: player.displayName,
        status: player.status,
        official_balance: player.finalBalance,
        official_rank: player.rank,
        trades_closed: player.totalTrades,
        winning_trades: player.winningTrades,
        losing_trades: player.losingTrades,
        has_open_trade: false,
        removed_at:
          player.status === "left_early" || player.status === "forfeit"
            ? payload.room.endedAt
            : null,
      })),
      { onConflict: "room_id,user_id" },
    );

    if (playersError) {
      return NextResponse.json(
        { ok: false, reason: "players_upsert_failed", message: playersError.message },
        { status: 500 },
      );
    }
  }

  const { error: resultError } = await supabase.from("battle_results").upsert({
    room_id: payload.room.roomId,
    room_type: payload.room.roomType,
    duration_minutes: payload.room.durationMinutes,
    symbol: payload.room.symbol,
    timeframe: payload.room.timeframe,
    started_at: payload.room.startedAt ?? payload.room.endedAt,
    ended_at: payload.room.endedAt,
    winner_user_id: payload.room.winnerUserId,
    winner_display_name: winner?.displayName ?? null,
    entries: resultEntries,
  });

  if (resultError) {
    return NextResponse.json(
      { ok: false, reason: "result_upsert_failed", message: resultError.message },
      { status: 500 },
    );
  }

  await Promise.all(
    payload.players.map(async (player) => {
      const penaltyReason = player.penaltyReason ?? getPenaltyReasonForStatus(player.status);
      if (!penaltyReason) {
        return;
      }

      await createBattlePenalty({
        userId: player.userId,
        roomId: payload.room.roomId,
        reason: penaltyReason,
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
