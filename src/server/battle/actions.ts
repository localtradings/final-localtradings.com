"use server";

import { z } from "zod";

import { BATTLE_ALLOWED_DURATION_MINUTES } from "@/features/battle/constants";
import type {
  BattleDurationMinutes,
  BattleHomeActionResult,
  BattleRoomView,
  BattleTradeActionResult,
} from "@/features/battle/types";
import { hasBattleWorkerEnv } from "@/lib/env";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { requireUser } from "@/server/auth/session";
import { getCurrentProfile } from "@/server/profile/queries";

import { getActiveBattlePenalty } from "./penalties";
import { getBattleRoomSession } from "./queries";
import { createBattleRoomId } from "./room-id";
import { attachBattleRoomToken } from "./room-session";
import {
  createBattleRoom,
  createPublicBattleRoom,
  joinBattleRoom,
  leaveBattleRoom,
  openBattleTrade,
  closeBattleTrade,
  refreshBattleRoomView,
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
  volume: z.number().positive().max(100),
});

const tradeCloseSchema = z.object({
  roomId: z.string().uuid(),
  tradeId: z.string().uuid(),
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
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return;
  }

  const room = roomView.room;
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

  if (room.players.length > 0) {
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
          player.status === "forfeit"
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
  }
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

async function findJoinablePublicBattleRoomIds(limit = 10) {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("battle_rooms")
    .select("id")
    .eq("room_type", "public")
    .eq("status", "lobby")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => String((row as { id?: string }).id ?? ""))
    .filter((value) => value.length > 0);
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
  const candidateRoomIds = await findJoinablePublicBattleRoomIds();

  for (const roomId of candidateRoomIds) {
    const joinResult = await joinBattleRoom({
      roomId,
      userId: user.id,
      displayName,
    });

    if (joinResult.ok) {
      await persistBattleRoomView(joinResult.data.room);
      return {
        ok: true,
        redirectTo: `/app/battle/lobby/${joinResult.data.room.room.roomId}`,
        roomId: joinResult.data.room.room.roomId,
        lobbyCode: joinResult.data.room.room.lobbyCode,
      };
    }

    if (
      joinResult.reason !== "room_not_found" &&
      joinResult.reason !== "room_full" &&
      joinResult.reason !== "room_already_started"
    ) {
      return mapWorkerFailure(joinResult);
    }
  }

  const workerResult = await createPublicBattleRoom({
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
  const roomResult = await refreshBattleRoomView({ roomId, userId: user.id });
  if (roomResult.ok) {
    await persistBattleRoomView(roomResult.data.room);
  }
  return roomResult;
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
  rawInput: { roomId: string; direction: "Long" | "Short"; volume: number },
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
    volume: parsed.data.volume,
  });

  if (result.ok) {
    await persistBattleRoomView(result.data.room);
    return {
      ok: true,
      room: result.data.room,
    };
  }

  return {
    ok: false,
    reason:
      result.reason === "room_not_active" ||
      result.reason === "trade_already_open" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
  };
}

export async function closeBattleTradeAction(
  rawInput: { roomId: string; tradeId: string },
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
    tradeId: parsed.data.tradeId,
  });

  if (result.ok) {
    await persistBattleRoomView(result.data.room);
    return {
      ok: true,
      room: result.data.room,
    };
  }

  return {
    ok: false,
    reason:
      result.reason === "room_not_active" ||
      result.reason === "no_open_trade" ||
      result.reason === "battle_worker_not_configured"
        ? result.reason
        : "service_unavailable",
    message: result.message,
  };
}

export async function getBattleRoomPageSession(roomId: string) {
  const user = await requireUser();
  const session = await getBattleRoomSession(roomId, user.id);
  return attachBattleRoomToken(session, user.id);
}
