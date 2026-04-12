import type {
  BacktestCandle,
  BacktestDirection,
  BacktestTradeDraft,
  BacktestTradeExecution,
  BacktestTimeframe,
} from "@/features/backtesting/types";

export type BattleRoomType = "public" | "private" | "open";

export type BattleDurationMinutes = 10 | 15 | 30 | 45 | 60;

export type BattleRoomPhase = "lobby" | "active" | "finished" | "cancelled";

export type BattleLobbyCancelReason =
  | "not_enough_ready_players"
  | "host_cancelled"
  | "service_unavailable";

export type BattlePlayerStatus =
  | "joined"
  | "ready"
  | "removed_unready"
  | "active"
  | "finished"
  | "left_lobby"
  | "left_early"
  | "forfeit"
  | "no_trade"
  | "drawdown_limit";

export type BattleResultStatus =
  | "finished"
  | "left_early"
  | "forfeit"
  | "no_trade"
  | "drawdown_limit";

export type BattlePenaltyReason = "left_early" | "forfeit" | "no_trade";

export type BattleParticipationStatus = "clear" | "warned" | "eliminated";
export type BattleMatchLockReason =
  | "no_trade"
  | "forfeit"
  | "left_early"
  | "drawdown_limit"
  | "finished"
  | "cancelled";

export type BattleTradeSnapshot = Pick<
  BacktestTradeExecution,
  | "status"
  | "orderType"
  | "entry"
  | "stop"
  | "target"
  | "riskPercent"
  | "riskAmount"
  | "volume"
  | "openedAtIndex"
  | "openedAtTime"
  | "closedAtIndex"
  | "closedAtTime"
  | "exitPrice"
  | "resultR"
  | "resultAmount"
  | "balanceAfterTrade"
> & {
  id: string;
  direction: BacktestDirection;
};

export type BattleTradeForm = Pick<
  BacktestTradeDraft,
  | "direction"
  | "orderType"
  | "entry"
  | "hasStop"
  | "stop"
  | "hasTarget"
  | "target"
> & {
  riskPercent: string;
};

export type BattleLeaderboardEntry = {
  userId: string;
  displayName: string;
  officialBalance: number;
  officialRank: number;
  tradesClosed: number;
  status: BattlePlayerStatus;
};

export type BattleRoomPlayerSnapshot = {
  userId: string;
  displayName: string;
  isCreator: boolean;
  isReady: boolean;
  readyDeadlineAt: string | null;
  joinedAt: string;
  lastHeartbeatAt: string | null;
  disconnectedAt: string | null;
  connected: boolean;
  status: BattlePlayerStatus;
  officialBalance: number;
  officialRank: number;
  tradesClosed: number;
  wins: number;
  losses: number;
  hasOpenTrade: boolean;
};

export type BattleRoomSnapshot = {
  roomId: string;
  lobbyCode: string | null;
  roomType: BattleRoomType;
  phase: BattleRoomPhase;
  durationMinutes: BattleDurationMinutes;
  riskLimitPercent: number | null;
  maxDrawdownPercent: number | null;
  symbol: string | null;
  timeframe: BacktestTimeframe | null;
  maxPlayers: number;
  createdAt: string;
  countdownEndsAt: string | null;
  officialStartAt: string | null;
  officialEndAt: string | null;
  lastEventAt: string | null;
  cancelReason: BattleLobbyCancelReason | null;
  winnerUserId: string | null;
  players: BattleRoomPlayerSnapshot[];
  leaderboard: BattleLeaderboardEntry[];
  currentCandleIndex: number | null;
  initialRevealCount: number;
  candles: BacktestCandle[];
};

export type BattleSelfState = {
  activePenaltyUntil: string | null;
  replayIndex: number;
  revealedCandleCount: number;
  lockReason: BattleMatchLockReason | null;
  hasEnteredTrade: boolean;
  participationStatus: BattleParticipationStatus;
  participationWarningIssuedAt: string | null;
  participationDeadlineAt: string | null;
  execution: BattleTradeSnapshot | null;
  privateBalance: number;
  unrealizedPnl: number;
  realizedPnl: number;
};

