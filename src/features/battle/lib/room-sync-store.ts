"use client";

import {
  BATTLE_CONNECTION_REUSE_WINDOW_MS,
  BATTLE_EVENT_STALE_MS,
  BATTLE_FALLBACK_RESYNC_MS,
  BATTLE_INITIAL_SYNC_TIMEOUT_MS,
  BATTLE_SOCKET_PING_MS,
} from "@/features/battle/constants";
import type { BattleRoomSession, BattleRoomView } from "@/features/battle/types";
import { refreshBattleRoomAction } from "@/server/battle/actions";

export type RoomSyncSnapshot = {
  roomView: BattleRoomView | null;
  error: string | null;
  hasBootstrapped: boolean;
  isSocketConnected: boolean;
};

type RoomSyncListener = () => void;

function mergeToken(
  nextView: BattleRoomView | null,
  currentView: BattleRoomView | null,
  fallbackToken: string | null,
) {
  if (!nextView) {
    return nextView;
  }

  return {
    ...nextView,
    token: nextView.token ?? currentView?.token ?? fallbackToken,
  };
}

function getSessionToken(session: BattleRoomSession) {
  return session.initialView?.token ?? session.roomToken ?? null;
}

export class SharedBattleRoomSync {
  private roomId: string;
  private workerSocketUrl: string | null;
  private token: string | null;
  private snapshot: RoomSyncSnapshot;
  private readonly listeners = new Set<RoomSyncListener>();
  private socket: WebSocket | null = null;
  private pingInterval = 0;
  private fallbackInterval = 0;
  private bootstrapTimeout = 0;
  private disposeTimeout = 0;
  private refreshPromise: Promise<void> | null = null;
  private lastAuthoritativeEventAt = 0;
  private socketIssueUntil = 0;

