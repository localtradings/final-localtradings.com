"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BattleShell } from "@/features/battle/components/battle-shell";
import { BattleStateCard } from "@/features/battle/components/battle-state-card";
import { formatBattleDuration, formatBattlePenalty } from "@/features/battle/formatters";
import type { BattleDurationMinutes, BattleHomeData } from "@/features/battle/types";
import { createPrivateBattleRoomAction, joinPrivateBattleRoomAction, joinRandomBattleMatchAction } from "@/server/battle/actions";

const PRO_DURATIONS: BattleDurationMinutes[] = [15, 30, 45];

export function BattleHomeClient({ data }: { data: BattleHomeData }) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<BattleDurationMinutes>(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResult(result: Awaited<ReturnType<typeof joinRandomBattleMatchAction>>) {
    if (result.ok) {
      router.push(result.redirectTo);
      return;
    }

    setFeedback(result.message);
  }

  return (
    <BattleShell
      aside={
        data.isPro ? (
          <Badge className="learn-tv-chip learn-tv-chip--active">Pro Room Creator</Badge>
        ) : (
          <Badge className="learn-tv-chip">Standard</Badge>
        )
      }
      description="Live rooms are server-authoritative, private unrealized balance stays local, and only official closes move the public ranking."
      eyebrow="Versus Battle"
      title="Battle rooms for live ranked drills"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(20rem,0.72fr)]">
        <div className="space-y-5">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="learn-tv-frame relative overflow-hidden rounded-[0.95rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_34%),linear-gradient(180deg,rgba(16,18,22,0.98),rgba(11,12,15,0.98))] px-5 py-5">
              <p className="learn-tv-kicker">
                Public Queue
              </p>
              <h2 className="mt-3 max-w-[12ch] text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
                Quick ranked match in one tap.
              </h2>
              <p className="mt-3 max-w-[30rem] text-sm leading-6 text-muted">
                Join a public room, lock in within 30 seconds, and start as soon as enough traders are ready.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <BattleStateCard
                  detail="Official balance updates only after close."
                  label="Queue"
                  value="10m public"
                />
                <BattleStateCard
                  detail="Fastest route into a live room."
                  label="Format"
                  value="2-5 traders"
                />
              </div>
              <div className="mt-5">
                <Button
                  className="min-h-11 bg-white px-5 text-black hover:bg-slate-100"
                  disabled={!data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
                  onClick={() =>
                    startTransition(async () => {
                      setFeedback(null);
                      handleResult(await joinRandomBattleMatchAction());
                    })
                  }
                  type="button"
                >
                  Join Public Match
                </Button>
              </div>
            </div>

            <div className="learn-tv-panel space-y-4 rounded-[0.95rem] px-5 py-5">
              <div>
                <p className="learn-tv-kicker">
                  Room Access
                </p>
                <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
                  Enter by private code.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Anyone can join a room by code, including Pro-created durations.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  className="min-h-11 border-white/[0.08] bg-black/20 font-mono uppercase tracking-[0.2em] text-white"
                  maxLength={12}
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  value={joinCode}
                />
                <Button
                  className="min-h-11 w-full border border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  disabled={!data.isWorkerConfigured || Boolean(data.activePenalty) || isPending || joinCode.trim().length < 4}
                  onClick={() =>
                    startTransition(async () => {
                      setFeedback(null);
                      handleResult(await joinPrivateBattleRoomAction({ lobbyCode: joinCode }));
                    })
                  }
                  type="button"
                  variant="ghost"
                >
                  Join Room
                </Button>
              </div>
            </div>
          </section>

          <section className="learn-tv-panel rounded-[0.95rem] px-5 py-5">
            <div>
              <p className="learn-tv-kicker">
                Private Creation
              </p>
              <h2 className="mt-3 text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
                Launch a room and control the duration.
              </h2>
              <p className="mt-2 max-w-[38rem] text-sm leading-6 text-muted">
                Everyone can create a 10-minute private room. Pro creators unlock the longer battle formats.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[10, 15, 30, 45].map((duration) => {
                const locked = duration !== 10 && !data.isPro;
                return (
                  <Button
                    className={
                      duration === selectedDuration
                        ? "min-h-12 border border-white/[0.12] bg-white/[0.08] text-white hover:bg-white/[0.1]"
                        : "min-h-12 border border-white/[0.08] bg-black/20 text-muted hover:bg-white/[0.04]"
                    }
                    disabled={locked || isPending}
                    key={duration}
                    onClick={() => setSelectedDuration(duration as BattleDurationMinutes)}
                    type="button"
                    variant="ghost"
                  >
                    {formatBattleDuration(duration as BattleDurationMinutes)}
                  </Button>
                );
              })}
            </div>
            {!data.isPro ? (
              <p className="mt-3 text-xs leading-5 text-muted">
                Pro unlocks {PRO_DURATIONS.map((duration) => formatBattleDuration(duration)).join(", ")} private rooms.
              </p>
            ) : null}
              <Button
                className="mt-5 min-h-11 bg-white text-black hover:bg-slate-100"
                disabled={!data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
                onClick={() =>
                  startTransition(async () => {
                    setFeedback(null);
                    handleResult(await createPrivateBattleRoomAction({ durationMinutes: selectedDuration }));
                  })
                }
                type="button"
              >
                Create Private Room
              </Button>
          </section>
        </div>

        <div className="space-y-4">
          <BattleStateCard
            accentClassName={data.activePenalty ? "text-amber-200" : "learn-tv-positive"}
            detail={formatBattlePenalty(data.activePenalty) ?? "No active cooldown. You can queue or create a room now."}
            label="Account state"
            value={data.activePenalty ? "Cooldown Active" : "Ready to Battle"}
          />
          <BattleStateCard
            detail={data.isWorkerConfigured ? "Worker env detected. Lobby and room actions are enabled." : "Add the battle worker env values before live rooms can run."}
            label="Infrastructure"
            value={data.isWorkerConfigured ? "Worker Connected" : "Setup Required"}
          />
          {feedback ? (
            <div className="learn-tv-panel rounded-[0.9rem] border-amber-200/15 bg-[rgba(191,145,44,0.08)] px-4 py-3 text-sm text-amber-100">
              {feedback}
            </div>
          ) : null}

          <section className="learn-tv-panel rounded-[0.95rem] px-5 py-5">
            <p className="learn-tv-kicker">
              Recent Finals
            </p>
            <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">
              Last official room results.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Only finalized placements are stored. Live room state stays in the worker while the match runs.
            </p>
            <div className="mt-5 space-y-3">
              {data.recentResults.length > 0 ? (
                data.recentResults.map((result) => (
                  <div className="learn-tv-frame rounded-[0.85rem] bg-black/20 px-4 py-3" key={result.roomId}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">
                        {result.symbol} • {result.timeframe}
                      </p>
                      <Badge className="learn-tv-chip">
                        {formatBattleDuration(result.durationMinutes)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      Winner: {result.winnerDisplayName ?? "Pending"} • {new Date(result.endedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted">
                  No battle history yet. The worker will persist final placements here after rooms finish.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </BattleShell>
  );
}