export type BattleRoomView = {
  room: BattleRoomSnapshot;
  self: BattleSelfState;
  token: string | null;
  viewerUserId: string;
};

export type BattlePenaltyRecord = {
  id: string;
  roomId: string | null;
  userId: string;
  reason: BattlePenaltyReason;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type BattleResultEntry = {
  userId: string;
  displayName: string;
  finalBalance: number;
  netProfit: number;
  rank: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  status: BattleResultStatus;
};

export type BattleResultRecord = {
  roomId: string;
  roomType: BattleRoomType;
  durationMinutes: BattleDurationMinutes;
  riskLimitPercent: number | null;
  maxDrawdownPercent: number | null;
  symbol: string;
  timeframe: BacktestTimeframe;
  startedAt: string;
  endedAt: string;
  winnerUserId: string | null;
  winnerDisplayName: string | null;
  entries: BattleResultEntry[];
};

export type BattleOpenRoomListing = {
  roomId: string;
  roomType: Extract<BattleRoomType, "open">;
  lobbyCode: string | null;
  durationMinutes: BattleDurationMinutes;
  maxPlayers: number;
  riskLimitPercent: number | null;
  maxDrawdownPercent: number | null;
  createdAt: string;
  hostUserId: string | null;
  hostDisplayName: string | null;
  joinedPlayers: number;
};

export type BattleHomeData = {
  isWorkerConfigured: boolean;
  isPro: boolean;
  activePenalty: BattlePenaltyRecord | null;
  recentResults: BattleResultRecord[];
  openRooms: BattleOpenRoomListing[];
};

export type BattleRoomSession = {
  roomId: string;
  viewerUserId: string;
  isParticipant: boolean;
  initialView: BattleRoomView | null;
  roomToken: string | null;
  workerConfigured: boolean;
  workerSocketUrl: string | null;
};

export type BattleHomeActionResult =
  | {
      ok: true;
      redirectTo: string;
      roomId: string;
      lobbyCode: string | null;
    }
  | {
      ok: false;
      reason:
        | "battle_worker_not_configured"
        | "not_authenticated"
        | "invalid_duration"
        | "invalid_max_players"
        | "pro_required"
        | "cooldown_active"
        | "room_not_found"
        | "room_full"
        | "room_already_started"
        | "invalid_lobby_code"
        | "service_unavailable";
      message: string;
      penaltyEndsAt?: string | null;
    };

export type BattleTradeActionResult =
  | { ok: true; room: BattleRoomView }
  | {
      ok: false;
      reason:
        | "battle_worker_not_configured"
        | "not_authenticated"
        | "trade_already_open"
        | "no_open_trade"
        | "invalid_trade_payload"
        | "invalid_replay_progression"
        | "player_eliminated"
        | "room_not_active"
        | "service_unavailable";
      message: string;
      room?: BattleRoomView | null;
    };

export type BattleReplayActionResult =
  | { ok: true; room: BattleRoomView }
  | {
      ok: false;
      reason:
        | "battle_worker_not_configured"
        | "not_authenticated"
        | "invalid_replay_progression"
        | "player_eliminated"
        | "room_not_active"
        | "service_unavailable";
      message: string;
      room?: BattleRoomView | null;
    };

export type BattleFinalizePayload = {
  room: {
    roomId: string;
    roomType: BattleRoomType;
    durationMinutes: BattleDurationMinutes;
    riskLimitPercent: number | null;
    maxDrawdownPercent: number | null;
    symbol: string;
    timeframe: BacktestTimeframe;
    phase: Extract<BattleRoomPhase, "finished" | "cancelled">;
    startedAt: string | null;
    endedAt: string;
    winnerUserId: string | null;
    cancelReason: BattleLobbyCancelReason | null;
    lobbyCode: string | null;
  };
  players: Array<{
    userId: string;
    displayName: string;
    status: BattlePlayerStatus;
    finalBalance: number;
    realizedPnl: number;
    rank: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    penaltyReason: BattlePenaltyReason | null;
  }>;
};
