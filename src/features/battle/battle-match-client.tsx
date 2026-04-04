"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { BattleShell } from "@/features/battle/components/battle-shell";
import { BattleChart } from "@/features/battle/components/battle-chart";
import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { BattleScoreboard } from "@/features/battle/components/battle-scoreboard";
import { BattleStateCard } from "@/features/battle/components/battle-state-card";
import { BattleTradePanel } from "@/features/battle/components/battle-trade-panel";
import { formatBattleDuration } from "@/features/battle/formatters";
import { useBattleMatch } from "@/features/battle/hooks/use-battle-match";
import type { BattleRoomSession } from "@/features/battle/types";

function formatTimer(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function BattleMatchClient({ session }: { session: BattleRoomSession }) {
  const router = useRouter();
  const {
    roomView,
    direction,
    volume,
    setDirection,
    setVolume,
    openTrade,
    closeTrade,
    remainingMs,
    error,
    isPending,
  } = useBattleMatch(session);

  if (!session.workerConfigured) {
    return (
      <BattleEmptyState
        detail="Configure the battle worker first. The match route is additive, but it depends on the Cloudflare room service."
        title="Battle worker not configured"
      />
    );
  }

  if (!roomView) {
    return (
      <BattleEmptyState
        detail="This match is not available. Rejoin from the lobby or return to Battle home."
        title="Match unavailable"
        action={
          <Button onClick={() => router.push("/app/battle")} type="button">
            Back to Battle
          </Button>
        }
      />
    );
  }

  return (
    <BattleShell
      description="The worker owns the official room state. Only realized balances update publicly. Your unrealized P&L and private live balance remain local to you until trade close."
      eyebrow="Battle Match"
      title={`${roomView.room.symbol ?? "Pending"} • ${roomView.room.timeframe ?? "Pending"} • ${formatBattleDuration(roomView.room.durationMinutes)}`}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.22fr)_minmax(20rem,0.78fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <BattleStateCard
              detail="Official server countdown"
              label="Time left"
              value={formatTimer(remainingMs)}
            />
            <BattleStateCard
              detail="Private live balance"
              label="Your balance"
              value={`$${roomView.self.privateBalance.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}`}
            />
            <BattleStateCard
              accentClassName={roomView.self.unrealizedPnl >= 0 ? "text-emerald-300" : "text-rose-300"}
              detail={error ?? "Public leaderboard updates only when a trade closes successfully."}
              label="Unrealized"
              value={`$${roomView.self.unrealizedPnl.toLocaleString("en-US", {
                maximumFractionDigits: 2,
              })}`}
            />
          </div>

          <section className="learn-tv-panel overflow-hidden rounded-[0.95rem]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="learn-tv-kicker">
                    Canonical Market Feed
                  </p>
                  <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
                    Public rank moves only when a trade is officially closed.
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:min-w-[20rem]">
                  <div className="learn-tv-frame rounded-[0.8rem] bg-black/20 px-4 py-3">
                    <p className="learn-tv-kicker">
                      Room phase
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {roomView.room.phase === "active" ? "Live Match" : roomView.room.phase}
                    </p>
                  </div>
                  <div className="learn-tv-frame rounded-[0.8rem] bg-black/20 px-4 py-3">
                    <p className="learn-tv-kicker">
                      Open status
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {roomView.self.openTrade ? "Position Running" : "Flat"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3">
              <BattleChart
                candles={roomView.room.candles}
                currentCandleIndex={roomView.room.currentCandleIndex}
              />
            </div>
          </section>

          <section className="learn-tv-panel overflow-hidden rounded-[0.95rem]">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <p className="learn-tv-kicker">
                Official Leaderboard
              </p>
              <h2 className="mt-3 text-[1.45rem] font-semibold tracking-[-0.04em] text-white">
                Shared standings across the room.
              </h2>
            </div>
            <div className="p-2">
              <BattleScoreboard
                players={roomView.room.players}
                viewerUserId={roomView.viewerUserId}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <BattleTradePanel
            direction={direction}
            disabled={isPending || roomView.room.phase !== "active"}
            hasOpenTrade={Boolean(roomView.self.openTrade)}
            onCloseTrade={() => void closeTrade()}
            onDirectionChange={setDirection}
            onOpenTrade={() => void openTrade()}
            onVolumeChange={setVolume}
            unrealizedPnl={roomView.self.unrealizedPnl}
            volume={volume}
          />

          <div className="learn-tv-panel rounded-[0.9rem] px-4 py-4">
            <p className="learn-tv-kicker">
              Battle Rules
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>Only one open trade is allowed per player at any time.</p>
              <p>Balance and rank become public only after an accepted close.</p>
              <p>The worker auto-closes any remaining trade when official match time ends.</p>
            </div>
          </div>
        </div>
      </div>
    </BattleShell>
  );
}
