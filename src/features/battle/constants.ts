import type { BattleDurationMinutes } from "./types";

export const BATTLE_MIN_PLAYERS = 2;
export const BATTLE_MAX_PLAYERS = 5;
export const BATTLE_STARTING_BALANCE = 100_000;
export const BATTLE_DEFAULT_RISK_PERCENT = 1;
export const BATTLE_READY_DEADLINE_MS = 30_000;
export const BATTLE_LOBBY_COUNTDOWN_MS = 60_000;
export const BATTLE_RECONNECT_GRACE_MS = 60_000;
export const BATTLE_PENALTY_MS = 15 * 60 * 1_000;
export const BATTLE_PARTICIPATION_WARNING_MS = 5 * 60 * 1_000;
export const BATTLE_PARTICIPATION_GRACE_MS = 60 * 1_000;
export const BATTLE_REPLAY_INTERVAL_MS = 450;
export const BATTLE_REPLAY_BATCH_INTERVAL_MS = 1_000;
export const BATTLE_REPLAY_BATCH_STEP_COUNT = 4;
export const BATTLE_SOCKET_PING_MS = 20_000;
export const BATTLE_FALLBACK_RESYNC_MS = 20_000;
export const BATTLE_EVENT_STALE_MS = 25_000;
export const BATTLE_INITIAL_SYNC_TIMEOUT_MS = 1_500;
export const BATTLE_CONNECTION_REUSE_WINDOW_MS = 5_000;
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
