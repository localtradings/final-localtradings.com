import "server-only";

import type {
  BattleDurationMinutes,
  BattleRoomView,
} from "@/features/battle/types";
import { normalizeBattleRoomView } from "@/features/battle/lib/normalize-room-view";
import type { BacktestDirection } from "@/features/backtesting/types";
import { env, hasBattleWorkerEnv } from "@/lib/env";

type WorkerSuccess<T> = {
  ok: true;
  data: T;
};

type WorkerFailure = {
  ok: false;
  reason:
    | "battle_worker_not_configured"
    | "invalid_worker_response"
    | "service_unavailable"
    | "room_not_found"
    | "room_full"
    | "room_already_started"
    | "cooldown_active"
    | "invalid_lobby_code"
    | "pro_required"
    | "room_not_active"
    | "trade_already_open"
    | "no_open_trade"
    | "invalid_replay_progression"
    | "player_eliminated";
  message: string;
  data?: {
    room?: BattleRoomView | null;
  } | null;
};

async function requestWorker<T>(
  path: string,
  init?: {
    method?: "GET" | "POST";
    body?: unknown;
  },
): Promise<WorkerSuccess<T> | WorkerFailure> {
  if (!hasBattleWorkerEnv()) {
    return {
      ok: false,
      reason: "battle_worker_not_configured",
      message: "Battle worker env is not configured.",
    };
  }

  try {
    const response = await fetch(`${env.battleWorkerUrl}${path}`, {
      method: init?.method ?? "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": env.battleSharedSecret,
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok: true; data: T }
      | {
          ok: false;
          reason?: WorkerFailure["reason"];
          message?: string;
          data?: WorkerFailure["data"];
        }
      | null;

    if (!payload || typeof payload !== "object" || typeof payload.ok !== "boolean") {
      return {
        ok: false,
        reason: "invalid_worker_response",
        message: "Battle worker returned an invalid response.",
      };
    }

    if (!payload.ok) {
      return {
        ok: false,
        reason: payload.reason ?? "service_unavailable",
        message: payload.message ?? "Battle worker request failed.",
        data: payload.data ?? null,
      };
    }

    if (
      payload.data &&
      typeof payload.data === "object" &&
      "room" in payload.data
    ) {
      const dataWithRoom = payload.data as { room?: BattleRoomView | null };

      return {
        ok: true,
        data: {
          ...dataWithRoom,
          room: normalizeBattleRoomView(dataWithRoom.room ?? null),
        } as T,
      };
    }

    return payload;
  } catch (error) {
    return {
      ok: false,
      reason: "service_unavailable",
      message: error instanceof Error ? error.message : "Battle worker request failed.",
    };
  }
}

export function createPublicBattleRoom(input: {
  roomId: string;
  userId: string;
  displayName: string;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/create", {
    body: {
      ...input,
      roomType: "public",
      lobbyCode: null,
      durationMinutes: 10,
    },
  });
}

export function joinPublicBattleMatch(input: {
  roomId: string;
  userId: string;
  displayName: string;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/public/join", {
    body: input,
  });
}

export function createBattleRoom(input: {
  roomId: string;
  roomType: "public" | "private";
  lobbyCode: string | null;
  durationMinutes: BattleDurationMinutes;
  userId: string;
  displayName: string;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/create", {
    body: input,
  });
}

export function joinBattleRoom(input: {
  roomId: string;
  userId: string;
  displayName: string;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/join", {
    body: input,
  });
}

export function refreshBattleRoomView(input: { roomId: string; userId: string }) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/state", {
    body: input,
  });
}

export function setBattleReadyState(input: {
  roomId: string;
  userId: string;
  ready: boolean;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/ready", {
    body: input,
  });
}

export function leaveBattleRoom(input: { roomId: string; userId: string }) {
  return requestWorker<{ room: BattleRoomView | null }>("/internal/rooms/leave", {
    body: input,
  });
}

export function openBattleTrade(input: {
  roomId: string;
  userId: string;
  direction: BacktestDirection;
  orderType: "market" | "limit" | "stop";
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskPercent: number;
  replayIndex: number;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/open-trade", {
    body: input,
  });
}

export function syncBattleReplay(input: {
  roomId: string;
  userId: string;
  replayIndex: number;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/sync-replay", {
    body: input,
  });
}

export function closeBattleTrade(input: {
  roomId: string;
  userId: string;
  replayIndex: number;
}) {
  return requestWorker<{ room: BattleRoomView }>("/internal/rooms/close-trade", {
    body: input,
  });
}
