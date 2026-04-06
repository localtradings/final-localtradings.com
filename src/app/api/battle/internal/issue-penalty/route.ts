import { NextResponse } from "next/server";
import { z } from "zod";

import { env, hasBattleWorkerEnv } from "@/lib/env";
import { createBattlePenalty } from "@/server/battle/penalties";

const penaltySchema = z.object({
  roomId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  reason: z.union([z.literal("left_early"), z.literal("forfeit"), z.literal("no_trade")]),
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

  const parsed = penaltySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload", message: "Invalid battle penalty payload." },
      { status: 400 },
    );
  }

  const penalty = await createBattlePenalty(parsed.data);
  if (!penalty) {
    return NextResponse.json(
      { ok: false, reason: "service_unavailable", message: "Battle penalty could not be created." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      endsAt: penalty.endsAt,
    },
  });
}
