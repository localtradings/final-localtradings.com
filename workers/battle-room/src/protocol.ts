export type WorkerBattleRoomType = "public" | "private";
export type WorkerBattlePhase = "lobby" | "active" | "finished" | "cancelled";
export type WorkerBattlePlayerStatus =
  | "joined"
  | "ready"
  | "removed_unready"
  | "active"
  | "finished"
  | "left_lobby"
  | "left_early"
  | "forfeit"
  | "no_trade";

export type WorkerBattleDirection = "Long" | "Short";
export type WorkerBattleTimeframe =
  | "1min"
  | "5min"
  | "15min"
  | "30min"
  | "1h"
  | "4h"
  | "1day";

export type WorkerBattleDurationMinutes = 10 | 15 | 30 | 45;

export type WorkerBattleCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type WorkerBattleSeedData = {
  selection: {
    symbol: string;
    timeframe: WorkerBattleTimeframe;
    initialRevealCount: number;
  };
  candles: WorkerBattleCandle[];
};

export type WorkerBattleExecution = {
  id: string;
  status:
    | "draft"
    | "armed"
    | "active"
    | "target_hit"
    | "stop_hit"
    | "manual_close"
    | "unfinished"
    | "breakeven";
  direction: WorkerBattleDirection;
  orderType: "market" | "limit" | "stop" | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  riskPercent: number | null;
  riskAmount: number | null;
  volume: number | null;
  balanceBeforeTrade: number | null;
  openedAtIndex: number | null;
  openedAtTime: number | null;
  closedAtIndex: number | null;
  closedAtTime: number | null;
  exitPrice: number | null;
  resultR: number | null;
  resultAmount: number | null;
  balanceAfterTrade: number | null;
  maxFavorableR: number | null;
  maxAdverseR: number | null;
  durationBars: number | null;
};

export type WorkerBattlePlayerMatchState = {
  replayIndex: number;
  activePenaltyUntil: string | null;
  hasEnteredTrade: boolean;
  participationStatus: "clear" | "warned" | "eliminated";
  participationWarningIssuedAt: string | null;
  participationDeadlineAt: string | null;
  execution: WorkerBattleExecution | null;
};

export type WorkerBattlePlayer = {
  userId: string;
  displayName: string;
  isCreator: boolean;
  isReady: boolean;
  readyDeadlineAt: string | null;
  joinedAt: string;
  lastHeartbeatAt: string | null;
  disconnectedAt: string | null;
  connected: boolean;
  status: WorkerBattlePlayerStatus;
  officialBalance: number;
  officialRank: number;
  tradesClosed: number;
  wins: number;
  losses: number;
};

export type WorkerBattleRoomState = {
  roomId: string;
  lobbyCode: string | null;
  roomType: WorkerBattleRoomType;
  phase: WorkerBattlePhase;
  durationMinutes: WorkerBattleDurationMinutes;
  symbol: string | null;
  timeframe: WorkerBattleTimeframe | null;
  maxPlayers: number;
  createdAt: string;
  countdownEndsAt: string | null;
  officialStartAt: string | null;
  officialEndAt: string | null;
  lastEventAt: string | null;
  cancelReason: string | null;
  winnerUserId: string | null;
  currentCandleIndex: number | null;
  initialRevealCount: number;
  candles: WorkerBattleCandle[];
  pendingSeedData: WorkerBattleSeedData | null;
  players: WorkerBattlePlayer[];
  playerStates: Record<string, WorkerBattlePlayerMatchState>;
  finalizedAt: string | null;
  resultsPersistedAt: string | null;
  lastResultPersistAttemptAt: string | null;
  lastResultPersistError: string | null;
};

export type WorkerBattleView = {
  room: {
    roomId: string;
    lobbyCode: string | null;
    roomType: WorkerBattleRoomType;
    phase: WorkerBattlePhase;
    durationMinutes: WorkerBattleDurationMinutes;
    symbol: string | null;
    timeframe: WorkerBattleTimeframe | null;
    maxPlayers: number;
    createdAt: string;
    countdownEndsAt: string | null;
    officialStartAt: string | null;
    officialEndAt: string | null;
    lastEventAt: string | null;
    cancelReason: string | null;
    winnerUserId: string | null;
    currentCandleIndex: number | null;
    initialRevealCount: number;
    candles: WorkerBattleCandle[];
    players: Array<WorkerBattlePlayer & { hasOpenTrade: boolean }>;
    leaderboard: Array<{
      userId: string;
      displayName: string;
      officialBalance: number;
      officialRank: number;
      tradesClosed: number;
      status: WorkerBattlePlayerStatus;
    }>;
  };
  self: {
    activePenaltyUntil: string | null;
    replayIndex: number;
    revealedCandleCount: number;
    lockReason: "no_trade" | "forfeit" | "left_early" | "finished" | "cancelled" | null;
    hasEnteredTrade: boolean;
    participationStatus: "clear" | "warned" | "eliminated";
    participationWarningIssuedAt: string | null;
    participationDeadlineAt: string | null;
    execution: WorkerBattleExecution | null;
    privateBalance: number;
    unrealizedPnl: number;
    realizedPnl: number;
  };
  token: string | null;
  viewerUserId: string;
};
