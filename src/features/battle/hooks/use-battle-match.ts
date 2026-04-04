"use client";

import { useEffect, useMemo, useState } from "react";

import type { BattleRoomSession } from "@/features/battle/types";
import {
  closeBattleTradeAction,
  openBattleTradeAction,
} from "@/server/battle/actions";

import { useBattleRoomSync } from "./use-battle-room-sync";

export function useBattleMatch(session: BattleRoomSession) {
  const { roomView, setRoomView, error, setError } = useBattleRoomSync(session);
  const [direction, setDirection] = useState<"Long" | "Short">("Long");
  const [volume, setVolume] = useState("1");
  const [isActionPending, setIsActionPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => window.clearInterval(timer);
  }, []);

  const remainingMs = useMemo(() => {
    if (!roomView?.room.officialEndAt) {
      return 0;
    }

    return Math.max(0, Date.parse(roomView.room.officialEndAt) - now);
  }, [now, roomView?.room.officialEndAt]);

  async function openTrade() {
    if (!roomView || isActionPending) {
      return;
    }

    setIsActionPending(true);
    try {
      const result = await openBattleTradeAction({
        roomId: roomView.room.roomId,
        direction,
        volume: Number(volume),
      });

      if (result.ok) {
        setRoomView(result.room);
        setError(null);
        return;
      }

      setError(result.message);
    } finally {
      setIsActionPending(false);
    }
  }

  async function closeTrade() {
    if (!roomView || isActionPending || !roomView.self.openTrade?.id) {
      return;
    }

    setIsActionPending(true);
    try {
      const result = await closeBattleTradeAction({
        roomId: roomView.room.roomId,
        tradeId: roomView.self.openTrade.id,
      });

      if (result.ok) {
        setRoomView(result.room);
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
    direction,
    volume,
    setDirection,
    setVolume,
    openTrade,
    closeTrade,
    remainingMs,
    error,
    isPending: isActionPending,
  };
}
