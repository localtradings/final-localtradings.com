"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useBattleRoomSyncRegistry } from "@/features/battle/components/battle-room-sync-provider";
import { type SharedBattleRoomSync } from "@/features/battle/lib/room-sync-store";
import type { BattleRoomSession, BattleRoomView } from "@/features/battle/types";

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
  const registry = useBattleRoomSyncRegistry();
  const store = useMemo<SharedBattleRoomSync>(() => registry.getStore(session), [registry, session]);

  const snapshot = useSyncExternalStore(
    useCallback((listener) => store.subscribe(listener), [store]),
    useCallback(() => store.getSnapshot(), [store]),
    useCallback(() => store.getSnapshot(), [store]),
  );

  useEffect(() => {
    store.updateSession(session);
  }, [session, store]);

  const roomView = snapshot.roomView;
  const targetRoute = getBattlePhaseRoute(roomView);

  useEffect(() => {
    if (!targetRoute || pathname === targetRoute) {
      return;
    }

    router.replace(targetRoute);
  }, [pathname, router, targetRoute]);

  const setRoomView = useCallback((nextView: BattleRoomView | null) => {
    store.setRoomView(nextView);
  }, [store]);

  const setError = useCallback((nextError: string | null) => {
    store.setError(nextError);
  }, [store]);

  return useMemo(() => ({
    roomView,
    setRoomView,
    error: snapshot.error,
    setError,
    hasBootstrapped: snapshot.hasBootstrapped,
    isSocketConnected: snapshot.isSocketConnected,
  }), [roomView, setRoomView, snapshot.error, setError, snapshot.hasBootstrapped, snapshot.isSocketConnected]);
}
