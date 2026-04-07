import type { DurableObjectState } from "@cloudflare/workers-types";

import {
  activateTradeExecution,
  advancePendingTradeExecution,
  advanceTradeExecution,
  armPendingTradeExecution,
  calculatePositionSizeFromNotional,
  deriveRiskSettings,
  finalizeUnfinishedTrade,
  manuallyCloseTrade,
  validateTradeDraft,
} from "../../../src/features/trading-shared/execution-engine";
import {
  buildViewerState,
  createLobbyPlayer,
  createPlayerMatchState,
  getPlayerMatchState,
  getReplayCandle,
  markDisconnectedForfeits,
  normalizePlayerMatchState,
  rankPlayers,
  removeExpiredUnreadyPlayers,
  settleResolvedExecution,
  updateHeartbeat,
} from "./state";
import type {
  WorkerBattleDirection,
  WorkerBattleExecution,
  WorkerBattlePlayer,
  WorkerBattlePlayerMatchState,
  WorkerBattleRoomState,
  WorkerBattleSeedData,
  WorkerBattleView,
} from "./protocol";

type Env = {
  APP_BASE_URL: string;
  BATTLE_SHARED_SECRET: string;
};

const STARTING_BALANCE = 100_000;
const READY_DEADLINE_MS = 30_000;
const LOBBY_COUNTDOWN_MS = 60_000;
const RECONNECT_GRACE_MS = 60_000;
const PARTICIPATION_WARNING_MS = 5 * 60 * 1_000;
const PARTICIPATION_GRACE_MS = 60 * 1_000;
const MAX_REPLAY_CHECKPOINT_DELTA = 48;
const TOKEN_VERSION = "v1";

type RoomTokenPayload = {
  roomId: string;
  userId: string;
  issuedAt: string;
};

type PenaltyResponse =
  | { ok: true; data?: { endsAt?: string | null } }
  | { ok: false };

