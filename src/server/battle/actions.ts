"use server";

import { z } from "zod";

import { BATTLE_ALLOWED_DURATION_MINUTES } from "@/features/battle/constants";
import type {
  BattleDurationMinutes,
  BattleHomeActionResult,
  BattleReplayActionResult,
  BattleRoomView,
  BattleTradeActionResult,
} from "@/features/battle/types";
import { hasBattleWorkerEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { requireUser } from "@/server/auth/session";
import { getCurrentProfile } from "@/server/profile/queries";

import { getActiveBattlePenalty } from "./penalties";
import { persistBattleRoomSnapshot } from "./persist-room";
import { getBattleRoomSession } from "./queries";
import { createBattleRoomId } from "./room-id";
import { attachBattleRoomToken } from "./room-session";
import {
  createBattleRoom,
  joinBattleRoom,
  joinPublicBattleMatch,
  leaveBattleRoom,
  openBattleTrade,
  closeBattleTrade,
  refreshBattleRoomView,
  syncBattleReplay,
  setBattleReadyState,
} from "./worker-client";

const lobbyCodeSchema = z.object({
  lobbyCode: z
    .string()
    .trim()
    .min(4)
    .max(12)
    .regex(/^[A-Z0-9]+$/),
});

const durationSchema = z.object({
  durationMinutes: z.union([
    z.literal(10),
    z.literal(15),
    z.literal(30),
    z.literal(45),
  ]),
});

const readySchema = z.object({
  roomId: z.string().uuid(),
  ready: z.boolean(),
});

const tradeOpenSchema = z.object({
  roomId: z.string().uuid(),
  direction: z.union([z.literal("Long"), z.literal("Short")]),
  orderType: z.union([z.literal("market"), z.literal("limit"), z.literal("stop")]),
  entryPrice: z.number().positive().nullable(),
  stopLoss: z.number().positive().nullable(),
  takeProfit: z.number().positive().nullable(),
  riskPercent: z.number().positive().max(100),
  replayIndex: z.number().int().nonnegative(),
});

const tradeCloseSchema = z.object({
  roomId: z.string().uuid(),
  replayIndex: z.number().int().nonnegative(),
});

const replaySyncSchema = z.object({
  roomId: z.string().uuid(),
  replayIndex: z.number().int().nonnegative(),
});

function createLobbyCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
}

function getDisplayName(profile: Awaited<ReturnType<typeof getCurrentProfile>>, fallbackEmail: string) {
  return (
    profile?.displayName.trim() ||
    profile?.fullName.trim() ||
    fallbackEmail.split("@")[0] ||
    "Battle Trader"
  );
}

async function persistBattleRoomView(roomView: BattleRoomView) {
  await persistBattleRoomSnapshot(roomView.room);
}

function mapWorkerFailure(result: { reason: string; message: string }): BattleHomeActionResult {
  return {
    ok: false,
    reason:
      result.reason === "cooldown_active" ||
      result.reason === "invalid_lobby_code" ||
      result.reason === "room_not_found" ||
      result.reason === "room_full" ||
      result.reason === "room_already_started" ||
      result.reason === "pro_required" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
  };
}

async function findPrivateBattleRoomId(lobbyCode: string) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("battle_rooms")
    .select("id")
    .eq("lobby_code", lobbyCode)
    .eq("status", "lobby")
    .maybeSingle();

  if (error || !data?.id) {
    return null;
  }

  return String(data.id);
}

