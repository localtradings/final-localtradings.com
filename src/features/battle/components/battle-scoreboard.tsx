import { Badge } from "@/components/ui/badge";
import { formatBattlePlayerStatus } from "@/features/battle/formatters";
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
    <div className="learn-tv-panel overflow-hidden rounded-[0.9rem]">
      <div className="grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] gap-3 border-b border-white/[0.06] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted">
        <span>Pos</span>
        <span>Player</span>
        <span>Balance</span>
        <span>Rank</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {players.map((player, index) => (
          <div
            className={cn(
              "grid grid-cols-[auto_minmax(0,1.4fr)_auto_auto] items-center gap-3 px-4 py-3 transition-colors",
              player.userId === viewerUserId ? "bg-white/[0.03]" : null,
            )}
            key={player.userId}
          >
            <div className="learn-tv-frame flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-foreground">
              {index + 1}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "truncate text-sm font-semibold text-white",
                    player.userId === viewerUserId ? "text-primary" : null,
                  )}
                >
                  {player.displayName}
                </p>
                {player.isCreator ? (
                  <Badge className="learn-tv-chip learn-tv-chip--active px-2 py-0.5 text-[9px]">
                    Host
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted">{formatBattlePlayerStatus(player.status)}</p>
            </div>
            <p className="text-sm font-semibold text-white">
              ${player.officialBalance.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </p>
            <p className="learn-tv-tabular text-sm font-semibold text-foreground">#{player.officialRank}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
