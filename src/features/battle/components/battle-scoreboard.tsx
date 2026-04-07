import type { BattleRoomPlayerSnapshot } from "@/features/battle/types";
import { cn } from "@/lib/utils";

function getPlayerStatusTone(player: BattleRoomPlayerSnapshot) {
  if (!player.connected || player.status === "forfeit" || player.status === "left_early") {
    return {
      label: "Disconnected",
      className: "border-rose-500/40 bg-rose-500/10 text-rose-200",
    };
  }

  if (player.status === "no_trade") {
    return {
      label: "No Trade",
      className: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    };
  }

  if (player.hasOpenTrade) {
    return {
      label: "Trade Open",
      className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    };
  }

  if (player.status === "active") {
    return {
      label: "Trading",
      className: "border-sky-400/35 bg-sky-400/10 text-sky-100",
    };
  }

  return null;
}

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
        {players.map((player, index) => {
          const statusTone = getPlayerStatusTone(player);

          return (
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
                {statusTone ? (
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em]",
                      statusTone.className,
                    )}
                  >
                    {statusTone.label}
                  </span>
                ) : null}
              </div>
              <p className="text-right font-semibold text-white">
                ${player.officialBalance.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
