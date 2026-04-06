"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { BattleShell } from "@/features/battle/components/battle-shell";
import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { BattleRoomCode } from "@/features/battle/components/battle-room-code";
import { BattleScoreboard } from "@/features/battle/components/battle-scoreboard";
import { BattleStateCard } from "@/features/battle/components/battle-state-card";
import { formatBattleCountdown, formatBattleDuration, formatBattlePhase } from "@/features/battle/formatters";
import type { BattleRoomSession } from "@/features/battle/types";
import { useBattleLobby } from "@/features/battle/hooks/use-battle-lobby";

export function BattleLobbyClient({ session }: { session: BattleRoomSession }) {
  const { roomView, self, error, hasBootstrapped, isPending, leave, setReady } = useBattleLobby(session);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNow(Date.now());
    });
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1_000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  if (!session.workerConfigured) {
    return (
      <BattleEmptyState
        detail="Add the Cloudflare battle worker env to enable live lobbies and room coordination."
        title="Battle worker not configured"
      />
    );
  }

  if (!roomView && session.roomToken && !hasBootstrapped) {
    return (
      <BattleEmptyState
        detail="Connecting to the live battle room."
        title="Loading lobby"
      />
    );
  }

  if (!roomView) {
    return (
      <BattleEmptyState
        detail="This lobby could not be loaded. It may have expired, been cancelled, or the worker could not be reached."
        title="Lobby unavailable"
      />
    );
  }

  if (roomView.room.phase === "active") {
    return (
      <BattleEmptyState
        detail="The room is live. Moving you into the match workspace."
        title="Starting match"
      />
    );
  }

  const personalCountdown = formatBattleCountdown(
    self?.isReady ? roomView.room.countdownEndsAt : self?.readyDeadlineAt ?? roomView.room.countdownEndsAt,
    now,
  );
  const roomCountdown = formatBattleCountdown(roomView.room.countdownEndsAt, now);

  return (
    <BattleShell
      aside={
        <BattleRoomCode
          lobbyCode={roomView.room.lobbyCode}
          onCopy={async () => {
            if (!roomView.room.lobbyCode) {
              return;
            }

            await navigator.clipboard.writeText(roomView.room.lobbyCode);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1_500);
          }}
        />
      }
      description="Every player has 30 seconds to ready after joining. The room starts immediately if everyone is ready, or at the 1-minute countdown if at least two players remain ready."
      eyebrow="Battle Lobby"
      title="Ready up and lock the room"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(20rem,0.84fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <BattleStateCard label="Phase" value={formatBattlePhase(roomView.room.phase)} />
            <BattleStateCard
              detail={`${roomView.room.roomType === "public" ? "Public queue" : "Private room"} • ${roomView.room.symbol ?? "Pending symbol"} • ${roomView.room.timeframe ?? "Pending timeframe"}`}
              label="Setup"
              value={formatBattleDuration(roomView.room.durationMinutes)}
            />
            <BattleStateCard
              detail={
                self?.isReady
                  ? `You are locked in. Room countdown: ${roomCountdown}.`
                  : `Your ready timer: ${personalCountdown}. Room closes in ${roomCountdown}.`
              }
              label={self?.isReady ? "Room Countdown" : "Ready Timer"}
              value={personalCountdown}
            />
          </div>

          <section className="learn-tv-panel overflow-hidden rounded-[0.95rem]">
            <div className="grid gap-6 px-5 py-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div>
                  <p className="learn-tv-kicker">
                    Official Start Logic
                  </p>
                  <h2 className="mt-3 max-w-[12ch] text-[2rem] font-semibold tracking-[-0.05em] text-white">
                    The room starts when the field is locked.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Each new entry gets 30 seconds to confirm. If every remaining player is ready, the room launches immediately. Otherwise the one-minute lobby clock decides whether the room starts or cancels.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="learn-tv-frame rounded-[0.85rem] bg-black/20 px-4 py-4">
                    <p className="learn-tv-kicker">
                      Your Window
                    </p>
                    <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
                      {personalCountdown}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {self?.isReady
                        ? "You are already locked in. Hold position until the official start."
                        : "If this reaches zero before you ready, the room removes you automatically."}
                    </p>
                  </div>
                  <div className="learn-tv-frame rounded-[0.85rem] bg-black/20 px-4 py-4">
                    <p className="learn-tv-kicker">
                      Room Clock
                    </p>
                    <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
                      {roomCountdown}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      At least two ready players are required when the room countdown closes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="learn-tv-frame rounded-[0.9rem] bg-black/20 p-2">
                <BattleScoreboard players={roomView.room.players} viewerUserId={roomView.viewerUserId} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="learn-tv-frame rounded-[0.95rem] bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_34%),linear-gradient(180deg,rgba(16,18,22,0.98),rgba(11,12,15,0.98))] p-5">
            <p className="learn-tv-kicker">
              Your Lobby State
            </p>
            <p className="mt-3 text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
              {self?.isReady ? "Ready" : "Waiting"}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {copied
                ? "Lobby code copied."
                : error ?? "Stay in the lobby until the official room start or cancellation event arrives."}
            </p>
            <div className="mt-5 grid gap-3">
              <Button
                className="min-h-11 w-full bg-white text-black hover:bg-slate-100"
                disabled={isPending || roomView.room.phase !== "lobby"}
                onClick={() => setReady(!Boolean(self?.isReady))}
                type="button"
              >
                {self?.isReady ? "Unready" : "Ready Up"}
              </Button>
              <Button
                className="min-h-11 w-full border border-white/[0.08] bg-white/[0.04] text-white hover:bg-white/[0.08]"
                disabled={isPending}
                onClick={() => void leave()}
                type="button"
                variant="ghost"
              >
                Leave Lobby
              </Button>
            </div>
          </div>

          <div className="learn-tv-panel rounded-[0.9rem] px-4 py-4">
            <p className="learn-tv-kicker">
              Match Protocol
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <p>Only official closes move the public balance and rank.</p>
              <p>Unrealized profit stays private to each trader during the match.</p>
              <p>Leaving early or failing the match conditions can still trigger penalties.</p>
            </div>
          </div>
        </div>
      </div>
    </BattleShell>
  );
}
