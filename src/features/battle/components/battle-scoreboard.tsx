import type { BattleRoomPlayerSnapshot } from "@/features/battle/types";
import { cn } from "@/lib/utils";

export function BattleScoreboard({
  players,
  viewerUserId,
}: {
  players: BattleRoomPlayerSnapshot[];
  viewerUserId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[0.85rem] border border-white/8 bg-[#080d12]">
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_7.5rem] gap-3 border-b border-white/8 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Balance</span>
      </div>
      <div className="divide-y divide-white/6">
        {players.map((player, index) => (
          <div
            className={cn(
              "grid grid-cols-[3.25rem_minmax(0,1fr)_7.5rem] items-center gap-3 px-3 py-2 text-xs text-slate-200",
              player.userId === viewerUserId ? "bg-white/[0.04]" : null,
            )}
            key={player.userId}
          >
            <span className="font-semibold text-slate-400">#{index + 1}</span>
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate font-semibold text-white",
                  player.userId === viewerUserId ? "text-[#ffe447]" : null,
                )}
              >
                {player.displayName}
              </p>
            </div>
            <p className="text-right font-semibold text-white">
              ${player.officialBalance.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
