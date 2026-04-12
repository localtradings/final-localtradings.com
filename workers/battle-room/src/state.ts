import type {
  WorkerBattleExecution,
  WorkerBattlePlayer,
  WorkerBattlePlayerMatchState,
  WorkerBattlePlayerStatus,
  WorkerBattleRoomState,
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

export function createPlayerMatchState(initialReplayIndex: number): WorkerBattlePlayerMatchState {
  return {
    replayIndex: initialReplayIndex,
    activePenaltyUntil: null,
    hasEnteredTrade: false,
    participationStatus: "clear",
    participationWarningIssuedAt: null,
    participationDeadlineAt: null,
    execution: null,
  };
}

export function getPlayerMatchState(room: WorkerBattleRoomState, userId: string) {
  room.playerStates ??= {};
  return room.playerStates[userId] ?? null;
}

export function normalizePlayerMatchState(
  room: WorkerBattleRoomState,
  state: WorkerBattlePlayerMatchState,
) {
  const maxReplayIndex = Math.max(room.candles.length - 1, 0);
  state.replayIndex = Math.max(0, Math.min(state.replayIndex, maxReplayIndex));
  return state;
}

export function getUnlockedReplayIndex(
  room: WorkerBattleRoomState,
  nowMs: number,
) {
  const maxReplayIndex = Math.max(room.candles.length - 1, 0);
  const initialReplayIndex = Math.max(
    0,
    Math.min(Math.max(room.initialRevealCount - 1, 0), maxReplayIndex),
  );
  const minimumUnlockedReplayIndex = Math.min(initialReplayIndex + 1, maxReplayIndex);

  if (room.phase === "finished" || room.phase === "cancelled") {
    return maxReplayIndex;
  }

  if (room.phase !== "active" || !room.officialStartAt || !room.officialEndAt) {
    return minimumUnlockedReplayIndex;
  }

  const startMs = Date.parse(room.officialStartAt);
  const endMs = Date.parse(room.officialEndAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return maxReplayIndex;
  }

  if (nowMs <= startMs) {
    return minimumUnlockedReplayIndex;
  }

  if (nowMs >= endMs) {
    return maxReplayIndex;
  }

  const replayWindow = maxReplayIndex - minimumUnlockedReplayIndex;
  if (replayWindow <= 0) {
    return maxReplayIndex;
  }

  const progress = (nowMs - startMs) / (endMs - startMs);
  const unlockedAdditional = Math.floor(progress * replayWindow);
  return Math.max(
    minimumUnlockedReplayIndex,
    Math.min(minimumUnlockedReplayIndex + unlockedAdditional, maxReplayIndex),
  );
}

function getViewerLockReason(
  room: WorkerBattleRoomState,
  player: WorkerBattlePlayer | undefined,
) {
  if (room.phase === "cancelled") {
    return "cancelled" as const;
  }

  if (room.phase === "finished") {
    return "finished" as const;
  }

  if (player?.status === "no_trade") {
    return "no_trade" as const;
  }

  if (player?.status === "forfeit") {
    return "forfeit" as const;
  }

  if (player?.status === "left_early") {
    return "left_early" as const;
  }

  if (player?.status === "drawdown_limit") {
    return "drawdown_limit" as const;
  }

  return null;
}

export function getReplayCandle(room: WorkerBattleRoomState, replayIndex: number) {
  if (room.candles.length === 0) {
    return null;
  }

  const index = Math.max(0, Math.min(replayIndex, room.candles.length - 1));
  return room.candles[index] ?? null;
}

export function calculateUnrealizedPnl(
  execution: WorkerBattleExecution | null,
  price: number | null,
) {
  if (
    !execution ||
    execution.status !== "active" ||
    price === null ||
    execution.entry === null ||
    typeof execution.volume !== "number"
  ) {
    return 0;
  }

  const signedDifference =
    execution.direction === "Long"
      ? price - execution.entry
      : execution.entry - price;
  return signedDifference * execution.volume;
}

export function settleResolvedExecution(
  player: WorkerBattlePlayer,
  execution: WorkerBattleExecution,
) {
  const pnl = execution.resultAmount ?? 0;
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
    "drawdown_limit",
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

    return activeStatuses.indexOf(left.status) - activeStatuses.indexOf(right.status);
  });

  players.forEach((player, index) => {
    player.officialRank = index + 1;
  });
}

export function buildViewerState(
  room: WorkerBattleRoomState,
  viewerUserId: string,
): WorkerBattleView {
  room.playerStates ??= {};
  const rankedPlayers = [...room.players];
  rankPlayers(rankedPlayers);
  const player = rankedPlayers.find((entry) => entry.userId === viewerUserId);
  const matchState = normalizePlayerMatchState(
    room,
    room.playerStates[viewerUserId] ??
      createPlayerMatchState(Math.max(room.initialRevealCount - 1, 0)),
  );
  const currentPrice = getReplayCandle(room, matchState.replayIndex)?.close ?? null;
  const unrealizedPnl = calculateUnrealizedPnl(matchState.execution, currentPrice);

  return {
    room: {
      roomId: room.roomId,
      lobbyCode: room.lobbyCode,
      roomType: room.roomType,
      phase: room.phase,
      durationMinutes: room.durationMinutes,
      riskLimitPercent: room.riskLimitPercent,
      maxDrawdownPercent: room.maxDrawdownPercent,
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
      initialRevealCount: room.initialRevealCount,
      candles: room.candles,
      players: rankedPlayers.map((entry) => ({
        ...entry,
        hasOpenTrade:
          Boolean(room.playerStates[entry.userId]?.execution) &&
          (room.playerStates[entry.userId]?.execution?.status === "armed" ||
            room.playerStates[entry.userId]?.execution?.status === "active"),
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
      activePenaltyUntil: matchState.activePenaltyUntil,
      replayIndex: matchState.replayIndex,
      revealedCandleCount: matchState.replayIndex + 1,
      lockReason: getViewerLockReason(room, player),
      hasEnteredTrade: matchState.hasEnteredTrade,
      participationStatus: matchState.participationStatus,
      participationWarningIssuedAt: matchState.participationWarningIssuedAt,
      participationDeadlineAt: matchState.participationDeadlineAt,
      execution: matchState.execution,
      privateBalance: Number(
        ((player?.officialBalance ?? STARTING_BALANCE) + unrealizedPnl).toFixed(2),
      ),
      unrealizedPnl: Number(unrealizedPnl.toFixed(2)),
      realizedPnl: Number(
        ((player?.officialBalance ?? STARTING_BALANCE) - STARTING_BALANCE).toFixed(2),
      ),
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
  let changed = false;

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
      changed = true;
    }
  }

  return changed;
}

export function markDisconnectedForfeits(room: WorkerBattleRoomState, nowMs: number) {
  if (room.phase !== "active") {
    return false;
  }

  let changed = false;
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
      room.playerStates ??= {};
      if (room.playerStates[player.userId]) {
        room.playerStates[player.userId].execution = null;
      }
      changed = true;
    }
  }

  return changed;
}
