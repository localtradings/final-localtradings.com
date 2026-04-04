import "server-only";

import type {
  BattleFinalizePayload,
  BattlePenaltyReason,
  BattleResultEntry,
} from "@/features/battle/types";

const RESULT_PRIORITY: Record<string, number> = {
  finished: 0,
  no_trade: 1,
  left_early: 2,
  forfeit: 3,
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
        player.status === "left_early" ||
        player.status === "forfeit" ||
        player.status === "no_trade"
          ? player.status
          : "finished",
    })),
  );
}
