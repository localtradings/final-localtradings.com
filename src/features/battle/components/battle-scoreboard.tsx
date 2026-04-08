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
    <div className="overflow-hidden rounded-[0.85rem] border border-white/8 bg-[#080d12] [@media(max-height:900px)]:rounded-[0.7rem] max-[1180px]:text-[95%]">
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_6.75rem] gap-2 border-b border-white/8 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 max-[1180px]:grid-cols-[2.35rem_minmax(0,1fr)_5.65rem] max-[1180px]:gap-1.5 max-[1180px]:px-2.5 max-[1180px]:py-1.5 [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-[8px]">
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
                "grid grid-cols-[3rem_minmax(0,1fr)_6.75rem] items-center gap-2 px-3 py-2 text-xs text-slate-200 max-[1180px]:grid-cols-[2.35rem_minmax(0,1fr)_5.65rem] max-[1180px]:gap-1.5 max-[1180px]:px-2.5 max-[1180px]:py-1.5 max-[1180px]:text-[11px] [@media(max-height:900px)]:px-2.5 [@media(max-height:900px)]:py-1.5 [@media(max-height:900px)]:text-[11px]",
                player.userId === viewerUserId ? "bg-white/[0.04]" : null,
              )}
              key={player.userId}
            >
              <span className="font-semibold text-slate-400 [@media(max-height:900px)]:text-[10px]">
                #{index + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate font-semibold text-white [@media(max-height:900px)]:text-[11px]",
                    player.userId === viewerUserId ? "text-[#ffe447]" : null,
                  )}
                >
                  {player.displayName}
                </p>
                {statusTone ? (
                  <span
                    className={cn(
                      "mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] [@media(max-height:900px)]:mt-0.5 [@media(max-height:900px)]:px-1 [@media(max-height:900px)]:text-[8px]",
                      statusTone.className,
                    )}
                  >
                    {statusTone.label}
                  </span>
                ) : null}
              </div>
              <p className="text-right font-semibold text-white [@media(max-height:900px)]:text-[11px]">
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
