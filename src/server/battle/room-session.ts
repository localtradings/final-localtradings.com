import "server-only";

import type { BattleRoomSession } from "@/features/battle/types";
import { env } from "@/lib/env";

import { createBattleRoomToken } from "./serialization";

function getBattleWorkerSocketUrl() {
  const workerUrl = env.battleWorkerUrl.trim();
  if (!workerUrl) {
    return null;
  }

  if (workerUrl.startsWith("https://")) {
    return `wss://${workerUrl.slice("https://".length)}`;
  }

  if (workerUrl.startsWith("http://")) {
    return `ws://${workerUrl.slice("http://".length)}`;
  }

  return null;
}

export function attachBattleRoomToken(
  session: BattleRoomSession,
  userId: string,
): BattleRoomSession {
  const roomToken = createBattleRoomToken({
    roomId: session.roomId,
    userId,
    issuedAt: new Date().toISOString(),
  });

  if (!session.initialView) {
    return {
      ...session,
      roomToken,
      workerSocketUrl: getBattleWorkerSocketUrl(),
    };
  }

  return {
    ...session,
    roomToken,
    workerSocketUrl: getBattleWorkerSocketUrl(),
    initialView: {
      ...session.initialView,
      token: roomToken,
    },
  };
}
