import "server-only";

import type {
  BattleFinalizePayload,
  BattlePenaltyReason,
  BattleResultEntry,
} from "@/features/battle/types";

const RESULT_PRIORITY: Record<string, number> = {
  finished: 0,
  drawdown_limit: 1,
  no_trade: 2,
  left_early: 3,
  forfeit: 4,
};

export function rankBattleEntries<T extends { finalBalance: number; status: string }>(
  entries: T[],
) {
  return [...entries]
    .sort((left, right) => {
      if (right.finalBalance !== left.finalBalance) {
        return right.finalBalance - left.finalBalance;
      }

      return RESULT_PRIORITY[left.status] - RESULT_PRIORITY[right.status];
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function getPenaltyReasonForStatus(status: string): BattlePenaltyReason | null {
  if (status === "left_early" || status === "forfeit" || status === "no_trade") {
    return status;
  }

  return null;
}

export function buildBattleResultEntries(
  payload: BattleFinalizePayload,
): BattleResultEntry[] {
  return rankBattleEntries(
    payload.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      finalBalance: player.finalBalance,
      netProfit: player.realizedPnl,
      totalTrades: player.totalTrades,
      winningTrades: player.winningTrades,
      losingTrades: player.losingTrades,
      status:
        player.status === "finished" ||
        player.status === "drawdown_limit" ||
        player.status === "left_early" ||
        player.status === "forfeit" ||
        player.status === "no_trade"
          ? player.status
          : "finished",
    })),
  );
}
