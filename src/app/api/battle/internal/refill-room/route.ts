import { NextResponse } from "next/server";
import { z } from "zod";

import { BACKTEST_INSTRUMENTS, BACKTEST_TIMEFRAMES } from "@/features/backtesting/constants";
import type { BacktestSelection } from "@/features/backtesting/types";
import { env, hasBattleWorkerEnv } from "@/lib/env";
import { BattleSeedProviderError } from "@/server/battle/twelve-data";
import { extendBattleRoomCandles } from "@/server/battle/seed";

const refillRoomSchema = z.object({
  selection: z.object({
    symbol: z.enum(BACKTEST_INSTRUMENTS.map((item) => item.symbol) as [string, ...string[]]),
    timeframe: z.enum(BACKTEST_TIMEFRAMES as [string, ...string[]]),
  }),
  afterTime: z.number().int().nonnegative(),
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

  const payload = refillRoomSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_payload", message: "Invalid battle room refill payload." },
      { status: 400 },
    );
  }

  const selection = payload.data.selection as BacktestSelection;

  try {
    const candles = await extendBattleRoomCandles({
      selection,
      afterTime: payload.data.afterTime,
    });

    return NextResponse.json({
      ok: true,
      data: { candles },
    });
  } catch (error) {
    if (error instanceof BattleSeedProviderError) {
      return NextResponse.json(
        {
          ok: false,
          reason: error.status === 400 ? "invalid_payload" : "service_unavailable",
          message: error.message,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { ok: false, reason: "service_unavailable", message: "Battle room refill failed." },
      { status: 503 },
    );
  }
}
