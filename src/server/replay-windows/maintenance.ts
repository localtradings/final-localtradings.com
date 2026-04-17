import "server-only";

import { getReplayWindowSelections, generateReplayWindowForSelection, REPLAY_WINDOW_READY_STOCK_CAP, REPLAY_WINDOW_READY_STOCK_REPLENISH_THRESHOLD, REPLAY_WINDOW_READY_STOCK_TARGET } from "@/server/replay-windows/generator";

import {
  deleteReplayWindowIds,
  deleteReplayWindowsOlderThan,
  getReadyReplayWindowCount,
  listReplayWindowIdsExceedingCap,
} from "./store";

const REPLAY_WINDOW_READY_RETENTION_DAYS = 90;
const REPLAY_WINDOW_STALE_RETENTION_DAYS = 7;
const REPLAY_WINDOW_MAINTENANCE_GENERATION_LIMIT = 12;

export type ReplayWindowMaintenanceSummary = {
  generatedWindows: number;
  readyWindowsDeleted: number;
  staleWindowsDeleted: number;
  cappedWindowsDeleted: number;
  executedAt: string;
};

function daysAgo(now: Date, days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export async function runReplayWindowMaintenance(now = new Date()): Promise<ReplayWindowMaintenanceSummary> {
  let generatedWindows = 0;
  let cappedWindowsDeleted = 0;
  const selections = getReplayWindowSelections();

  for (const selection of selections) {
    if (generatedWindows >= REPLAY_WINDOW_MAINTENANCE_GENERATION_LIMIT) {
      break;
    }

    const readyCount = await getReadyReplayWindowCount(selection);
    if (readyCount < REPLAY_WINDOW_READY_STOCK_REPLENISH_THRESHOLD) {
      const missingCount = Math.min(
        REPLAY_WINDOW_READY_STOCK_TARGET - readyCount,
        REPLAY_WINDOW_MAINTENANCE_GENERATION_LIMIT - generatedWindows,
      );

      for (let index = 0; index < missingCount; index += 1) {
        const generated = await generateReplayWindowForSelection(selection).catch(() => null);
        if (generated) {
          generatedWindows += 1;
        }
      }
    }

    const cappedIds = await listReplayWindowIdsExceedingCap(
      selection,
      REPLAY_WINDOW_READY_STOCK_CAP,
    );
    cappedWindowsDeleted += await deleteReplayWindowIds(cappedIds);
  }

  const expiredWindows = await deleteReplayWindowsOlderThan({
    readyBeforeIso: daysAgo(now, REPLAY_WINDOW_READY_RETENTION_DAYS),
    badBeforeIso: daysAgo(now, REPLAY_WINDOW_STALE_RETENTION_DAYS),
  });

  return {
    generatedWindows,
    readyWindowsDeleted: expiredWindows.readyDeleted,
    staleWindowsDeleted: expiredWindows.badDeleted,
    cappedWindowsDeleted,
    executedAt: now.toISOString(),
  };
}
