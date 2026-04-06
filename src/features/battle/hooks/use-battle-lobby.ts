"use client";

import { useMemo, useState } from "react";

import type { BattleRoomSession } from "@/features/battle/types";
import {
  leaveBattleRoomAction,
  setBattleReadyAction,
} from "@/server/battle/actions";

import { useBattleRoomSync } from "./use-battle-room-sync";

export function useBattleLobby(session: BattleRoomSession) {
  const { roomView, setRoomView, error, setError, hasBootstrapped } = useBattleRoomSync(session);
  const [isActionPending, setIsActionPending] = useState(false);

  const self = useMemo(
    () => roomView?.room.players.find((player) => player.userId === roomView.viewerUserId) ?? null,
    [roomView],
  );

  async function setReady(ready: boolean) {
    if (!roomView || isActionPending) {
      return;
    }

    setIsActionPending(true);
    try {
      const result = await setBattleReadyAction({
        roomId: roomView.room.roomId,
        ready,
      });

      if (result.ok) {
        setRoomView(result.data.room);
        setError(null);
        return;
      }

      setError(result.message);
    } finally {
      setIsActionPending(false);
    }
  }

  async function leave() {
    if (!roomView || isActionPending) {
      return;
    }

    setIsActionPending(true);
    try {
      const result = await leaveBattleRoomAction(roomView.room.roomId);
      if (result.ok) {
        setRoomView(result.data.room);
        setError(null);
        return;
      }

      setError(result.message);
    } finally {
      setIsActionPending(false);
    }
  }

  return {
    roomView,
    self,
    error,
    hasBootstrapped,
    isPending: isActionPending,
    setReady,
    leave,
  };
}