export class BattleRoomDO {
  private readonly connections = new Map<string, Set<WebSocket>>();

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: Env,
  ) {}

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      return this.handleWebSocket(request, url);
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const now = Date.now();

    if (url.pathname === "/create") {
      return this.handleCreate(body, now);
    }
    if (url.pathname === "/join") {
      return this.handleJoin(body, now);
    }
    if (url.pathname === "/state") {
      return this.handleState(body, now);
    }
    if (url.pathname === "/ready") {
      return this.handleReady(body, now);
    }
    if (url.pathname === "/leave") {
      return this.handleLeave(body, now);
    }
    if (url.pathname === "/sync-replay") {
      return this.handleSyncReplay(body, now);
    }
    if (url.pathname === "/open-trade") {
      return this.handleOpenTrade(body, now);
    }
    if (url.pathname === "/close-trade") {
      return this.handleCloseTrade(body, now);
    }
    if (url.pathname === "/test-participation") {
      return this.handleTestParticipation(body, now);
    }
    if (url.pathname === "/test-lobby-countdown") {
      return this.handleTestLobbyCountdown(body, now);
    }

    return Response.json(
      { ok: false, reason: "room_route_not_found", message: "Battle room route not found." },
      { status: 404 },
    );
  }

  async alarm() {
    const room = await this.loadRoomState();
    if (!room) {
      return;
    }

    this.logRoomEvent("alarm", {
      roomId: room.roomId,
      phase: room.phase,
    });
    const changed = await this.reconcileRoom(room, Date.now());
    if (changed) {
      await this.saveAndBroadcast(room);
      if (room.phase !== "finished") {
        await this.persistRoomSnapshot(room);
      }
      return;
    }

    await this.saveRoomState(room);
  }

  private async loadRoomState() {
    return (await this.state.storage.get<WorkerBattleRoomState>("room")) ?? null;
  }

  private syncRoomCurrentIndex(room: WorkerBattleRoomState) {
    room.playerStates ??= {};
    const replayIndexes = Object.values(room.playerStates).map(
      (state) => normalizePlayerMatchState(room, state).replayIndex,
    );
    const fallbackReplayIndex = Math.max(
      0,
      Math.min(Math.max(room.initialRevealCount - 1, 0), Math.max(room.candles.length - 1, 0)),
    );
    room.currentCandleIndex =
      replayIndexes.length > 0
        ? Math.max(...replayIndexes)
        : fallbackReplayIndex;
  }

  private async saveRoomState(room: WorkerBattleRoomState) {
    this.syncRoomCurrentIndex(room);
    room.lastEventAt = new Date().toISOString();
    const nextAlarmAt = this.getNextAlarmAt(room);
    if (nextAlarmAt) {
      await this.state.storage.setAlarm(nextAlarmAt);
    } else {
      await this.state.storage.deleteAlarm();
    }
    await this.state.storage.put("room", room);
  }

  private async saveAndBroadcast(room: WorkerBattleRoomState) {
    await this.saveRoomState(room);
    await this.broadcastRoomState(room);
  }

  private didPublicReplayStateChange(
    previous: {
      officialBalance: number;
      tradesClosed: number;
      status: WorkerBattlePlayer["status"];
      hasOpenTrade: boolean;
    },
    nextPlayer: WorkerBattlePlayer,
    nextExecution: WorkerBattlePlayerMatchState["execution"],
  ) {
    const nextHasOpenTrade =
      nextExecution?.status === "armed" || nextExecution?.status === "active";

    return (
      previous.officialBalance !== nextPlayer.officialBalance ||
      previous.tradesClosed !== nextPlayer.tradesClosed ||
      previous.status !== nextPlayer.status ||
      previous.hasOpenTrade !== nextHasOpenTrade
    );
  }

  private logRoomEvent(event: string, details: Record<string, unknown>) {
    console.debug(
      "[battle-room]",
      JSON.stringify({
        event,
        roomId: details.roomId,
        userId: details.userId ?? null,
        phase: details.phase ?? null,
        delta: details.delta ?? null,
        reason: details.reason ?? null,
      }),
    );
  }

  private getActiveLobbyPlayers(room: WorkerBattleRoomState) {
    return room.players.filter((player) => player.status === "joined" || player.status === "ready");
  }

  private getNextAlarmAt(room: WorkerBattleRoomState) {
    const candidates: number[] = [];

    if (room.phase === "lobby") {
      if (room.countdownEndsAt) {
        candidates.push(Date.parse(room.countdownEndsAt));
      }

      for (const player of room.players) {
        if (player.status === "joined" && player.readyDeadlineAt) {
          candidates.push(Date.parse(player.readyDeadlineAt));
        }
      }
    }

    if (room.phase === "active") {
      if (room.officialEndAt) {
        candidates.push(Date.parse(room.officialEndAt));
      }

      for (const player of room.players) {
        if (player.status === "active" && player.lastHeartbeatAt) {
          candidates.push(Date.parse(player.lastHeartbeatAt) + RECONNECT_GRACE_MS);
        }

        if (player.status !== "active" || !room.officialStartAt) {
          continue;
        }

        const state = this.getOrCreatePlayerState(room, player.userId);
        if (state.hasEnteredTrade || state.participationStatus === "eliminated") {
          continue;
        }

        const warningAt = Date.parse(room.officialStartAt) + PARTICIPATION_WARNING_MS;
        const deadlineAt = warningAt + PARTICIPATION_GRACE_MS;

        if (state.participationStatus === "clear") {
          candidates.push(warningAt);
        }

        candidates.push(deadlineAt);
      }
    }

    const validCandidates = candidates
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);

    return validCandidates[0] ?? null;
  }

  private getPlayer(room: WorkerBattleRoomState, userId: string) {
    return room.players.find((entry) => entry.userId === userId) ?? null;
  }

  private getOrCreatePlayerState(room: WorkerBattleRoomState, userId: string) {
    const existing = getPlayerMatchState(room, userId);
    if (existing) {
      return normalizePlayerMatchState(room, existing);
    }

    const created = createPlayerMatchState(Math.max(room.initialRevealCount - 1, 0));
    room.playerStates[userId] = created;
    return normalizePlayerMatchState(room, created);
  }

  private isPlayerAllowedInLobby(room: WorkerBattleRoomState, userId: string) {
    const player = this.getPlayer(room, userId);
    if (!player) {
      return null;
    }

    if (player.status !== "joined" && player.status !== "ready") {
      return null;
    }

    return player;
  }

  private isPlayerAllowedInActiveMatch(room: WorkerBattleRoomState, userId: string) {
    const player = this.getPlayer(room, userId);
    if (!player || player.status !== "active") {
      return null;
    }

    const state = this.getOrCreatePlayerState(room, userId);
    if (state.participationStatus === "eliminated") {
      return null;
    }

    return player;
  }

  private getMatchLockMessage(
    room: WorkerBattleRoomState,
    userId: string,
    fallback: string,
  ) {
    const player = this.getPlayer(room, userId);

    if (room.phase === "cancelled") {
      return "This battle room was cancelled.";
    }

    if (room.phase === "finished") {
      return "This battle room has already finished.";
    }

    if (player?.status === "no_trade") {
      return "You were eliminated for not entering a trade before the deadline.";
    }

    if (player?.status === "forfeit") {
      return "You were forfeited after losing room presence.";
    }

    if (player?.status === "left_early") {
      return "You left this match early and can no longer trade in it.";
    }

    return fallback;
  }

  private toBase64Url(bytes: Uint8Array) {
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  private fromBase64Url(value: string) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    return atob(`${normalized}${padding}`);
  }

  private async signTokenValue(value: string) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.env.BATTLE_SHARED_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
    return this.toBase64Url(new Uint8Array(signature));
  }

  private async verifyRoomToken(token: string, expectedRoomId: string) {
    const [version, encodedPayload, signature] = token.split(".");
    if (version !== TOKEN_VERSION || !encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = await this.signTokenValue(`${version}.${encodedPayload}`);
    if (expectedSignature !== signature) {
      return null;
    }

    try {
      const payload = JSON.parse(this.fromBase64Url(encodedPayload)) as RoomTokenPayload;
      if (
        !payload.roomId ||
        !payload.userId ||
        !payload.issuedAt ||
        payload.roomId !== expectedRoomId
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private addConnection(userId: string, socket: WebSocket) {
    const existing = this.connections.get(userId) ?? new Set<WebSocket>();
    existing.add(socket);
    this.connections.set(userId, existing);
  }

  private removeConnection(userId: string, socket: WebSocket) {
    const sockets = this.connections.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(socket);
    if (sockets.size === 0) {
      this.connections.delete(userId);
    }
  }

  private closeConnectionsForUser(userId: string, code = 1000, reason = "room_left") {
    const sockets = this.connections.get(userId);
    if (!sockets) {
      return;
    }

    for (const socket of sockets) {
      try {
        socket.close(code, reason);
      } catch {}
    }

    this.connections.delete(userId);
  }

  private async broadcastRoomState(room: WorkerBattleRoomState) {
    for (const [userId, sockets] of this.connections.entries()) {
      const player = this.getPlayer(room, userId);
      if (!player) {
        for (const socket of sockets) {
          try {
            socket.close(1008, "room_access_revoked");
          } catch {}
        }
        this.connections.delete(userId);
        continue;
      }

      const payload = JSON.stringify({
        type: "room_view",
        room: buildViewerState(room, userId),
      });

      for (const socket of [...sockets]) {
        if (socket.readyState !== WebSocket.OPEN) {
          this.removeConnection(userId, socket);
          continue;
        }

        try {
          socket.send(payload);
        } catch {
          this.removeConnection(userId, socket);
        }
      }
    }
  }

  private async handleWebSocket(request: Request, url: URL) {
    const roomId = url.searchParams.get("roomId");
    const token = url.searchParams.get("token");
    const upgrade = request.headers.get("Upgrade");
    if (upgrade?.toLowerCase() !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    if (!roomId || !token) {
      return new Response("Missing room websocket parameters.", { status: 400 });
    }

    const room = await this.loadRoomState();
    if (!room || room.roomId !== roomId) {
      return new Response("Room not found.", { status: 404 });
    }

    const payload = await this.verifyRoomToken(token, roomId);
    if (!payload) {
      return new Response("Invalid room token.", { status: 401 });
    }

    const player = this.getPlayer(room, payload.userId);
    if (!player) {
      return new Response("Not a room participant.", { status: 403 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    this.addConnection(payload.userId, server);

    server.addEventListener("close", () => {
      this.removeConnection(payload.userId, server);
    });
    server.addEventListener("error", () => {
      this.removeConnection(payload.userId, server);
    });
    server.addEventListener("message", (event) => {
      if (typeof event.data === "string" && event.data === "ping") {
        void (async () => {
          const latestRoom = await this.loadRoomState();
          if (!latestRoom) {
            return;
          }

          const playerWithHeartbeat = updateHeartbeat(
            latestRoom,
            payload.userId,
            new Date(Date.now()).toISOString(),
          );
          if (playerWithHeartbeat) {
            await this.saveRoomState(latestRoom);
            this.logRoomEvent("ws-ping", {
              roomId: latestRoom.roomId,
              userId: payload.userId,
              phase: latestRoom.phase,
            });
          }

          try {
            server.send(JSON.stringify({ type: "pong" }));
          } catch {}
        })();
      }
    });

    updateHeartbeat(room, payload.userId, new Date().toISOString());
    this.logRoomEvent("ws-connect", {
      roomId: room.roomId,
      userId: payload.userId,
      phase: room.phase,
    });
    await this.reconcileRoom(room, Date.now());
    await this.saveAndBroadcast(room);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async issuePenalty(
    roomId: string,
    userId: string,
    reason: "left_early" | "forfeit" | "no_trade",
  ) {
    const response = await fetch(`${this.env.APP_BASE_URL}/api/battle/internal/issue-penalty`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": this.env.BATTLE_SHARED_SECRET,
      },
      body: JSON.stringify({
        roomId,
        userId,
        reason,
      }),
    }).catch(() => null);

    if (!response) {
      return null;
    }

    return (await response.json().catch(() => null)) as PenaltyResponse | null;
  }

  private async persistRoomSnapshot(room: WorkerBattleRoomState) {
    await fetch(`${this.env.APP_BASE_URL}/api/battle/internal/persist-room`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": this.env.BATTLE_SHARED_SECRET,
      },
      body: JSON.stringify({
        room: buildViewerState(room, room.players[0]?.userId ?? "00000000-0000-0000-0000-000000000000").room,
      }),
    }).catch(() => null);
  }

  private async eliminateForNoTrade(
    room: WorkerBattleRoomState,
    player: WorkerBattlePlayer,
    state: WorkerBattlePlayerMatchState,
  ) {
    if (player.status !== "active" || state.participationStatus === "eliminated") {
      return false;
    }

    player.status = "no_trade";
    player.connected = false;
    state.participationStatus = "eliminated";
    state.execution = null;

    if (!state.activePenaltyUntil) {
      const penalty = await this.issuePenalty(room.roomId, player.userId, "no_trade");
      if (penalty?.ok) {
        state.activePenaltyUntil = penalty.data?.endsAt ?? null;
      }
    }

    return true;
  }

  private clearParticipationWarning(state: WorkerBattlePlayerMatchState) {
    const changed =
      state.participationStatus !== "clear" ||
      state.participationWarningIssuedAt !== null ||
      state.participationDeadlineAt !== null;
    state.participationStatus = "clear";
    state.participationWarningIssuedAt = null;
    state.participationDeadlineAt = null;
    return changed;
  }

  private async enforceParticipationRule(room: WorkerBattleRoomState, nowMs: number) {
    if (room.phase !== "active" || !room.officialStartAt) {
      return false;
    }

    const warningAtMs = Date.parse(room.officialStartAt) + PARTICIPATION_WARNING_MS;
    const deadlineMs = warningAtMs + PARTICIPATION_GRACE_MS;
    let changed = false;

    for (const player of room.players) {
      if (player.status !== "active") {
        continue;
      }

      const state = this.getOrCreatePlayerState(room, player.userId);
      if (state.hasEnteredTrade) {
        changed = this.clearParticipationWarning(state) || changed;
        continue;
      }

      if (nowMs >= deadlineMs) {
        state.participationWarningIssuedAt ??= new Date(warningAtMs).toISOString();
        state.participationDeadlineAt ??= new Date(deadlineMs).toISOString();
        changed = (await this.eliminateForNoTrade(room, player, state)) || changed;
        continue;
      }

      if (nowMs >= warningAtMs && state.participationStatus === "clear") {
        state.participationStatus = "warned";
        state.participationWarningIssuedAt = new Date(nowMs).toISOString();
        state.participationDeadlineAt = new Date(deadlineMs).toISOString();
        changed = true;
      }
    }

    return changed;
  }

  private async reconcileRoom(room: WorkerBattleRoomState, nowMs: number) {
    let changed = false;
    changed = removeExpiredUnreadyPlayers(room, nowMs) || changed;
    changed = markDisconnectedForfeits(room, nowMs) || changed;

    if (room.phase === "lobby" && room.countdownEndsAt) {
      const activeLobbyPlayers = this.getActiveLobbyPlayers(room);
      if (activeLobbyPlayers.length >= room.maxPlayers) {
        changed = (await this.startRoom(room, nowMs)) || changed;
      } else if (Date.parse(room.countdownEndsAt) <= nowMs) {
        if (activeLobbyPlayers.length >= 2) {
          changed = (await this.startRoom(room, nowMs)) || changed;
        } else {
          room.phase = "cancelled";
          room.cancelReason = "not_enough_ready_players";
          changed = true;
        }
      }
    }

    if (room.phase === "active") {
      changed = (await this.enforceParticipationRule(room, nowMs)) || changed;

      if (room.officialEndAt && Date.parse(room.officialEndAt) <= nowMs) {
        changed = (await this.finalizeRoom(room, nowMs)) || changed;
      }
    }

    rankPlayers(room.players);
    return changed;
  }

  private async fetchSeedData(): Promise<WorkerBattleSeedData> {
    const response = await fetch(`${this.env.APP_BASE_URL}/api/battle/internal/seed-room`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": this.env.BATTLE_SHARED_SECRET,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`seed_room_failed:${response.status}`);
    }

    const payload = (await response.json()) as {
      ok: boolean;
      data?: {
        selection: { symbol: string; timeframe: string; initialRevealCount: number };
        candles: Array<{
          time: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }>;
      };
    };

    if (!payload.ok || !payload.data) {
      throw new Error("seed_room_invalid_payload");
    }

    return {
      selection: {
        symbol: payload.data.selection.symbol,
        timeframe: payload.data.selection.timeframe as WorkerBattleSeedData["selection"]["timeframe"],
        initialRevealCount: payload.data.selection.initialRevealCount,
      },
      candles: payload.data.candles,
    };
  }

  private async startRoom(room: WorkerBattleRoomState, nowMs: number) {
    if (room.phase !== "lobby") {
      return false;
    }

    let seed: WorkerBattleSeedData;
    try {
      seed = await this.fetchSeedData();
    } catch {
      room.phase = "cancelled";
      room.cancelReason = "service_unavailable";
      room.pendingSeedData = null;
      return true;
    }

    if (!seed || seed.candles.length === 0) {
      room.phase = "cancelled";
      room.cancelReason = "service_unavailable";
      room.pendingSeedData = null;
      return true;
    }

    const initialRevealCount = Math.max(
      1,
      Math.min(seed.selection.initialRevealCount, seed.candles.length),
    );

    room.phase = "active";
    room.symbol = seed.selection.symbol;
    room.timeframe = seed.selection.timeframe as WorkerBattleRoomState["timeframe"];
    room.candles = seed.candles;
    room.initialRevealCount = initialRevealCount;
    room.currentCandleIndex = initialRevealCount - 1;
    room.countdownEndsAt = null;
    room.officialStartAt = new Date(nowMs).toISOString();
    room.officialEndAt = new Date(nowMs + room.durationMinutes * 60 * 1_000).toISOString();
    room.pendingSeedData = null;

    const activeLobbyPlayerIds = new Set(
      this.getActiveLobbyPlayers(room).map((player) => player.userId),
    );

    for (const player of room.players) {
      if (activeLobbyPlayerIds.has(player.userId)) {
        player.status = "active";
        player.readyDeadlineAt = null;
        room.playerStates[player.userId] = createPlayerMatchState(initialRevealCount - 1);
      } else if (player.status === "joined" || player.status === "ready") {
        player.status = "removed_unready";
      }
    }

    return true;
  }

  private async finalizeRoom(room: WorkerBattleRoomState, nowMs: number) {
    if (room.phase === "finished" || room.finalizedAt) {
      return false;
    }

    const finalIndex = room.candles.length - 1;
    const finalCandle = room.candles[finalIndex] ?? null;

    for (const player of room.players) {
      const state = this.getOrCreatePlayerState(room, player.userId);
      if (state.execution?.status === "active" && finalCandle) {
        const resolved = finalizeUnfinishedTrade(
          state.execution,
          finalCandle,
          finalIndex,
          state.execution.direction,
        ) as WorkerBattleExecution;
        settleResolvedExecution(player, resolved);
        state.execution = null;
      } else if (state.execution?.status === "armed") {
        state.execution = null;
      }

      if (player.status === "active") {
        player.status = state.hasEnteredTrade ? "finished" : "no_trade";
      }
    }

    rankPlayers(room.players);
    room.winnerUserId = room.players[0]?.userId ?? null;
    room.phase = "finished";
    room.finalizedAt = new Date(nowMs).toISOString();

    await fetch(`${this.env.APP_BASE_URL}/api/battle/internal/finalize-room`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-battle-internal-secret": this.env.BATTLE_SHARED_SECRET,
      },
      body: JSON.stringify({
        room: {
          roomId: room.roomId,
          roomType: room.roomType,
          durationMinutes: room.durationMinutes,
          symbol: room.symbol,
          timeframe: room.timeframe,
          phase: room.phase,
          startedAt: room.officialStartAt,
          endedAt: room.finalizedAt,
          winnerUserId: room.winnerUserId,
          cancelReason: room.cancelReason,
          lobbyCode: room.lobbyCode,
        },
        players: room.players.map((player) => ({
          userId: player.userId,
          displayName: player.displayName,
          status: player.status,
          finalBalance: player.officialBalance,
          realizedPnl: Number((player.officialBalance - STARTING_BALANCE).toFixed(2)),
          rank: player.officialRank,
          totalTrades: player.tradesClosed,
          winningTrades: player.wins,
          losingTrades: player.losses,
          penaltyReason:
            player.status === "left_early" ||
            player.status === "forfeit" ||
            player.status === "no_trade"
              ? player.status
              : null,
        })),
      }),
    }).catch(() => null);

    return true;
  }

  private jsonSuccess(data: { room: WorkerBattleView | null }) {
    return Response.json({ ok: true, data });
  }

  private jsonFailure(
    reason: string,
    message: string,
    status = 400,
    room?: WorkerBattleRoomState,
    viewerUserId?: string,
  ) {
    return Response.json(
      {
        ok: false,
        reason,
        message,
        data:
          room && viewerUserId
            ? {
                room: buildViewerState(room, viewerUserId),
              }
            : undefined,
      },
      { status },
    );
  }

  private async handleCreate(body: Record<string, unknown> | null, nowMs: number) {
    if (!body) {
      return this.jsonFailure("invalid_payload", "Missing room create payload.");
    }

    const creatorId = String(body.userId);
    const room: WorkerBattleRoomState = {
      roomId: String(body.roomId),
      lobbyCode: typeof body.lobbyCode === "string" ? body.lobbyCode : null,
      roomType: body.roomType === "private" ? "private" : "public",
      phase: "lobby",
      durationMinutes: Number(body.durationMinutes) as WorkerBattleRoomState["durationMinutes"],
      symbol: null,
      timeframe: null,
      maxPlayers: 5,
      createdAt: new Date(nowMs).toISOString(),
      countdownEndsAt: new Date(nowMs + LOBBY_COUNTDOWN_MS).toISOString(),
      officialStartAt: null,
      officialEndAt: null,
      lastEventAt: new Date(nowMs).toISOString(),
      cancelReason: null,
      winnerUserId: null,
      currentCandleIndex: null,
      initialRevealCount: 0,
      candles: [],
      pendingSeedData: null,
      players: [
        createLobbyPlayer({
          userId: creatorId,
          displayName: String(body.displayName),
          isCreator: true,
          nowIso: new Date(nowMs).toISOString(),
        }),
      ],
      playerStates: {
        [creatorId]: createPlayerMatchState(0),
      },
      finalizedAt: null,
    };

    await this.saveAndBroadcast(room);
    return this.jsonSuccess({
      room: buildViewerState(room, creatorId),
    });
  }

  private async handleJoin(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const reconciled = await this.reconcileRoom(room, nowMs);
    if (reconciled) {
      await this.saveAndBroadcast(room);
    }

    if (room.phase !== "lobby") {
      return this.jsonFailure("room_already_started", "Battle room already started.");
    }

    const userId = String(body.userId);
    const existing = room.players.find((player) => player.userId === userId);
    if (existing) {
      updateHeartbeat(room, userId, new Date(nowMs).toISOString());
      await this.saveAndBroadcast(room);
      return this.jsonSuccess({ room: buildViewerState(room, userId) });
    }

    const activePlayers = this.getActiveLobbyPlayers(room);
    if (activePlayers.length >= room.maxPlayers) {
      return this.jsonFailure("room_full", "This battle room is full.");
    }

    room.players.push(
      createLobbyPlayer({
        userId,
        displayName: String(body.displayName),
        isCreator: false,
        nowIso: new Date(nowMs).toISOString(),
      }),
    );
    room.playerStates[userId] = createPlayerMatchState(Math.max(room.initialRevealCount - 1, 0));

    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleState(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const userId = String(body.userId);
    const player = updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    if (!player) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    this.getOrCreatePlayerState(room, userId);
    await this.saveRoomState(room);
    this.logRoomEvent("state", {
      roomId: room.roomId,
      userId,
      phase: room.phase,
    });
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleReady(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    if (room.phase !== "lobby") {
      return this.jsonFailure("room_already_started", "Battle room already started.");
    }

    const userId = String(body.userId);
    const ready = Boolean(body.ready);
    const player = this.isPlayerAllowedInLobby(room, userId);
    if (!player) {
      return this.jsonFailure("room_not_found", "Player not found in this room.", 404);
    }

    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    player.isReady = ready;
    player.status = ready ? "ready" : "joined";
    player.readyDeadlineAt = ready ? null : new Date(nowMs + READY_DEADLINE_MS).toISOString();

    await this.reconcileRoom(room, nowMs);
    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleLeave(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const userId = String(body.userId);
    const player = this.getPlayer(room, userId);
    if (!player) {
      return this.jsonFailure("room_not_found", "Player not found in this room.", 404);
    }

    if (room.phase === "lobby") {
      room.players = room.players.filter((entry) => entry.userId !== userId);
      delete room.playerStates[userId];
      this.closeConnectionsForUser(userId, 1000, "left_lobby");

      await this.reconcileRoom(room, nowMs);
      await this.saveAndBroadcast(room);
      await this.persistRoomSnapshot(room);
      return this.jsonSuccess({ room: null });
    }

    player.connected = false;
    player.disconnectedAt = new Date(nowMs).toISOString();
    player.status = "left_early";
    const state = this.getOrCreatePlayerState(room, userId);
    state.execution = null;

    if (room.phase === "active" && !state.activePenaltyUntil) {
      const penalty = await this.issuePenalty(room.roomId, userId, "left_early");
      if (penalty?.ok) {
        state.activePenaltyUntil = penalty.data?.endsAt ?? null;
      }
    }

    await this.reconcileRoom(room, nowMs);
    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleSyncReplay(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const reconciled = await this.reconcileRoom(room, nowMs);
    if (reconciled) {
      await this.saveAndBroadcast(room);
    }
    if (room.phase !== "active") {
      return this.jsonFailure("room_not_active", "Battle room is not active.", 409);
    }

    const userId = String(body.userId);
    const player = this.isPlayerAllowedInActiveMatch(room, userId);
    if (!player) {
      return this.jsonFailure(
        "player_eliminated",
        this.getMatchLockMessage(
          room,
          userId,
          "This player can no longer replay or trade in the match.",
        ),
        409,
        room,
        userId,
      );
    }

    const state = this.getOrCreatePlayerState(room, userId);
    const previousPublicState = {
      officialBalance: player.officialBalance,
      tradesClosed: player.tradesClosed,
      status: player.status,
      hasOpenTrade:
        state.execution?.status === "armed" || state.execution?.status === "active",
    };
    const requestedReplayIndex = Number(body.replayIndex);
    const maxReplayIndex = room.candles.length - 1;

    if (!Number.isInteger(requestedReplayIndex) || requestedReplayIndex > maxReplayIndex) {
      return this.jsonFailure(
        "invalid_replay_progression",
        "Replay progression is outside the canonical dataset.",
        400,
        room,
        userId,
      );
    }

    if (requestedReplayIndex <= state.replayIndex) {
      return this.jsonFailure(
        "invalid_replay_progression",
        "Replay progression must move forward from the current authoritative candle.",
        409,
        room,
        userId,
      );
    }

    const replayDelta = requestedReplayIndex - state.replayIndex;
    if (replayDelta > MAX_REPLAY_CHECKPOINT_DELTA) {
      return this.jsonFailure(
        "invalid_replay_progression",
        "Replay progression exceeded the allowed checkpoint window.",
        409,
        room,
        userId,
      );
    }

    for (
      let nextReplayIndex = state.replayIndex + 1;
      nextReplayIndex <= requestedReplayIndex;
      nextReplayIndex += 1
    ) {
      const nextCandle = getReplayCandle(room, nextReplayIndex);
      if (!nextCandle) {
        return this.jsonFailure(
          "invalid_replay_progression",
          "Replay progression is outside the canonical dataset.",
          400,
          room,
          userId,
        );
      }

      state.replayIndex = nextReplayIndex;
      if (state.execution?.status === "armed") {
        state.execution = advancePendingTradeExecution(
          state.execution,
          nextCandle,
          nextReplayIndex,
          state.execution.direction,
        ) as WorkerBattleExecution;
      } else if (state.execution?.status === "active") {
        state.execution = advanceTradeExecution(
          state.execution,
          nextCandle,
          nextReplayIndex,
          state.execution.direction,
        ) as WorkerBattleExecution;
      }

      if (
        state.execution &&
        state.execution.status !== "armed" &&
        state.execution.status !== "active" &&
        state.execution.resultAmount !== null
      ) {
        settleResolvedExecution(player, state.execution);
        state.execution = null;
      }
    }

    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    this.logRoomEvent("sync-replay", {
      roomId: room.roomId,
      userId,
      phase: room.phase,
      delta: replayDelta,
    });
    await this.saveRoomState(room);

    if (this.didPublicReplayStateChange(previousPublicState, player, state.execution)) {
      await this.broadcastRoomState(room);
    }

    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleTestParticipation(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    if (room.phase !== "active" || !room.officialStartAt) {
      return this.jsonFailure("room_not_active", "Battle room is not active.", 409);
    }

    const stage = body.stage === "warning" || body.stage === "deadline" ? body.stage : null;
    if (!stage) {
      return this.jsonFailure("invalid_payload", "Participation test stage is required.", 400);
    }

    const offsetMs =
      stage === "warning"
        ? PARTICIPATION_WARNING_MS + 1_000
        : PARTICIPATION_WARNING_MS + PARTICIPATION_GRACE_MS + 1_000;

    room.officialStartAt = new Date(nowMs - offsetMs).toISOString();
    const changed = await this.reconcileRoom(room, nowMs);

    await this.saveAndBroadcast(room);
    if (changed) {
      await this.persistRoomSnapshot(room);
    }

    return this.jsonSuccess({
      room: buildViewerState(room, room.players[0]?.userId ?? ""),
    });
  }

  private async handleTestLobbyCountdown(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    if (room.phase !== "lobby") {
      return this.jsonFailure("room_not_in_lobby", "Battle room is not in the lobby.", 409);
    }

    room.countdownEndsAt = new Date(nowMs - 1_000).toISOString();
    const changed = await this.reconcileRoom(room, nowMs);

    await this.saveAndBroadcast(room);
    if (changed) {
      await this.persistRoomSnapshot(room);
    }

    return this.jsonSuccess({
      room: buildViewerState(room, room.players[0]?.userId ?? ""),
    });
  }

  private async handleOpenTrade(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const reconciled = await this.reconcileRoom(room, nowMs);
    if (reconciled) {
      await this.saveAndBroadcast(room);
    }
    if (room.phase !== "active") {
      return this.jsonFailure("room_not_active", "Battle room is not active.");
    }

    const userId = String(body.userId);
    const player = this.isPlayerAllowedInActiveMatch(room, userId);
    if (!player) {
      return this.jsonFailure(
        "player_eliminated",
        this.getMatchLockMessage(
          room,
          userId,
          "This player can no longer open a trade in the match.",
        ),
        409,
        room,
        userId,
      );
    }

    const state = this.getOrCreatePlayerState(room, userId);
    if (state.execution && (state.execution.status === "armed" || state.execution.status === "active")) {
      return this.jsonFailure("trade_already_open", "Only one open trade is allowed.");
    }

    const replayIndex = Number(body.replayIndex);
    if (!Number.isInteger(replayIndex) || replayIndex !== state.replayIndex) {
      return this.jsonFailure(
        "invalid_replay_progression",
        "Trade request used a stale replay position.",
        409,
        room,
        userId,
      );
    }

    const visibleCandle = getReplayCandle(room, replayIndex);
    if (!visibleCandle) {
      return this.jsonFailure("room_not_active", "Current price is unavailable.");
    }

    const direction = String(body.direction) as WorkerBattleDirection;
    const orderType = String(body.orderType) as "market" | "limit" | "stop";
    const riskPercent = Number(body.riskPercent);
    const entryPrice =
      orderType === "market" ? visibleCandle.close : Number(body.entryPrice);
    const stopLoss = body.stopLoss === null ? null : Number(body.stopLoss);
    const takeProfit = body.takeProfit === null ? null : Number(body.takeProfit);

    const validation = validateTradeDraft({
      direction,
      orderType,
      entry: String(entryPrice),
      hasStop: stopLoss !== null,
      stop: stopLoss === null ? "" : String(stopLoss),
      hasTarget: takeProfit !== null,
      target: takeProfit === null ? "" : String(takeProfit),
      volume: "",
    });

    if (
      !validation.isValid ||
      !Number.isFinite(riskPercent) ||
      riskPercent <= 0
    ) {
      return this.jsonFailure("invalid_trade_payload", validation.message ?? "Enter a valid battle trade.");
    }

    const risk = deriveRiskSettings(
      {
        startingBalance: player.officialBalance,
        currentBalance: player.officialBalance,
        defaultRiskPercent: 1,
      },
      { riskPercent },
    );
    const volume = calculatePositionSizeFromNotional(validation.entry, risk.riskAmount);
    if (!volume || !Number.isFinite(volume) || volume <= 0) {
      return this.jsonFailure(
        "invalid_trade_payload",
        "This setup cannot derive a valid battle position size.",
      );
    }

    const baseExecution =
      orderType === "market"
        ? activateTradeExecution(validation, replayIndex, visibleCandle.time, {
            orderType,
            riskPercent: risk.riskPercent,
            riskAmount: risk.riskAmount,
            volume,
            balanceBeforeTrade: player.officialBalance,
          })
        : armPendingTradeExecution(validation, {
            orderType,
            riskPercent: risk.riskPercent,
            riskAmount: risk.riskAmount,
            volume,
            balanceBeforeTrade: player.officialBalance,
          });

    state.execution = {
      id: crypto.randomUUID(),
      direction,
      ...baseExecution,
    };
    state.hasEnteredTrade = true;
    this.clearParticipationWarning(state);
    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    this.logRoomEvent("open-trade", {
      roomId: room.roomId,
      userId,
      phase: room.phase,
    });

    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleCloseTrade(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    const reconciled = await this.reconcileRoom(room, nowMs);
    if (reconciled) {
      await this.saveAndBroadcast(room);
    }
    if (room.phase !== "active") {
      return this.jsonFailure("room_not_active", "Battle room is not active.");
    }

    const userId = String(body.userId);
    const player = this.isPlayerAllowedInActiveMatch(room, userId);
    if (!player) {
      return this.jsonFailure(
        "player_eliminated",
        this.getMatchLockMessage(
          room,
          userId,
          "This player can no longer close a trade in the match.",
        ),
        409,
        room,
        userId,
      );
    }

    const state = this.getOrCreatePlayerState(room, userId);
    const replayIndex = Number(body.replayIndex);
    if (!Number.isInteger(replayIndex) || replayIndex !== state.replayIndex) {
      return this.jsonFailure(
        "invalid_replay_progression",
        "Trade close request used a stale replay position.",
        409,
        room,
        userId,
      );
    }

    if (!state.execution || state.execution.status !== "active") {
      return this.jsonFailure("no_open_trade", "No open trade is available to close.");
    }

    const visibleCandle = getReplayCandle(room, replayIndex);
    if (!visibleCandle) {
      return this.jsonFailure("room_not_active", "Current price is unavailable.");
    }

    const resolved = manuallyCloseTrade(
      state.execution,
      visibleCandle,
      replayIndex,
      state.execution.direction,
    ) as WorkerBattleExecution;

    settleResolvedExecution(player, resolved);
    state.execution = null;
    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    this.logRoomEvent("close-trade", {
      roomId: room.roomId,
      userId,
      phase: room.phase,
    });

    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }
}
