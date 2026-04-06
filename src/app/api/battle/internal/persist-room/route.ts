import { NextResponse } from "next/server";
import { z } from "zod";

import type { BattleRoomSnapshot } from "@/features/battle/types";
import { env, hasBattleWorkerEnv } from "@/lib/env";
import { persistBattleRoomSnapshot } from "@/server/battle/persist-room";

const playerSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  isCreator: z.boolean(),
  isReady: z.boolean(),
  readyDeadlineAt: z.string().nullable(),
  joinedAt: z.string(),
  lastHeartbeatAt: z.string().nullable(),
  disconnectedAt: z.string().nullable(),
  connected: z.boolean(),
  status: z.string(),
  officialBalance: z.number(),
  officialRank: z.number().int().positive(),
  tradesClosed: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  losses: z.number().int().nonnegative(),
  hasOpenTrade: z.boolean(),
});

const persistRoomSchema = z.object({
  room: z.object({
    roomId: z.string().uuid(),
    lobbyCode: z.string().nullable(),
    roomType: z.union([z.literal("public"), z.literal("private")]),
    phase: z.union([z.literal("lobby"), z.literal("active"), z.literal("finished"), z.literal("cancelled")]),
    durationMinutes: z.union([z.literal(10), z.literal(15), z.literal(30), z.literal(45)]),
    symbol: z.string().nullable(),
    timeframe: z.string().nullable(),
    maxPlayers: z.number().int().positive(),
    createdAt: z.string(),
    countdownEndsAt: z.string().nullable(),
    officialStartAt: z.string().nullable(),
    officialEndAt: z.string().nullable(),
    lastEventAt: z.string().nullable(),
    cancelReason: z.string().nullable(),
    winnerUserId: z.string().uuid().nullable(),
    players: z.array(playerSchema),
    leaderboard: z.array(z.any()),
    currentCandleIndex: z.number().int().nullable(),
    candles: z.array(z.any()),
  }),
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

  const parsed = persistRoomSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload", message: "Battle room persist payload is invalid." },
      { status: 400 },
    );
  }

  await persistBattleRoomSnapshot(parsed.data.room as BattleRoomSnapshot);
  return NextResponse.json({ ok: true });
}
