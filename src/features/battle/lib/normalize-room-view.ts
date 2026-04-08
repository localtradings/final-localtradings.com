import type { BattleRoomView } from "@/features/battle/types";

function getFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeBattleRoomView(
  roomView: BattleRoomView | null,
  fallbackRoomView: BattleRoomView | null = null,
): BattleRoomView | null {
  if (!roomView) {
    return roomView;
  }

  const rawSelf = roomView.self as BattleRoomView["self"] & {
    openTrade?: {
      id?: string | null;
      status?: string | null;
      direction?: "Long" | "Short" | null;
      orderType?: NonNullable<BattleRoomView["self"]["execution"]>["orderType"] | null;
      entry?: number | null;
      entryPrice?: number | null;
      stop?: number | null;
      stopLoss?: number | null;
      target?: number | null;
      takeProfit?: number | null;
      riskPercent?: number | null;
      riskAmount?: number | null;
      volume?: number | null;
      openedAtIndex?: number | null;
      openedAtTime?: number | null;
      closedAtIndex?: number | null;
      closedAtTime?: number | null;
      exitPrice?: number | null;
      resultR?: number | null;
      resultAmount?: number | null;
      balanceAfterTrade?: number | null;
    } | null;
  };
  const fallbackSelf = fallbackRoomView?.self ?? null;
  const normalizedOpenTradeStatus: NonNullable<BattleRoomView["self"]["execution"]>["status"] =
    rawSelf.openTrade?.status === "open"
      ? "active"
      : rawSelf.openTrade?.status === "armed" ||
          rawSelf.openTrade?.status === "active" ||
          rawSelf.openTrade?.status === "target_hit" ||
          rawSelf.openTrade?.status === "stop_hit" ||
          rawSelf.openTrade?.status === "manual_close" ||
          rawSelf.openTrade?.status === "unfinished" ||
          rawSelf.openTrade?.status === "breakeven"
        ? rawSelf.openTrade.status
        : "draft";
  const normalizedExecution =
    rawSelf.execution ??
    (rawSelf.openTrade
      ? {
          id: rawSelf.openTrade.id ?? "battle-open-trade",
          direction: rawSelf.openTrade.direction ?? "Long",
          status: normalizedOpenTradeStatus,
          orderType: rawSelf.openTrade.orderType ?? null,
          entry: rawSelf.openTrade.entry ?? rawSelf.openTrade.entryPrice ?? null,
          stop: rawSelf.openTrade.stop ?? rawSelf.openTrade.stopLoss ?? null,
          target: rawSelf.openTrade.target ?? rawSelf.openTrade.takeProfit ?? null,
          riskPercent: rawSelf.openTrade.riskPercent ?? null,
          riskAmount: rawSelf.openTrade.riskAmount ?? null,
          volume: rawSelf.openTrade.volume ?? null,
          openedAtIndex: rawSelf.openTrade.openedAtIndex ?? null,
          openedAtTime: rawSelf.openTrade.openedAtTime ?? null,
          closedAtIndex: rawSelf.openTrade.closedAtIndex ?? null,
          closedAtTime: rawSelf.openTrade.closedAtTime ?? null,
          exitPrice: rawSelf.openTrade.exitPrice ?? null,
          resultR: rawSelf.openTrade.resultR ?? null,
          resultAmount: rawSelf.openTrade.resultAmount ?? null,
          balanceAfterTrade: rawSelf.openTrade.balanceAfterTrade ?? null,
        }
      : null);
  const fallbackReplayIndex =
    getFiniteNumber(fallbackSelf?.replayIndex) ??
    getFiniteNumber(rawSelf.openTrade?.openedAtIndex) ??
    getFiniteNumber(roomView.room.currentCandleIndex) ??
    0;
  const normalizedReplayIndex = getFiniteNumber(rawSelf.replayIndex) ?? fallbackReplayIndex;
  const normalizedRevealedCandleCount =
    getFiniteNumber(rawSelf.revealedCandleCount) ??
    getFiniteNumber(fallbackSelf?.revealedCandleCount) ??
    (normalizedReplayIndex + 1);
  const normalizedInitialRevealCount =
    getFiniteNumber(roomView.room.initialRevealCount) ??
    getFiniteNumber(fallbackRoomView?.room.initialRevealCount) ??
    Math.max(1, normalizedRevealedCandleCount);
  const normalizedPrivateBalance =
    getFiniteNumber(rawSelf.privateBalance) ??
    getFiniteNumber(fallbackSelf?.privateBalance) ??
    100_000;
  const normalizedUnrealizedPnl =
    getFiniteNumber(rawSelf.unrealizedPnl) ??
    getFiniteNumber(fallbackSelf?.unrealizedPnl) ??
    0;
  const normalizedRealizedPnl =
    getFiniteNumber(rawSelf.realizedPnl) ??
    getFiniteNumber(fallbackSelf?.realizedPnl) ??
    0;

  return {
    ...roomView,
    room: {
      ...roomView.room,
      initialRevealCount: normalizedInitialRevealCount,
    },
    self: {
      ...roomView.self,
      activePenaltyUntil: rawSelf.activePenaltyUntil ?? fallbackSelf?.activePenaltyUntil ?? null,
      privateBalance: normalizedPrivateBalance,
      unrealizedPnl: normalizedUnrealizedPnl,
      realizedPnl: normalizedRealizedPnl,
      replayIndex: normalizedReplayIndex,
      revealedCandleCount: Math.max(1, normalizedRevealedCandleCount),
      lockReason: rawSelf.lockReason ?? fallbackSelf?.lockReason ?? null,
      hasEnteredTrade:
        rawSelf.hasEnteredTrade ??
        fallbackSelf?.hasEnteredTrade ??
        Boolean(normalizedExecution),
      participationStatus: rawSelf.participationStatus ?? fallbackSelf?.participationStatus ?? "clear",
      participationWarningIssuedAt:
        rawSelf.participationWarningIssuedAt ?? fallbackSelf?.participationWarningIssuedAt ?? null,
      participationDeadlineAt:
        rawSelf.participationDeadlineAt ?? fallbackSelf?.participationDeadlineAt ?? null,
      execution: normalizedExecution,
    },
  };
}