export async function createPrivateBattleRoomAction(
  rawInput: { durationMinutes: BattleDurationMinutes },
): Promise<BattleHomeActionResult> {
  if (!hasBattleWorkerEnv()) {
    return {
      ok: false,
      reason: "battle_worker_not_configured",
      message: "Battle worker env is not configured yet.",
    };
  }

  const user = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const parsed = durationSchema.safeParse(rawInput);
  if (!parsed.success || !BATTLE_ALLOWED_DURATION_MINUTES.includes(parsed.data.durationMinutes)) {
    return {
      ok: false,
      reason: "invalid_duration",
      message: "Choose a valid private room duration.",
    };
  }

  const penalty = await getActiveBattlePenalty(user.id);
  if (penalty) {
    return {
      ok: false,
      reason: "cooldown_active",
      message: "You are currently on cooldown.",
      penaltyEndsAt: penalty.endsAt,
    };
  }

  if (parsed.data.durationMinutes > 10 && !profile?.isPro) {
    return {
      ok: false,
      reason: "pro_required",
      message: "Only Pro users can create 15m, 30m, or 45m private rooms.",
    };
  }

  const workerResult = await createBattleRoom({
    roomId: createBattleRoomId(),
    roomType: "private",
    lobbyCode: createLobbyCode(),
    userId: user.id,
    displayName: getDisplayName(profile, user.email ?? ""),
    durationMinutes: parsed.data.durationMinutes,
  });

  if (!workerResult.ok) {
    return mapWorkerFailure(workerResult);
  }

  await persistBattleRoomView(workerResult.data.room);

  return {
    ok: true,
    redirectTo: `/app/battle/lobby/${workerResult.data.room.room.roomId}`,
    roomId: workerResult.data.room.room.roomId,
    lobbyCode: workerResult.data.room.room.lobbyCode,
  };
}

export async function joinRandomBattleMatchAction(): Promise<BattleHomeActionResult> {
  if (!hasBattleWorkerEnv()) {
    return {
      ok: false,
      reason: "battle_worker_not_configured",
      message: "Battle worker env is not configured yet.",
    };
  }

  const user = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const penalty = await getActiveBattlePenalty(user.id);
  if (penalty) {
    return {
      ok: false,
      reason: "cooldown_active",
      message: "You are currently on cooldown.",
      penaltyEndsAt: penalty.endsAt,
    };
  }

  const displayName = getDisplayName(profile, user.email ?? "");
  const workerResult = await joinPublicBattleMatch({
    roomId: createBattleRoomId(),
    userId: user.id,
    displayName,
  });

  if (!workerResult.ok) {
    return mapWorkerFailure(workerResult);
  }

  await persistBattleRoomView(workerResult.data.room);

  return {
    ok: true,
    redirectTo: `/app/battle/lobby/${workerResult.data.room.room.roomId}`,
    roomId: workerResult.data.room.room.roomId,
    lobbyCode: workerResult.data.room.room.lobbyCode,
  };
}

export async function joinPrivateBattleRoomAction(
  rawInput: { lobbyCode: string },
): Promise<BattleHomeActionResult> {
  if (!hasBattleWorkerEnv()) {
    return {
      ok: false,
      reason: "battle_worker_not_configured",
      message: "Battle worker env is not configured yet.",
    };
  }

  const user = await requireUser();
  const profile = await getCurrentProfile(user.id);
  const parsed = lobbyCodeSchema.safeParse({
    lobbyCode: rawInput.lobbyCode.trim().toUpperCase(),
  });

  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_lobby_code",
      message: "Enter a valid lobby code.",
    };
  }

  const penalty = await getActiveBattlePenalty(user.id);
  if (penalty) {
    return {
      ok: false,
      reason: "cooldown_active",
      message: "You are currently on cooldown.",
      penaltyEndsAt: penalty.endsAt,
    };
  }

  const roomId = await findPrivateBattleRoomId(parsed.data.lobbyCode);
  if (!roomId) {
    return {
      ok: false,
      reason: "room_not_found",
      message: "Private battle room not found.",
    };
  }

  const workerResult = await joinBattleRoom({
    roomId,
    userId: user.id,
    displayName: getDisplayName(profile, user.email ?? ""),
  });

  if (!workerResult.ok) {
    return mapWorkerFailure(workerResult);
  }

  await persistBattleRoomView(workerResult.data.room);

  return {
    ok: true,
    redirectTo: `/app/battle/lobby/${workerResult.data.room.room.roomId}`,
    roomId: workerResult.data.room.room.roomId,
    lobbyCode: workerResult.data.room.room.lobbyCode,
  };
}

export async function refreshBattleRoomAction(roomId: string) {
  const user = await requireUser();
  return refreshBattleRoomView({ roomId, userId: user.id });
}

