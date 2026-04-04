import type {
  WorkerBattlePlayer,
  WorkerBattlePlayerStatus,
  WorkerBattleRoomState,
  WorkerBattleTrade,
  WorkerBattleView,
} from "./protocol";

const STARTING_BALANCE = 100_000;
const READY_DEADLINE_MS = 30_000;
const RECONNECT_GRACE_MS = 60_000;

export function createLobbyPlayer(input: {
  userId: string;
  displayName: string;
  isCreator: boolean;
  nowIso: string;
}): WorkerBattlePlayer {
  return {
    userId: input.userId,
    displayName: input.displayName,
    isCreator: input.isCreator,
    isReady: false,
    readyDeadlineAt: new Date(Date.parse(input.nowIso) + READY_DEADLINE_MS).toISOString(),
    joinedAt: input.nowIso,
    lastHeartbeatAt: input.nowIso,
    disconnectedAt: null,
    connected: true,
    status: "joined",
    officialBalance: STARTING_BALANCE,
    officialRank: 1,
    tradesClosed: 0,
    wins: 0,
    losses: 0,
  };
}

export function getCurrentPrice(room: WorkerBattleRoomState) {
  if (room.candles.length === 0) {
    return null;
  }

  const index =
    typeof room.currentCandleIndex === "number"
      ? Math.max(0, Math.min(room.currentCandleIndex, room.candles.length - 1))
      : room.candles.length - 1;

  return room.candles[index]?.close ?? null;
}

export function calculateUnrealizedPnl(trade: WorkerBattleTrade | null, price: number | null) {
  if (!trade || price === null) {
    return 0;
  }

  const signedDifference =
    trade.direction === "Long" ? price - trade.entryPrice : trade.entryPrice - price;
  return signedDifference * trade.volume;
}

export function settleTrade(
  player: WorkerBattlePlayer,
  trade: WorkerBattleTrade,
  exitPrice: number,
) {
  const pnl = calculateUnrealizedPnl(trade, exitPrice);
  player.officialBalance = Number((player.officialBalance + pnl).toFixed(2));
  player.tradesClosed += 1;
  if (pnl >= 0) {
    player.wins += 1;
  } else {
    player.losses += 1;
  }

  return pnl;
}

export function rankPlayers(players: WorkerBattlePlayer[]) {
  const activeStatuses: WorkerBattlePlayerStatus[] = [
    "finished",
    "active",
    "ready",
    "joined",
    "no_trade",
    "left_early",
    "forfeit",
    "removed_unready",
    "left_lobby",
  ];

  players.sort((left, right) => {
    if (right.officialBalance !== left.officialBalance) {
      return right.officialBalance - left.officialBalance;
    }

    if (right.tradesClosed !== left.tradesClosed) {
      return right.tradesClosed - left.tradesClosed;
    }

    return (
      activeStatuses.indexOf(left.status) - activeStatuses.indexOf(right.status)
    );
  });

  players.forEach((player, index) => {
    player.officialRank = index + 1;
  });
}

export function buildViewerState(
  room: WorkerBattleRoomState,
  viewerUserId: string,
): WorkerBattleView {
  const rankedPlayers = [...room.players];
  rankPlayers(rankedPlayers);
  const player = rankedPlayers.find((entry) => entry.userId === viewerUserId);
  const openTrade = room.activeTrades[viewerUserId] ?? null;
  const currentPrice = getCurrentPrice(room);
  const unrealizedPnl = calculateUnrealizedPnl(openTrade, currentPrice);

  return {
    room: {
      roomId: room.roomId,
      lobbyCode: room.lobbyCode,
      roomType: room.roomType,
      phase: room.phase,
      durationMinutes: room.durationMinutes,
      symbol: room.symbol,
      timeframe: room.timeframe,
      maxPlayers: room.maxPlayers,
      createdAt: room.createdAt,
      countdownEndsAt: room.countdownEndsAt,
      officialStartAt: room.officialStartAt,
      officialEndAt: room.officialEndAt,
      lastEventAt: room.lastEventAt,
      cancelReason: room.cancelReason,
      winnerUserId: room.winnerUserId,
      currentCandleIndex: room.currentCandleIndex,
      candles: room.candles,
      players: rankedPlayers.map((entry) => ({
        ...entry,
        hasOpenTrade: Boolean(room.activeTrades[entry.userId]),
      })),
      leaderboard: rankedPlayers.map((entry) => ({
        userId: entry.userId,
        displayName: entry.displayName,
        officialBalance: entry.officialBalance,
        officialRank: entry.officialRank,
        tradesClosed: entry.tradesClosed,
        status: entry.status,
      })),
    },
    self: {
      activePenaltyUntil: null,
      openTrade,
      privateBalance: Number(((player?.officialBalance ?? STARTING_BALANCE) + unrealizedPnl).toFixed(2)),
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
      realizedPnl: Number(((player?.officialBalance ?? STARTING_BALANCE) - STARTING_BALANCE).toFixed(2)),
    },
    token: null,
    viewerUserId,
  };
}

export function updateHeartbeat(room: WorkerBattleRoomState, userId: string, nowIso: string) {
  const player = room.players.find((entry) => entry.userId === userId);
  if (!player) {
    return null;
  }

  const isFirstLobbyHeartbeat =
    room.phase === "lobby" &&
    player.status === "joined" &&
    player.readyDeadlineAt &&
    player.joinedAt === player.lastHeartbeatAt;

  if (isFirstLobbyHeartbeat) {
    player.readyDeadlineAt = new Date(Date.parse(nowIso) + READY_DEADLINE_MS).toISOString();
  }

  player.lastHeartbeatAt = nowIso;
  player.connected = true;
  player.disconnectedAt = null;
  return player;
}

export function removeExpiredUnreadyPlayers(room: WorkerBattleRoomState, nowMs: number) {
  for (const player of room.players) {
    if (
      room.phase === "lobby" &&
      !player.isReady &&
      player.status === "joined" &&
      player.readyDeadlineAt &&
      Date.parse(player.readyDeadlineAt) <= nowMs
    ) {
      player.status = "removed_unready";
      player.connected = false;
    }
  }
}

export function markDisconnectedForfeits(room: WorkerBattleRoomState, nowMs: number) {
  if (room.phase !== "active") {
    return;
  }

  for (const player of room.players) {
    if (
      player.status === "active" &&
      player.lastHeartbeatAt &&
      Date.parse(player.lastHeartbeatAt) + RECONNECT_GRACE_MS <= nowMs
    ) {
      player.status = "forfeit";
      player.connected = false;
      if (!player.disconnectedAt) {
        player.disconnectedAt = new Date(nowMs).toISOString();
      }
      delete room.activeTrades[player.userId];
    }
  }
}
