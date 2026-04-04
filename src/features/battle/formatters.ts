import {
  BATTLE_PHASE_LABELS,
  BATTLE_RESULT_LABELS,
  BATTLE_STATUS_LABELS,
} from "./constants";
import type {
  BattleDurationMinutes,
  BattlePenaltyRecord,
  BattleResultStatus,
  BattleRoomPhase,
  BattlePlayerStatus,
} from "./types";

export function formatBattleDuration(durationMinutes: BattleDurationMinutes) {
  return `${durationMinutes}m`;
}

export function formatBattlePhase(phase: BattleRoomPhase) {
  return BATTLE_PHASE_LABELS[phase];
}

export function formatBattlePlayerStatus(status: BattlePlayerStatus) {
  return BATTLE_STATUS_LABELS[status];
}

export function formatBattleResultStatus(status: BattleResultStatus) {
  return BATTLE_RESULT_LABELS[status];
}

export function formatBattleLobbyCode(lobbyCode: string | null) {
  return lobbyCode ?? "Pending";
}

export function formatBattleCountdown(targetIso: string | null, now = Date.now()) {
  if (!targetIso) {
    return "00:00";
  }

  const remainingMs = Math.max(0, Date.parse(targetIso) - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatBattlePenalty(penalty: BattlePenaltyRecord | null) {
  if (!penalty) {
    return null;
  }

  return `Cooldown until ${new Date(penalty.endsAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
