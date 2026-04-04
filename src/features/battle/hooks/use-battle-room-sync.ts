"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { BattleRoomSession, BattleRoomView } from "@/features/battle/types";
import { refreshBattleRoomAction } from "@/server/battle/actions";

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

function getBattlePhaseRoute(nextView: BattleRoomView | null) {
  if (!nextView) {
    return null;
  }

  if (nextView.room.phase === "active") {
    return `/app/battle/match/${nextView.room.roomId}`;
  }

  if (nextView.room.phase === "finished") {
    return `/app/battle/results/${nextView.room.roomId}`;
  }

  if (nextView.room.phase === "cancelled") {
    return "/app/battle";
  }

  return null;
}

export function useBattleRoomSync(session: BattleRoomSession) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingRouteRef = useRef<string | null>(null);
  const [roomView, setRoomView] = useState(session.initialView);
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  const roomId = roomView?.room.roomId ?? session.roomId;
  const token = roomView?.token ?? session.initialView?.token ?? null;
  const roomPhase = roomView?.room.phase ?? null;
  const targetRoute = getBattlePhaseRoute(roomView);
  const canUseSocket = Boolean(
    session.workerSocketUrl &&
      roomId &&
      token &&
      (!targetRoute || pathname === targetRoute) &&
      roomPhase !== "finished" &&
      roomPhase !== "cancelled",
  );

  const applyRoomView = useCallback((nextView: BattleRoomView | null) => {
    setRoomView((currentView) => mergeToken(nextView, currentView, session.initialView?.token ?? null));
  }, [session.initialView?.token]);

  useEffect(() => {
    if (!targetRoute) {
      pendingRouteRef.current = null;
      return;
    }

    if (pathname === targetRoute) {
      pendingRouteRef.current = null;
      return;
    }

    if (pendingRouteRef.current === targetRoute) {
      return;
    }

    pendingRouteRef.current = targetRoute;
    router.replace(targetRoute);
  }, [pathname, router, targetRoute]);

  useEffect(() => {
    if (!canUseSocket || !session.workerSocketUrl || !roomId || !token) {
      return;
    }

    const socketUrl = `${session.workerSocketUrl.replace(/\/$/, "")}/ws?roomId=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => {
      setIsSocketConnected(true);
      setError(null);
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as
          | { type?: string; room?: BattleRoomView }
          | undefined;
        if (payload?.type === "room_view" && payload.room) {
          applyRoomView(payload.room);
        }
      } catch {
        setError("Battle room sync received an invalid update.");
      }
    });

    socket.addEventListener("close", () => {
      setIsSocketConnected(false);
    });

    socket.addEventListener("error", () => {
      setIsSocketConnected(false);
    });

    return () => {
      setIsSocketConnected(false);
      socket.close();
    };
  }, [applyRoomView, canUseSocket, roomId, session.workerSocketUrl, token]);

  useEffect(() => {
    if (
      !roomId ||
      roomPhase === "finished" ||
      roomPhase === "cancelled" ||
      canUseSocket
    ) {
      return;
    }

    let disposed = false;
    const interval = window.setInterval(() => {
      void (async () => {
        const result = await refreshBattleRoomAction(roomId);
        if (disposed) {
          return;
        }

        if (result.ok) {
          applyRoomView(result.data.room);
          setError(null);
          return;
        }

        setError(result.message);
      })();
    }, 5_000);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [applyRoomView, canUseSocket, roomId, roomPhase]);

  return useMemo(() => ({
    roomView,
    setRoomView: applyRoomView,
    error,
    setError,
    isSocketConnected: canUseSocket && isSocketConnected,
  }), [applyRoomView, canUseSocket, error, isSocketConnected, roomView]);
}
