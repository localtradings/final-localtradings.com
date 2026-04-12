import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { runBattleRetentionCleanup } from "@/server/battle/retention";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (env.cronSecret.trim().length > 0 && authHeader === `Bearer ${env.cronSecret}`) {
    return true;
  }

  return request.headers.get("x-battle-internal-secret") === env.battleSharedSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized", message: "Battle retention secret mismatch." },
      { status: 401 },
    );
  }

  try {
    const summary = await runBattleRetentionCleanup();

    return NextResponse.json({
      ok: true,
      data: summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Battle retention cleanup failed.";

    return NextResponse.json(
      { ok: false, reason: "cleanup_failed", message },
      { status: 500 },
    );
  }
}

export const GET = POST;
