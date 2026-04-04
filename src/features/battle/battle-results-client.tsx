import { Badge } from "@/components/ui/badge";
import { BattleShell } from "@/features/battle/components/battle-shell";
import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { BattleStateCard } from "@/features/battle/components/battle-state-card";
import { formatBattleDuration, formatBattleResultStatus } from "@/features/battle/formatters";
import type { BattleResultRecord } from "@/features/battle/types";

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function BattleResultsClient({ result }: { result: BattleResultRecord | null }) {
  if (!result) {
    return (
      <BattleEmptyState
        detail="Results are participant-only and only exist after the worker finalizes the room."
        title="No battle result available"
      />
    );
  }

  return (
    <BattleShell
      aside={<Badge className="learn-tv-chip learn-tv-chip--active">{formatBattleDuration(result.durationMinutes)}</Badge>}
      description="Results are computed server-side from the official room state. Open trades are auto-closed at official match end before the final ranking is saved."
      eyebrow="Battle Results"
      title={`${result.symbol} • ${result.timeframe}`}
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <BattleStateCard label="Winner" value={result.winnerDisplayName ?? "Pending"} />
        <BattleStateCard label="Started" value={new Date(result.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} />
        <BattleStateCard label="Ended" value={new Date(result.endedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} />
        <BattleStateCard label="Players" value={result.entries.length} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
        <section className="learn-tv-frame overflow-hidden rounded-[0.95rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_34%),linear-gradient(180deg,rgba(16,18,22,0.98),rgba(11,12,15,0.98))] px-5 py-5">
          <p className="learn-tv-kicker">
            Final Podium
          </p>
          <h2 className="mt-3 text-[1.85rem] font-semibold tracking-[-0.05em] text-white">
            Official placements from the room authority.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            The final board below uses server-approved closes only. Unrealized movement never enters the final result unless the worker closes it at official match end.
          </p>

          <div className="mt-6 space-y-3">
            {result.entries.slice(0, 3).map((entry) => (
              <div
                className="learn-tv-frame flex items-center gap-4 rounded-[0.85rem] bg-black/20 px-4 py-4"
                key={entry.userId}
              >
                <div className="learn-tv-frame flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white">
                  #{entry.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-white">{entry.displayName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {entry.totalTrades} trades • {entry.winningTrades} wins • {entry.losingTrades} losses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-white">{formatMoney(entry.finalBalance)}</p>
                  <p className={entry.netProfit >= 0 ? "mt-1 text-sm text-emerald-300" : "mt-1 text-sm text-rose-300"}>
                    {formatMoney(entry.netProfit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="learn-tv-panel overflow-hidden rounded-[0.95rem]">
          <div className="grid grid-cols-[auto_minmax(0,1.2fr)_auto_auto] gap-3 border-b border-white/[0.06] px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted">
            <span>Rank</span>
            <span>Trader</span>
            <span>Balance</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {result.entries.map((entry) => (
              <div className="grid grid-cols-[auto_minmax(0,1.2fr)_auto_auto] items-center gap-3 px-5 py-4" key={entry.userId}>
                <div className="learn-tv-frame flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-sm font-semibold text-white">
                  #{entry.rank}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{entry.displayName}</p>
                  <p className="mt-1 text-xs text-muted">
                    {entry.totalTrades} trades • {entry.winningTrades} wins • {entry.losingTrades} losses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatMoney(entry.finalBalance)}</p>
                  <p className={entry.netProfit >= 0 ? "mt-1 text-xs text-emerald-300" : "mt-1 text-xs text-rose-300"}>
                    {formatMoney(entry.netProfit)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatBattleResultStatus(entry.status)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </BattleShell>
  );
}
