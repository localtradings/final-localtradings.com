import type { DurableObjectState } from "@cloudflare/workers-types";

import {
  buildViewerState,
  createLobbyPlayer,
  getCurrentPrice,
  markDisconnectedForfeits,
  rankPlayers,
  removeExpiredUnreadyPlayers,
  settleTrade,
  updateHeartbeat,
} from "./state";
import type {
  WorkerBattleDirection,
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
const ACTIVE_TICK_MS = 1_000;
const RECONNECT_GRACE_MS = 60_000;
const TOKEN_VERSION = "v1";

type RoomTokenPayload = {
  roomId: string;
  userId: string;
  issuedAt: string;
};

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
    if (url.pathname === "/open-trade") {
      return this.handleOpenTrade(body, now);
    }
    if (url.pathname === "/close-trade") {
      return this.handleCloseTrade(body, now);
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

    await this.reconcileRoom(room, Date.now());
  }

  private async loadRoomState() {
    return (await this.state.storage.get<WorkerBattleRoomState>("room")) ?? null;
  }

  private async saveRoomState(room: WorkerBattleRoomState) {
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

  private getActiveLobbyPlayers(room: WorkerBattleRoomState) {
    return room.players.filter((player) =>
      player.status === "joined" || player.status === "ready",
    );
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
      candidates.push(Date.now() + ACTIVE_TICK_MS);

      if (room.officialEndAt) {
        candidates.push(Date.parse(room.officialEndAt));
      }

      for (const player of room.players) {
        if (player.status === "active" && player.lastHeartbeatAt) {
          candidates.push(Date.parse(player.lastHeartbeatAt) + RECONNECT_GRACE_MS);
        }
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
    if (!player) {
      return null;
    }

    if (player.status !== "active") {
      return null;
    }

    return player;
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
        try {
          server.send(JSON.stringify({ type: "pong" }));
        } catch {}
      }
    });

    updateHeartbeat(room, payload.userId, new Date().toISOString());
    await this.reconcileRoom(room, Date.now());

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async reconcileRoom(room: WorkerBattleRoomState, nowMs: number) {
    removeExpiredUnreadyPlayers(room, nowMs);
    markDisconnectedForfeits(room, nowMs);

    if (room.phase === "lobby" && room.countdownEndsAt) {
      const activeLobbyPlayers = this.getActiveLobbyPlayers(room);
      const readyPlayers = activeLobbyPlayers.filter((player) => player.isReady);

      if (activeLobbyPlayers.length >= 2 && readyPlayers.length === activeLobbyPlayers.length) {
        await this.startRoom(room, nowMs);
      } else if (Date.parse(room.countdownEndsAt) <= nowMs) {
        if (readyPlayers.length >= 2) {
          await this.startRoom(room, nowMs);
        } else {
          room.phase = "cancelled";
          room.cancelReason = "not_enough_ready_players";
        }
      }
    }

    if (room.phase === "active") {
      this.advanceRoomCandle(room, nowMs);

      if (room.officialEndAt && Date.parse(room.officialEndAt) <= nowMs) {
        await this.finalizeRoom(room, nowMs);
      }
    }

    rankPlayers(room.players);
    await this.saveAndBroadcast(room);
  }

  private advanceRoomCandle(room: WorkerBattleRoomState, nowMs: number) {
    if (!room.officialStartAt || !room.officialEndAt || room.candles.length === 0) {
      return;
    }

    const startMs = Date.parse(room.officialStartAt);
    const endMs = Date.parse(room.officialEndAt);
    const durationMs = Math.max(1, endMs - startMs);
    const remainingPlayableCandles = Math.max(
      1,
      room.candles.length - room.initialRevealCount,
    );
    const progress = Math.min(1, Math.max(0, (nowMs - startMs) / durationMs));
    room.currentCandleIndex = Math.min(
      room.candles.length - 1,
      room.initialRevealCount - 1 + Math.floor(progress * remainingPlayableCandles),
    );
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
      return;
    }

    let seed: WorkerBattleSeedData;
    try {
      seed = await this.fetchSeedData();
    } catch {
      room.phase = "cancelled";
      room.cancelReason = "service_unavailable";
      room.pendingSeedData = null;
      return;
    }

    if (!seed || seed.candles.length === 0) {
      room.phase = "cancelled";
      room.cancelReason = "service_unavailable";
      room.pendingSeedData = null;
      return;
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
    room.officialEndAt = new Date(
      nowMs + room.durationMinutes * 60 * 1_000,
    ).toISOString();
    room.pendingSeedData = null;

    for (const player of room.players) {
      if (player.isReady) {
        player.status = "active";
        player.readyDeadlineAt = null;
      } else if (player.status === "joined") {
        player.status = "removed_unready";
      }
    }
  }

  private async finalizeRoom(room: WorkerBattleRoomState, nowMs: number) {
    if (room.phase === "finished" || room.finalizedAt) {
      return;
    }

    const finalPrice =
      room.candles[room.candles.length - 1]?.close ?? getCurrentPrice(room) ?? null;

    for (const player of room.players) {
      const openTrade = room.activeTrades[player.userId];
      if (openTrade && finalPrice !== null) {
        settleTrade(player, openTrade, finalPrice);
        room.lastClosedTradeIds[player.userId] = openTrade.id;
        delete room.activeTrades[player.userId];
      }

      if (player.status === "active") {
        player.status = player.tradesClosed === 0 ? "no_trade" : "finished";
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
  }

  private jsonSuccess(data: { room: WorkerBattleView }) {
    return Response.json({ ok: true, data });
  }

  private jsonFailure(reason: string, message: string, status = 400) {
    return Response.json({ ok: false, reason, message }, { status });
  }

  private async handleCreate(body: Record<string, unknown> | null, nowMs: number) {
    if (!body) {
      return this.jsonFailure("invalid_payload", "Missing room create payload.");
    }

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
          userId: String(body.userId),
          displayName: String(body.displayName),
          isCreator: true,
          nowIso: new Date(nowMs).toISOString(),
        }),
      ],
      activeTrades: {},
      lastClosedTradeIds: {},
      finalizedAt: null,
    };

    await this.saveAndBroadcast(room);
    return this.jsonSuccess({
      room: buildViewerState(room, String(body.userId)),
    });
  }

  private async handleJoin(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    await this.reconcileRoom(room, nowMs);

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

    await this.reconcileRoom(room, nowMs);
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
    player.readyDeadlineAt = ready
      ? null
      : new Date(nowMs + READY_DEADLINE_MS).toISOString();

    await this.reconcileRoom(room, nowMs);
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

    player.connected = false;
    player.disconnectedAt = new Date(nowMs).toISOString();
    player.status = room.phase === "active" ? "left_early" : "left_lobby";
    delete room.activeTrades[userId];

    await this.reconcileRoom(room, nowMs);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleOpenTrade(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    await this.reconcileRoom(room, nowMs);
    if (room.phase !== "active") {
      return this.jsonFailure("room_not_active", "Battle room is not active.");
    }

    const userId = String(body.userId);
    const player = this.isPlayerAllowedInActiveMatch(room, userId);
    if (!player) {
      return this.jsonFailure("room_not_found", "Player not found in this active room.", 404);
    }

    const existingTrade = room.activeTrades[userId];
    if (existingTrade && (existingTrade.status === "open" || existingTrade.status === "closing")) {
      return this.jsonFailure("trade_already_open", "Only one open trade is allowed.");
    }

    const price = getCurrentPrice(room);
    if (price === null) {
      return this.jsonFailure("room_not_active", "Current price is unavailable.");
    }

    room.activeTrades[userId] = {
      id: crypto.randomUUID(),
      status: "open",
      direction: String(body.direction) as WorkerBattleDirection,
      orderType: "market",
      volume: Number(body.volume),
      entryPrice: price,
      openedAtIndex: room.currentCandleIndex ?? 0,
      openedAtTime: room.candles[room.currentCandleIndex ?? 0]?.time ?? Math.floor(nowMs / 1000),
    };

    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }

  private async handleCloseTrade(body: Record<string, unknown> | null, nowMs: number) {
    const room = await this.loadRoomState();
    if (!room || !body) {
      return this.jsonFailure("room_not_found", "Battle room not found.", 404);
    }

    await this.reconcileRoom(room, nowMs);
    if (room.phase !== "active") {
      return this.jsonFailure("room_not_active", "Battle room is not active.");
    }

    const userId = String(body.userId);
    const tradeId = typeof body.tradeId === "string" ? body.tradeId : null;
    if (!tradeId) {
      return this.jsonFailure("no_open_trade", "No open trade is available to close.");
    }

    if (room.lastClosedTradeIds[userId] === tradeId) {
      return this.jsonSuccess({ room: buildViewerState(room, userId) });
    }

    const trade = room.activeTrades[userId];
    const player = this.isPlayerAllowedInActiveMatch(room, userId);
    if (!trade || !player || trade.id !== tradeId) {
      return this.jsonFailure("no_open_trade", "No open trade is available to close.");
    }

    const price = getCurrentPrice(room);
    if (price === null) {
      return this.jsonFailure("room_not_active", "Current price is unavailable.");
    }

    room.activeTrades[userId] = {
      ...trade,
      status: "closing",
    };

    settleTrade(player, trade, price);
    room.lastClosedTradeIds[userId] = trade.id;
    delete room.activeTrades[userId];
    updateHeartbeat(room, userId, new Date(nowMs).toISOString());
    await this.saveAndBroadcast(room);
    return this.jsonSuccess({ room: buildViewerState(room, userId) });
  }
}
