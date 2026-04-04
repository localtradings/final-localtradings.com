import type { BattleDurationMinutes } from "./types";

export const BATTLE_MIN_PLAYERS = 2;
export const BATTLE_MAX_PLAYERS = 5;
export const BATTLE_STARTING_BALANCE = 100_000;
export const BATTLE_MAX_POSITION_SIZE = 100;
export const BATTLE_READY_DEADLINE_MS = 30_000;
export const BATTLE_LOBBY_COUNTDOWN_MS = 60_000;
export const BATTLE_RECONNECT_GRACE_MS = 60_000;
export const BATTLE_PENALTY_MS = 15 * 60 * 1_000;
export const BATTLE_PUBLIC_DURATION_MINUTES = [10] as const satisfies readonly BattleDurationMinutes[];
export const BATTLE_PRIVATE_DURATION_MINUTES = [10, 15, 30, 45] as const satisfies readonly BattleDurationMinutes[];
export const BATTLE_ALLOWED_DURATION_MINUTES = [
  ...BATTLE_PRIVATE_DURATION_MINUTES,
] as const satisfies readonly BattleDurationMinutes[];

export const BATTLE_PHASE_LABELS = {
  lobby: "Lobby",
  active: "Match Live",
  finished: "Finished",
  cancelled: "Cancelled",
} as const;

export const BATTLE_STATUS_LABELS = {
  joined: "Joined",
  ready: "Ready",
  removed_unready: "Removed",
  active: "Trading",
  finished: "Finished",
  left_lobby: "Left Lobby",
  left_early: "Left Early",
  forfeit: "Forfeit",
  no_trade: "No Trade",
} as const;

export const BATTLE_RESULT_LABELS = {
  finished: "Finished",
  left_early: "Left Early",
  forfeit: "Forfeit",
  no_trade: "No Trade",
} as const;
