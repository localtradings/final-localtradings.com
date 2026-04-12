import type { BattleDurationMinutes } from "./types";

export const BATTLE_MIN_PLAYERS = 2;
export const BATTLE_MAX_PLAYERS = 5;
export const BATTLE_OPEN_ROOM_MAX_PLAYERS = 10;
export const BATTLE_PRIVATE_ROOM_PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const BATTLE_OPEN_ROOM_PLAYER_OPTIONS = [2, 4, 6, 8, 10] as const;
export const BATTLE_STARTING_BALANCE = 100_000;
export const BATTLE_DEFAULT_RISK_PERCENT = 1;
export const BATTLE_PUBLIC_RISK_LIMIT_PERCENT = 2;
export const BATTLE_PUBLIC_MAX_DRAWDOWN_PERCENT = 10;
export const BATTLE_OPEN_ROOM_RISK_LIMIT_PERCENT = 2;
export const BATTLE_OPEN_ROOM_MAX_DRAWDOWN_PERCENT = 10;
export const BATTLE_READY_DEADLINE_MS = 30_000;
export const BATTLE_LOBBY_COUNTDOWN_MS = 60_000;
export const BATTLE_RECONNECT_GRACE_MS = 60_000;
export const BATTLE_PENALTY_MS = 15 * 60 * 1_000;
export const BATTLE_PARTICIPATION_WARNING_MS = 5 * 60 * 1_000;
export const BATTLE_PARTICIPATION_GRACE_MS = 60 * 1_000;
export const BATTLE_REPLAY_INTERVAL_MS = 450;
export const BATTLE_REPLAY_BATCH_INTERVAL_MS = 10_000;
export const BATTLE_REPLAY_BATCH_STEP_COUNT = 24;
export const BATTLE_REPLAY_RESOLUTION_SYNC_MS = 1_500;
export const BATTLE_SOCKET_PING_MS = 20_000;
export const BATTLE_FALLBACK_RESYNC_MS = 20_000;
export const BATTLE_EVENT_STALE_MS = 25_000;
export const BATTLE_INITIAL_SYNC_TIMEOUT_MS = 1_500;
export const BATTLE_CONNECTION_REUSE_WINDOW_MS = 5_000;
export const BATTLE_SOCKET_RETRY_BASE_MS = 1_000;
export const BATTLE_SOCKET_RETRY_MAX_MS = 15_000;
export const BATTLE_RECENT_RESULTS_LIMIT = 10;
export const BATTLE_PUBLIC_DURATION_MINUTES = [15] as const satisfies readonly BattleDurationMinutes[];
export const BATTLE_PRIVATE_DURATION_MINUTES = [10, 15, 30, 45] as const satisfies readonly BattleDurationMinutes[];
export const BATTLE_OPEN_ROOM_DURATION_MINUTES = [15, 30, 45, 60] as const satisfies readonly BattleDurationMinutes[];
export const BATTLE_ALLOWED_DURATION_MINUTES = [
  ...BATTLE_PRIVATE_DURATION_MINUTES,
  ...BATTLE_OPEN_ROOM_DURATION_MINUTES,
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
  drawdown_limit: "Drawdown Limit",
} as const;

export const BATTLE_RESULT_LABELS = {
  finished: "Finished",
  left_early: "Left Early",
  forfeit: "Forfeit",
  no_trade: "No Trade",
  drawdown_limit: "Drawdown Limit",
} as const;
