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

export type WorkerBattleTrade = {
  id: string;
  status: "open" | "closing";
  direction: WorkerBattleDirection;
  orderType: "market";
  volume: number;
  entryPrice: number;
  openedAtIndex: number;
  openedAtTime: number;
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
  activeTrades: Record<string, WorkerBattleTrade>;
  lastClosedTradeIds: Record<string, string>;
  finalizedAt: string | null;
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
    openTrade: WorkerBattleTrade | null;
    privateBalance: number;
    unrealizedPnl: number;
    realizedPnl: number;
  };
  token: string | null;
  viewerUserId: string;
};