  constructor(
    private readonly storeKey: string,
    session: BattleRoomSession,
    private readonly onDispose: (storeKey: string) => void,
  ) {
    this.roomId = session.roomId;
    this.workerSocketUrl = session.workerSocketUrl;
    this.token = getSessionToken(session);
    this.snapshot = {
      roomView: session.initialView,
      error: null,
      hasBootstrapped: Boolean(session.initialView),
      isSocketConnected: false,
    };

    if (session.initialView) {
      this.lastAuthoritativeEventAt = Date.now();
    }
  }

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: RoomSyncListener) {
    this.listeners.add(listener);
    this.clearDisposeTimeout();
    this.ensureActive();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.scheduleDispose();
      }
    };
  }

  updateSession(session: BattleRoomSession) {
    this.roomId = session.roomId;
    this.workerSocketUrl = session.workerSocketUrl;

    const nextToken = getSessionToken(session);
    if (
      nextToken &&
      (!this.token || !this.socket || this.socket.readyState !== WebSocket.OPEN)
    ) {
      this.token = nextToken;
    }

    if (session.initialView) {
      this.applyRoomView(session.initialView);
    } else {
      this.ensureActive();
    }
  }

  setRoomView(nextView: BattleRoomView | null) {
    this.applyRoomView(nextView);
  }

  setError(nextError: string | null) {
    if (this.snapshot.error === nextError) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      error: nextError,
    };
    this.emit();
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private applyRoomView(nextView: BattleRoomView | null) {
    this.lastAuthoritativeEventAt = Date.now();
    this.snapshot = {
      ...this.snapshot,
      roomView: mergeToken(nextView, this.snapshot.roomView, this.token),
      error: null,
      hasBootstrapped: true,
    };

    this.token = this.snapshot.roomView?.token ?? this.token;
    this.ensureActive();
    this.emit();
  }

  private canUseSocket() {
    const roomPhase = this.snapshot.roomView?.room.phase ?? null;
    return Boolean(
      this.workerSocketUrl &&
        this.roomId &&
        this.token &&
        roomPhase !== "finished" &&
        roomPhase !== "cancelled",
    );
  }

  private ensureActive() {
    const roomPhase = this.snapshot.roomView?.room.phase ?? null;

    if (roomPhase === "finished" || roomPhase === "cancelled") {
      this.clearBootstrapTimeout();
      this.clearFallbackInterval();
      this.closeSocket();
      return;
    }

    this.startSocketIfNeeded();
    this.startBootstrapIfNeeded();
    this.startFallbackIntervalIfNeeded();
  }

  private startSocketIfNeeded() {
    if (!this.canUseSocket() || this.socket) {
      return;
    }

    const socketUrl = `${this.workerSocketUrl!.replace(/\/$/, "")}/ws?roomId=${encodeURIComponent(this.roomId)}&token=${encodeURIComponent(this.token!)}`;
    const socket = new WebSocket(socketUrl);
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (this.socket !== socket) {
        socket.close();
        return;
      }

      this.socketIssueUntil = 0;
      this.lastAuthoritativeEventAt = Date.now();
      this.snapshot = {
        ...this.snapshot,
        isSocketConnected: true,
        error: null,
      };
      this.emit();

      try {
        socket.send("ping");
      } catch {}

      this.clearPingInterval();
      this.pingInterval = window.setInterval(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          return;
        }

        try {
          socket.send("ping");
        } catch {}
      }, BATTLE_SOCKET_PING_MS);
    });

    socket.addEventListener("message", (event) => {
      if (this.socket !== socket) {
        return;
      }

      try {
        const payload = JSON.parse(String(event.data)) as
          | { type?: string; room?: BattleRoomView }
          | undefined;

        if (payload?.type === "room_view" && payload.room) {
          this.applyRoomView(payload.room);
          return;
        }

        if (payload?.type === "pong") {
          this.lastAuthoritativeEventAt = Date.now();
        }
      } catch {
        this.setError("Battle room sync received an invalid update.");
      }
    });

    const handleSocketEnd = () => {
      if (this.socket === socket) {
        this.socket = null;
      }

      this.clearPingInterval();
      this.socketIssueUntil = Date.now() + BATTLE_EVENT_STALE_MS;
      if (this.snapshot.isSocketConnected) {
        this.snapshot = {
          ...this.snapshot,
          isSocketConnected: false,
        };
        this.emit();
      }

      this.ensureActive();
    };

    socket.addEventListener("close", handleSocketEnd);
    socket.addEventListener("error", handleSocketEnd);
  }

  private startBootstrapIfNeeded() {
    const roomPhase = this.snapshot.roomView?.room.phase ?? null;
    if (
      this.bootstrapTimeout ||
      this.snapshot.hasBootstrapped ||
      this.snapshot.roomView ||
      !this.roomId ||
      roomPhase === "finished" ||
      roomPhase === "cancelled"
    ) {
      return;
    }

    this.bootstrapTimeout = window.setTimeout(() => {
      this.bootstrapTimeout = 0;
      if (this.snapshot.isSocketConnected || this.listeners.size === 0) {
        return;
      }

      void this.refreshRoomState();
    }, BATTLE_INITIAL_SYNC_TIMEOUT_MS);
  }

  private startFallbackIntervalIfNeeded() {
    const roomPhase = this.snapshot.roomView?.room.phase ?? null;
    if (
      this.fallbackInterval ||
      !this.roomId ||
      roomPhase === "finished" ||
      roomPhase === "cancelled"
    ) {
      return;
    }

    this.fallbackInterval = window.setInterval(() => {
      if (this.listeners.size === 0) {
        return;
      }

      const now = Date.now();
      const shouldFallbackRefresh =
        !this.canUseSocket() ||
        !this.snapshot.isSocketConnected ||
        this.socketIssueUntil > now ||
        now - this.lastAuthoritativeEventAt >= BATTLE_EVENT_STALE_MS;

      if (!shouldFallbackRefresh) {
        return;
      }

      void this.refreshRoomState();
    }, BATTLE_FALLBACK_RESYNC_MS);
  }

  private async refreshRoomState() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const result = await refreshBattleRoomAction(this.roomId);
      if (result.ok) {
        this.applyRoomView(result.data.room);
        return;
      }

      this.setError(result.message);
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = 0;
    }
  }

  private clearFallbackInterval() {
    if (this.fallbackInterval) {
      window.clearInterval(this.fallbackInterval);
      this.fallbackInterval = 0;
    }
  }

  private clearBootstrapTimeout() {
    if (this.bootstrapTimeout) {
      window.clearTimeout(this.bootstrapTimeout);
      this.bootstrapTimeout = 0;
    }
  }

  private clearDisposeTimeout() {
    if (this.disposeTimeout) {
      window.clearTimeout(this.disposeTimeout);
      this.disposeTimeout = 0;
    }
  }

  private closeSocket() {
    if (!this.socket) {
      return;
    }

    const socket = this.socket;
    this.socket = null;
    this.clearPingInterval();
    socket.close();

    if (this.snapshot.isSocketConnected) {
      this.snapshot = {
        ...this.snapshot,
        isSocketConnected: false,
      };
      this.emit();
    }
  }

  private scheduleDispose() {
    this.clearDisposeTimeout();
    this.disposeTimeout = window.setTimeout(() => {
      if (this.listeners.size > 0) {
        return;
      }

      this.dispose();
    }, BATTLE_CONNECTION_REUSE_WINDOW_MS);
  }

  private dispose() {
    this.clearDisposeTimeout();
    this.clearBootstrapTimeout();
    this.clearFallbackInterval();
    this.closeSocket();
    this.onDispose(this.storeKey);
  }
}

export type BattleRoomSyncStoreRegistry = {
  getStore: (session: BattleRoomSession) => SharedBattleRoomSync;
};

export function createBattleRoomSyncStoreRegistry(): BattleRoomSyncStoreRegistry {
  const stores = new Map<string, SharedBattleRoomSync>();

  return {
    getStore(session) {
      const storeKey = `${session.roomId}:${session.viewerUserId}`;
      const existing = stores.get(storeKey);

      if (existing) {
        existing.updateSession(session);
        return existing;
      }

      const created = new SharedBattleRoomSync(storeKey, session, (key) => {
        stores.delete(key);
      });
      stores.set(storeKey, created);
      return created;
    },
  };
}