export async function setBattleReadyAction(rawInput: {
  roomId: string;
  ready: boolean;
}) {
  const user = await requireUser();
  const parsed = readySchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false as const,
      reason: "service_unavailable",
      message: "Invalid ready payload.",
    };
  }

  const roomResult = await setBattleReadyState({
    roomId: parsed.data.roomId,
    userId: user.id,
    ready: parsed.data.ready,
  });
  if (roomResult.ok) {
    await persistBattleRoomView(roomResult.data.room);
  }
  return roomResult;
}

export async function leaveBattleRoomAction(roomId: string) {
  const user = await requireUser();
  const result = await leaveBattleRoom({ roomId, userId: user.id });
  if (result.ok && result.data.room) {
    await persistBattleRoomView(result.data.room);
  }
  return result;
}

export async function openBattleTradeAction(
  rawInput: {
    roomId: string;
    direction: "Long" | "Short";
    orderType: "market" | "limit" | "stop";
    entryPrice: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    riskPercent: number;
    replayIndex: number;
  },
): Promise<BattleTradeActionResult> {
  const user = await requireUser();
  const parsed = tradeOpenSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_trade_payload",
      message: "Enter a valid battle trade.",
    };
  }

  const result = await openBattleTrade({
    roomId: parsed.data.roomId,
    userId: user.id,
    direction: parsed.data.direction,
    orderType: parsed.data.orderType,
    entryPrice: parsed.data.entryPrice,
    stopLoss: parsed.data.stopLoss,
    takeProfit: parsed.data.takeProfit,
    riskPercent: parsed.data.riskPercent,
    replayIndex: parsed.data.replayIndex,
  });

  if (result.ok) {
    await persistBattleRoomView(result.data.room);
    return {
      ok: true,
      room: result.data.room,
    };
  }

  if (result.data?.room) {
    await persistBattleRoomView(result.data.room);
  }

  return {
    ok: false,
      reason:
      result.reason === "room_not_active" ||
      result.reason === "trade_already_open" ||
      result.reason === "invalid_replay_progression" ||
      result.reason === "player_eliminated" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
    room: result.data?.room ?? null,
  };
}

export async function closeBattleTradeAction(
  rawInput: { roomId: string; replayIndex: number },
): Promise<BattleTradeActionResult> {
  const user = await requireUser();
  const parsed = tradeCloseSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_trade_payload",
      message: "Battle trade payload is invalid.",
    };
  }

  const result = await closeBattleTrade({
    roomId: parsed.data.roomId,
    userId: user.id,
    replayIndex: parsed.data.replayIndex,
  });

  if (result.ok) {
    await persistBattleRoomView(result.data.room);
    return {
      ok: true,
      room: result.data.room,
    };
  }

  if (result.data?.room) {
    await persistBattleRoomView(result.data.room);
  }

  return {
    ok: false,
      reason:
      result.reason === "room_not_active" ||
      result.reason === "no_open_trade" ||
      result.reason === "invalid_replay_progression" ||
      result.reason === "player_eliminated" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
    room: result.data?.room ?? null,
  };
}

export async function syncBattleReplayAction(
  rawInput: { roomId: string; replayIndex: number },
): Promise<BattleReplayActionResult> {
  const user = await requireUser();
  const parsed = replaySyncSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_replay_progression",
      message: "Replay progression is invalid.",
    };
  }

  const result = await syncBattleReplay({
    roomId: parsed.data.roomId,
    userId: user.id,
    replayIndex: parsed.data.replayIndex,
  });

  if (result.ok) {
    return {
      ok: true,
      room: result.data.room,
    };
  }

  return {
    ok: false,
    reason:
      result.reason === "room_not_active" ||
      result.reason === "invalid_replay_progression" ||
      result.reason === "player_eliminated" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
    room: result.data?.room ?? null,
  };
}

export async function getBattleRoomPageSession(roomId: string) {
  const user = await requireUser();
  const session = await getBattleRoomSession(roomId, user.id);
  return attachBattleRoomToken(session, user.id);
}
