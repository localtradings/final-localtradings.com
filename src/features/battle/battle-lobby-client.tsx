"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChartCandlestick,
  Check,
  CircleDollarSign,
  Clock3,
  Flag,
  Info,
  LogOut,
  Plus,
  ShieldPlus,
  User,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";

import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { formatBattleCountdown, formatBattleDuration } from "@/features/battle/formatters";
import { useBattleLobby } from "@/features/battle/hooks/use-battle-lobby";
import type {
  BattleRoomPlayerSnapshot,
  BattleRoomSession,
} from "@/features/battle/types";
import { cn } from "@/lib/utils";

const PANEL_CLIP = "polygon(2.4% 0%,97.6% 0%,100% 10%,100% 90%,97.6% 100%,2.4% 100%,0% 90%,0% 10%)";
const TILE_CLIP = "polygon(6% 0%,94% 0%,100% 9%,100% 91%,94% 100%,6% 100%,0% 91%,0% 9%)";

export function BattleLobbyClient({ session }: { session: BattleRoomSession }) {
  const { roomView, self, error, hasBootstrapped, isPending, leave, setReady } = useBattleLobby(session);
  const prefersReducedMotion = useReducedMotion();
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

  const heroTimerLabel = self?.isReady ? "Room Countdown" : "Ready Timer";
  const heroTimerValue = formatBattleCountdown(
    self?.isReady ? roomView.room.countdownEndsAt : self?.readyDeadlineAt ?? roomView.room.countdownEndsAt,
    now,
  );
  const roomCountdown = formatBattleCountdown(roomView.room.countdownEndsAt, now);
  const symbolValue = roomView.room.symbol ?? "Pending";
  const timeframeValue = formatLobbyTimeframe(roomView.room.timeframe);
  const durationValue = `${formatBattleDuration(roomView.room.durationMinutes)} Match`;
  const filledSlots = roomView.room.players.slice(0, roomView.room.maxPlayers);
  const emptySlots = Math.max(0, roomView.room.maxPlayers - filledSlots.length);
  const viewerStateLabel = getViewerStateLabel(self);
  const viewerStateMessage = error ?? getViewerStateMessage(self, heroTimerValue, roomCountdown);
  const rules = [
    {
      icon: Clock3,
      label: "Each player has 30s to ready after joining the lobby",
    },
    {
      icon: ShieldPlus,
      label:
        typeof roomView.room.riskLimitPercent === "number"
          ? `Risk cap: ${roomView.room.riskLimitPercent.toFixed(2)}% max per trade`
          : "Flexible per-trade risk is allowed in this room",
    },
    {
      icon: Flag,
      label:
        typeof roomView.room.maxDrawdownPercent === "number"
          ? `Drawdown: ${roomView.room.maxDrawdownPercent.toFixed(2)}% max realized loss`
          : "At least 2 ready players are required when the lobby timer ends",
    },
    {
      icon: Zap,
      label:
        roomView.room.roomType === "public" || roomView.room.roomType === "open"
          ? "Symbol and timeframe stay hidden until match start"
          : "Private rooms reveal the market only when the match begins",
    },
  ];

  return (
    <div className="learn-tradingview">
      <section className="relative isolate -mx-2.5 -mt-3 overflow-hidden bg-[#030608] text-white sm:-mx-4 sm:-mt-4 lg:-ml-6 lg:-mr-3 lg:-mt-4 lg:h-[calc(100svh-2.5rem)] lg:max-h-[calc(100svh-2.5rem)]">
        <div className="pointer-events-none absolute inset-0">
          <Image
            alt=""
            className="object-cover object-center opacity-78"
            fill
            priority
            sizes="100vw"
            src="/lobby%20background.png"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_16%,rgba(3,6,8,0.2)_45%,rgba(3,6,8,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,9,0.74),rgba(4,7,9,0.18)_24%,rgba(4,7,9,0.34)_58%,rgba(4,7,9,0.9)_100%)]" />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { opacity: [0.18, 0.34, 0.2], scale: [1, 1.08, 1], x: [0, -22, 0], y: [0, 12, 0] }
            }
            className="absolute left-[-12rem] top-[6rem] h-[24rem] w-[24rem] rounded-full bg-[#11ff7d]/12 blur-[110px]"
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { opacity: [0.12, 0.26, 0.14], scale: [1, 1.06, 1], x: [0, 18, 0], y: [0, -14, 0] }
            }
            className="absolute right-[-8rem] top-[2rem] h-[20rem] w-[20rem] rounded-full bg-[#15f996]/10 blur-[110px]"
            transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="relative mx-auto flex h-full w-full max-w-[61rem] flex-col px-3 py-3 sm:px-4 sm:py-3.5 lg:px-4 lg:py-1.5 xl:max-w-[61rem]">
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mx-auto flex w-full max-w-[36rem] flex-none flex-col items-center text-center lg:max-w-[36rem]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.04 }}
          >
            <p className="text-[0.74rem] font-bold uppercase tracking-[0.24em] text-[#18ff9c] sm:text-[0.82rem]">
              Battle Lobby
            </p>
            <h1 className="mt-1 max-w-[14.8ch] bg-[linear-gradient(180deg,#ffffff_0%,#edf2f5_34%,#cbd3da_68%,#8f9aa6_100%)] bg-clip-text font-heading text-[1.8rem] font-black uppercase italic leading-[0.9] tracking-[-0.07em] text-transparent drop-shadow-[0_14px_22px_rgba(0,0,0,0.4)] sm:text-[2.35rem] lg:max-w-[14.4ch] lg:text-[2.7rem] xl:text-[2.8rem]">
              Lock In Before The Match Starts
            </h1>
            <div className="mt-2 grid w-full max-w-[25rem] grid-cols-1 gap-1.5 sm:grid-cols-3 lg:mt-2.25 lg:max-w-[25.75rem] lg:gap-1.75">
              <LobbyHeroMetaTile
                icon={CircleDollarSign}
                label="Symbol"
                value={symbolValue}
              />
              <LobbyHeroMetaTile
                icon={ChartCandlestick}
                label="Timeframe"
                value={timeframeValue}
              />
              <LobbyHeroMetaTile
                icon={Clock3}
                label="Duration"
                value={durationValue}
              />
            </div>

            <div className="relative mt-2.25 w-full max-w-[16rem] sm:mt-2.5 sm:max-w-[17rem] lg:mt-2.5 lg:w-[17rem] lg:max-w-none xl:w-[17.25rem]">
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.18, 0.34, 0.2],
                        scale: [0.985, 1.03, 0.985],
                      }
                }
                className="absolute inset-x-8 inset-y-2 rounded-full bg-[#18ff9c]/18 blur-[30px]"
                transition={{ duration: 1.7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="relative overflow-hidden p-px" style={{ clipPath: TILE_CLIP }}>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(20,255,151,0.84),rgba(5,89,48,0.28)_40%,rgba(17,255,154,0.72))]" />
                <div
                  className="relative bg-[linear-gradient(180deg,rgba(10,31,20,0.96),rgba(4,16,11,0.95))] px-4 py-2.5 sm:px-4.25 sm:py-2.75 lg:px-4 lg:py-2.75"
                  style={{ clipPath: TILE_CLIP }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_18%,transparent_82%,rgba(0,0,0,0.2))]" />
                  <div className="relative text-center">
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-[#19ff9d] lg:text-[0.82rem]">
                      {heroTimerLabel}
                    </p>
                    <p className="mt-0.75 font-mono text-[2.35rem] font-black leading-none tracking-[-0.1em] text-[#17ff95] sm:text-[2.75rem] lg:text-[3.05rem]">
                      {heroTimerValue}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mx-auto mt-2 grid min-h-0 w-full max-w-[61rem] flex-none grid-cols-1 gap-1.75 lg:mt-2.25 lg:max-w-[61rem] lg:grid-cols-[minmax(0,1fr)_14rem]"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <section
              className="relative min-h-0 overflow-hidden p-px"
              style={{ clipPath: PANEL_CLIP }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(21,255,153,0.74),rgba(5,76,42,0.18)_42%,rgba(17,255,154,0.56))]" />
              <div
                className="relative h-full bg-[linear-gradient(180deg,rgba(7,11,13,0.94),rgba(4,7,9,0.94))] px-3 py-2 sm:px-3.25 lg:px-3.25 lg:py-2"
                style={{ clipPath: PANEL_CLIP }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-2">
                  <div className="flex items-center gap-2 text-[#20ff9d]">
                    <Users className="h-4 w-4" />
                    <p className="text-[0.8rem] font-bold uppercase tracking-[0.12em]">
                      Players In Room
                    </p>
                  </div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-white/72">
                    {filledSlots.length} / {roomView.room.maxPlayers} Players
                  </p>
                </div>

                <div className="mt-2 grid gap-1.75 sm:grid-cols-2 lg:grid-cols-5">
                  {filledSlots.map((player, index) => (
                    <PlayerLobbyCard
                      key={player.userId}
                      now={now}
                      player={player}
                      position={index + 1}
                      roomType={roomView.room.roomType}
                      viewerUserId={roomView.viewerUserId}
                    />
                  ))}

                  {Array.from({ length: emptySlots }).map((_, index) => (
                    <EmptyLobbySlot key={`empty-${index}`} />
                  ))}
                </div>
              </div>
            </section>

            <aside className="relative overflow-hidden p-px lg:min-h-0">
              <div className="pointer-events-none absolute inset-0" style={{ clipPath: PANEL_CLIP }}>
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,255,153,0.62),rgba(5,76,42,0.16)_44%,rgba(17,255,154,0.44))]" />
              </div>
              <div
                className="relative z-10 h-full bg-[linear-gradient(180deg,rgba(9,13,12,0.95),rgba(5,8,8,0.95))] px-2.75 py-2.25 lg:px-2.75 lg:py-2.25"
                style={{ clipPath: PANEL_CLIP }}
              >
                <div className="border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2 text-[#20ff9d]">
                    <User className="h-4 w-4" />
                    <p className="text-[0.8rem] font-bold uppercase tracking-[0.12em]">
                      Your Lobby State
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-[0.72rem] text-white/58">Status</p>
                  <p
                    className={cn(
                      "mt-0.5 text-[1.55rem] font-semibold tracking-[-0.05em]",
                      self?.connected === false
                        ? "text-[#ff7b7b]"
                        : self?.isReady
                          ? "text-[#19ff9d]"
                          : "text-[#19ff9d]",
                    )}
                  >
                    {viewerStateLabel}
                  </p>
                  <p className={cn("mt-0.75 text-[0.72rem] leading-4.5", error ? "text-[#ffc3c3]" : "text-white/70")}>
                    {viewerStateMessage}
                  </p>
                </div>

                <div className="mt-2.5 grid gap-1.75">
                  <button
                    className="group relative z-10 isolate inline-flex min-h-[2.5rem] w-full items-center justify-center gap-2 overflow-hidden rounded-[0.85rem] border border-[#4dffab]/45 bg-[linear-gradient(180deg,rgba(24,255,124,0.98),rgba(7,173,82,0.96))] px-3 text-[0.86rem] font-bold text-[#03110a] shadow-[0_12px_24px_rgba(13,255,121,0.16)] transition duration-200 hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={isPending || roomView.room.phase !== "lobby"}
                    onClick={() => void setReady(!Boolean(self?.isReady))}
                    type="button"
                  >
                    <span className="pointer-events-none absolute inset-x-8 top-[2px] h-[1px] bg-white/35" />
                    <span className="pointer-events-none absolute inset-y-[2px] left-[-22%] w-[24%] -skew-x-[24deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0))] opacity-0 blur-md transition duration-300 group-hover:left-[104%] group-hover:opacity-100" />
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-black/18 text-[#022a16]">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {self?.isReady ? "Unready" : "Ready Up"}
                  </button>

                  <button
                    className="relative z-10 inline-flex min-h-[2.45rem] w-full items-center justify-center gap-2 rounded-[0.85rem] border border-[#18ff9d]/24 bg-black/16 px-3 text-[0.84rem] font-semibold text-white transition duration-200 hover:border-[#18ff9d]/38 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => void leave()}
                    type="button"
                  >
                    <LogOut className="h-4 w-4 text-white/72" />
                    Leave Lobby
                  </button>
                </div>

                <div className="mt-2 flex items-start gap-2 rounded-[0.85rem] border border-[#18ff9d]/12 bg-black/14 px-2.75 py-1.75">
                  <Info className="mt-0.5 h-3.75 w-3.75 shrink-0 text-[#18ff9d]" />
                  <p className="text-[0.66rem] leading-4 text-white/68">
                    If your timer expires before you ready, you are removed automatically.
                  </p>
                </div>
              </div>
            </aside>
          </motion.div>

          <motion.section
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mx-auto mt-1.5 w-full max-w-[61rem] flex-none overflow-hidden p-px"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            style={{ clipPath: PANEL_CLIP }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(21,255,153,0.56),rgba(5,76,42,0.12)_44%,rgba(17,255,154,0.4))]" />
            <div
              className="relative bg-[linear-gradient(180deg,rgba(7,11,13,0.94),rgba(4,7,9,0.94))] px-3 py-1.75"
              style={{ clipPath: PANEL_CLIP }}
            >
              <div className="grid gap-1.75 lg:grid-cols-[10.75rem_repeat(4,minmax(0,1fr))] lg:items-center">
                <div className="flex items-center gap-2 border-b border-white/8 pb-1.25 lg:border-b-0 lg:border-r lg:border-white/8 lg:pb-0 lg:pr-2.75">
                  <Flag className="h-4 w-4 text-[#19ff9d]" />
                  <p className="text-[0.84rem] font-semibold uppercase tracking-[0.04em] text-white">
                    Match Start Rules
                  </p>
                </div>
                {rules.map((rule) => {
                  const Icon = rule.icon;
                  return (
                    <div
                      className="flex items-center gap-1.75 border-b border-white/8 pb-1.25 last:border-b-0 last:pb-0 lg:border-b-0 lg:border-l lg:border-white/8 lg:pb-0 lg:pl-2.75"
                      key={rule.label}
                    >
                      <Icon className="h-3.75 w-3.75 shrink-0 text-[#19ff9d]" />
                      <p className="text-[0.7rem] leading-4.25 text-white/76">{rule.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}

function formatLobbyTimeframe(timeframe: string | null) {
  if (!timeframe) {
    return "Pending";
  }

  return timeframe
    .replace("min", "m")
    .replace("day", "d");
}

function LobbyHeroMetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="relative overflow-hidden p-px" style={{ clipPath: TILE_CLIP }}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(19,255,150,0.8),rgba(4,84,48,0.22)_42%,rgba(17,255,154,0.66))]" />
      <div className="absolute inset-x-6 bottom-0 h-8 bg-[#18ff9c]/10 blur-2xl" />
      <div
        className="relative flex min-h-[3.65rem] items-center gap-2 bg-[linear-gradient(180deg,rgba(7,20,14,0.96),rgba(4,12,9,0.95))] px-3 py-2"
        style={{ clipPath: TILE_CLIP }}
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#18ff9d]/55 bg-black/26 text-[#1dff9a] shadow-[0_0_20px_rgba(24,255,156,0.12)]">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#19ff9d]">
            {label}
          </p>
          <p className="mt-0.35 truncate text-[0.94rem] font-semibold tracking-[-0.04em] text-white sm:text-[0.98rem]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function PlayerLobbyCard({
  player,
  position,
  viewerUserId,
  roomType,
  now,
}: {
  player: BattleRoomPlayerSnapshot;
  position: number;
  viewerUserId: string;
  roomType: "public" | "private" | "open";
  now: number | null;
}) {
  const state = getPlayerDisplayState(player);

  return (
    <div
      className="relative overflow-hidden p-px"
      style={{ clipPath: TILE_CLIP }}
    >
      <div
        className={cn(
          "absolute inset-0",
          player.userId === viewerUserId
            ? "bg-[linear-gradient(135deg,rgba(24,255,157,0.78),rgba(5,76,42,0.22)_42%,rgba(17,255,154,0.62))]"
            : "bg-[linear-gradient(135deg,rgba(132,255,198,0.42),rgba(255,255,255,0.06)_42%,rgba(132,255,198,0.28))]",
        )}
      />
      <div
        className="relative min-h-[11.7rem] bg-[linear-gradient(180deg,rgba(10,14,18,0.96),rgba(5,8,10,0.96))] px-2.75 py-2.5"
        style={{ clipPath: TILE_CLIP }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.25">
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-full border bg-black/28 text-[1.2rem] font-semibold uppercase tracking-[-0.04em]",
                state.ringClassName,
              )}
            >
              {getInitials(player.displayName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.88rem] font-semibold tracking-[-0.03em] text-white">
                {player.displayName}
              </p>
              <div className="mt-1.25 flex flex-wrap items-center gap-1.25">
                <span className={cn("inline-flex rounded-full px-1.75 py-0.65 text-[0.52rem] font-bold uppercase tracking-[0.06em]", state.chipClassName)}>
                  {state.label}
                </span>
                {(roomType === "private" || roomType === "open") && player.isCreator ? (
                  <span className="inline-flex rounded-full border border-white/14 bg-white/[0.05] px-1.75 py-0.55 text-[0.5rem] font-bold uppercase tracking-[0.08em] text-white/72">
                    Host
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {player.connected === false ? (
            <WifiOff className="mt-0.25 h-4 w-4 shrink-0 text-[#ff7272]" />
          ) : null}
        </div>

        <div className="mt-4.5 space-y-2.25">
          <div className="h-px w-full bg-white/10" />
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/40">Position</p>
            <p className="mt-0.75 text-[1.28rem] font-semibold tracking-[-0.05em] text-white">#{position}</p>
          </div>
          <div className="h-px w-full bg-white/10" />
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/40">Joined</p>
            <p className="mt-0.75 text-[0.84rem] font-medium text-white/82">
              {formatJoinedElapsed(player.joinedAt, now)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyLobbySlot() {
  return (
    <div
      className="relative overflow-hidden border border-dashed border-white/16 bg-black/12 px-2.75 py-2.5"
      style={{ clipPath: TILE_CLIP }}
    >
      <div className="flex h-full min-h-[11.7rem] flex-col items-center justify-center text-center">
        <div className="grid h-10 w-10 place-items-center rounded-full border border-white/14 bg-white/[0.03] text-white/52">
          <Plus className="h-4.5 w-4.5" />
        </div>
        <p className="mt-3 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/52">
          Waiting
        </p>
        <p className="mt-0.75 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/52">
          For Player
        </p>
      </div>
    </div>
  );
}

function getInitials(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "??";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatJoinedElapsed(joinedAt: string, now: number | null) {
  if (now === null) {
    return "--:-- ago";
  }

  const diffMs = Math.max(0, now - Date.parse(joinedAt));
  const totalSeconds = Math.floor(diffMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")} ago`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ago`;
}

function getPlayerDisplayState(player: BattleRoomPlayerSnapshot) {
  if (!player.connected || player.status === "left_lobby" || player.status === "left_early") {
    return {
      label: "Disconnected",
      chipClassName: "border border-[#ff7b7b]/22 bg-[#311111]/86 text-[#ffb6b6]",
      ringClassName: "border-[#8b98a7] text-[#d3dbe7]",
    };
  }

  if (player.status === "removed_unready") {
    return {
      label: "Removed",
      chipClassName: "border border-[#ffcf6f]/22 bg-[#2b1d08]/86 text-[#ffe1a8]",
      ringClassName: "border-[#ffcf6f] text-[#ffe1a8]",
    };
  }

  if (player.isReady || player.status === "ready") {
    return {
      label: "Ready",
      chipClassName: "border border-[#24ff9d]/22 bg-[#07251a]/86 text-[#a8ffce]",
      ringClassName: "border-[#19ff9d] text-[#19ff9d]",
    };
  }

  return {
    label: "Not Ready",
    chipClassName: "border border-white/12 bg-white/[0.04] text-white/72",
    ringClassName: "border-[#b766ff] text-[#b766ff]",
  };
}

function getViewerStateLabel(self: BattleRoomPlayerSnapshot | null) {
  if (!self) {
    return "Waiting";
  }

  if (!self.connected) {
    return "Disconnected";
  }

  return self.isReady ? "Ready" : "Waiting";
}

function getViewerStateMessage(
  self: BattleRoomPlayerSnapshot | null,
  heroTimerValue: string,
  roomCountdown: string,
) {
  if (!self) {
    return "Stay in the lobby until the official room start or cancellation event arrives.";
  }

  if (!self.connected) {
    return "Reconnect before the room starts or you may be removed from the field.";
  }

  if (self.isReady) {
    return `You are locked in. Room countdown: ${roomCountdown}.`;
  }

  return `Ready before ${heroTimerValue} expires.`;
}
