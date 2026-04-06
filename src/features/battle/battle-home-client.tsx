"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  Clock3,
  Crosshair,
  KeyRound,
  ShieldPlus,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  BATTLE_MAX_PLAYERS,
  BATTLE_MIN_PLAYERS,
  BATTLE_PRIVATE_DURATION_MINUTES,
  BATTLE_PUBLIC_DURATION_MINUTES,
  BATTLE_REPLAY_BATCH_STEP_COUNT,
} from "@/features/battle/constants";
import { formatBattleDuration, formatBattlePenalty } from "@/features/battle/formatters";
import type {
  BattleDurationMinutes,
  BattleHomeActionResult,
  BattleHomeData,
  BattleResultRecord,
} from "@/features/battle/types";
import {
  createPrivateBattleRoomAction,
  joinPrivateBattleRoomAction,
  joinRandomBattleMatchAction,
} from "@/server/battle/actions";

const HERO_BUTTON_CLIP = "polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)";
const PANEL_CLIP = "polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)";
const TITLE_VISIBLE_ASPECT = 2.86;
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

type PendingAction = "public" | "code" | "private" | null;

const RESULT_ROW_TONES = [
  {
    border: "border-[#ffb84d]/28",
    glow: "bg-[#ffb84d]/18",
    medal: "from-[#ffdb7a] via-[#ffb84d] to-[#8a5312]",
    icon: "text-[#ffd46b]",
    pill: "border-[#ffb84d]/22 bg-[#25160a]/84 text-[#ffe0a2]",
  },
  {
    border: "border-[#c061ff]/28",
    glow: "bg-[#c061ff]/18",
    medal: "from-[#f0b5ff] via-[#c061ff] to-[#51206c]",
    icon: "text-[#f0b5ff]",
    pill: "border-[#b45dff]/22 bg-[#1d0d29]/84 text-[#e8c2ff]",
  },
  {
    border: "border-[#33f08a]/28",
    glow: "bg-[#33f08a]/18",
    medal: "from-[#9effc4] via-[#33f08a] to-[#0f5f3a]",
    icon: "text-[#8dffba]",
    pill: "border-[#28d67a]/22 bg-[#0c2218]/84 text-[#b5ffd7]",
  },
] as const;

export function BattleHomeClient({
  data,
}: {
  data: BattleHomeData;
}) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [joinCode, setJoinCode] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<BattleDurationMinutes>(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsHydrated(true);
    setNow(Date.now());
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  function handleResult(result: BattleHomeActionResult) {
    if (result.ok) {
      router.push(result.redirectTo);
      return;
    }

    setFeedback(result.message);
  }

  function runAction(action: PendingAction, work: () => Promise<BattleHomeActionResult>) {
    startTransition(async () => {
      setPendingAction(action);
      setFeedback(null);

      try {
        handleResult(await work());
      } finally {
        setPendingAction(null);
      }
    });
  }

  const systemNotice = feedback
    ? {
        tone: "error",
        message: feedback,
      }
    : data.activePenalty
      ? {
          tone: "warning",
          message:
            formatBattlePenalty(data.activePenalty) ??
            "This account has a temporary cooldown before it can queue again.",
        }
      : !data.isWorkerConfigured
        ? {
            tone: "info",
            message: "Battle worker env values are missing, so queue and room actions are currently disabled.",
          }
        : null;

  const recentResults = data.recentResults.slice(0, 3);

  return (
    <div className="learn-tradingview">
      <section className="relative isolate -mx-2.5 -mt-3 overflow-hidden bg-[#04070b] text-white sm:-mx-4 sm:-mt-4 lg:-ml-6 lg:-mr-3 lg:-mt-4 lg:h-[calc(100svh-2.5rem)] lg:max-h-[calc(100svh-2.5rem)]">
        <div className="pointer-events-none absolute inset-0">
          <Image
            alt=""
            className="object-cover object-center opacity-72"
            fill
            priority
            sizes="100vw"
            src="/Background%20artwork.svg"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(4,6,8,0.18)_48%,rgba(4,6,8,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,11,0.7),rgba(5,8,11,0.22)_22%,rgba(5,8,11,0.3)_58%,rgba(5,8,11,0.86)_100%)]" />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.2, 0.4, 0.22],
                    scale: [1, 1.08, 1],
                    x: [0, -24, 0],
                    y: [0, 10, 0],
                  }
            }
            className="absolute left-[-12rem] top-[5rem] h-[24rem] w-[24rem] rounded-full bg-[#00ff7b]/12 blur-[120px]"
            transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.16, 0.32, 0.18],
                    scale: [1, 1.1, 1],
                    x: [0, 20, 0],
                    y: [0, -18, 0],
                  }
            }
            className="absolute right-[-10rem] top-[-2rem] h-[22rem] w-[22rem] rounded-full bg-[#bf43ff]/14 blur-[120px]"
            transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    opacity: [0.14, 0.25, 0.16],
                    scale: [1, 1.04, 1],
                    x: [0, 18, 0],
                  }
            }
            className="absolute bottom-[-8rem] left-[18%] h-[18rem] w-[18rem] rounded-full bg-[#1e7fff]/12 blur-[120px]"
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>

        <div className="relative mx-auto flex h-full w-full max-w-[52rem] flex-col px-3 py-3 sm:px-4 sm:py-3.5 lg:px-4 lg:py-2.5 xl:max-w-[54rem]">
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mt-2.5 flex w-full flex-col items-center text-center lg:mt-2 lg:flex-none"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.05 }}
          >
            <div className="relative w-full max-w-[35rem] overflow-hidden sm:max-w-[38rem] lg:max-w-[36rem] xl:max-w-[39rem]">
              <div className="relative w-full" style={{ aspectRatio: `${TITLE_VISIBLE_ASPECT} / 1` }}>
              <Image
                alt="Battle"
                className="object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.58)] [transform:scale(1.3)]"
                fill
                priority
                sizes="(min-width: 1536px) 39rem, (min-width: 1280px) 36rem, 38rem"
                src="/new%20Hero%20title%20artwork.png"
              />
              </div>
            </div>

            <div className="relative mt-3 w-full max-w-[25rem] sm:mt-3.5 sm:max-w-[26rem] lg:mt-3 lg:max-w-[25.5rem]">
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.26, 0.62, 0.32, 0.7, 0.26],
                        scale: [0.985, 1.045, 0.995, 1.05, 0.985],
                      }
                }
                className="pointer-events-none absolute inset-x-4 bottom-1 top-1 rounded-full bg-[#26ff78]/42 blur-[42px]"
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <motion.div
                animate={
                  prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.12, 0.24, 0.16, 0.28, 0.12],
                        scale: [0.96, 1.02, 0.98, 1.04, 0.96],
                        x: [0, 4, -3, 2, 0],
                      }
                }
                className="pointer-events-none absolute -inset-x-8 -inset-y-5 rounded-[2.5rem] bg-[radial-gradient(circle_at_center,rgba(63,255,179,0.16),rgba(63,255,179,0.04)_38%,transparent_68%)] blur-[40px]"
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <button
                className="group relative isolate flex min-h-[4.15rem] w-full cursor-pointer items-center justify-center overflow-hidden px-4 py-2.5 text-left transition duration-200 hover:-translate-y-1 hover:brightness-110 active:translate-y-0 active:scale-[0.988] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#43ff97]/20 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:active:scale-100 sm:min-h-[4.45rem] sm:px-5 lg:min-h-[4.25rem] lg:px-4.5"
                disabled={!isHydrated || !data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
                onClick={() => runAction("public", () => joinRandomBattleMatchAction())}
                style={{ clipPath: HERO_BUTTON_CLIP }}
                type="button"
              >
                <span
                  className="absolute inset-0 border border-[#52ffa0] bg-[linear-gradient(180deg,rgba(16,86,44,0.98),rgba(8,39,21,1))] shadow-[inset_0_0_0_1px_rgba(198,255,223,0.18),0_24px_52px_rgba(8,255,112,0.2)]"
                  style={{ clipPath: HERO_BUTTON_CLIP }}
                />
                <span className="absolute inset-[2px] bg-[linear-gradient(180deg,rgba(24,125,65,0.98),rgba(8,54,27,1)_42%,rgba(5,31,17,1))]" style={{ clipPath: HERO_BUTTON_CLIP }} />
                <span className="absolute inset-x-[7%] top-[2px] h-[18%] rounded-full bg-[linear-gradient(180deg,rgba(210,255,230,0.2),rgba(210,255,230,0.04),transparent)] blur-[2px]" />
                <span className="absolute inset-x-[9%] bottom-[3px] h-[22%] rounded-full bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.2),rgba(0,0,0,0.42))] blur-[1px]" />
                <span className="absolute inset-[2px] border border-white/8 opacity-70" style={{ clipPath: HERO_BUTTON_CLIP }} />
                <motion.span
                  animate={
                    prefersReducedMotion
                    ? undefined
                    : {
                        opacity: [0.24, 0.62, 0.28, 0.74, 0.24],
                      }
                  }
                  className="absolute inset-[1px] rounded-[inherit] border border-[#78ffd1]/28"
                  style={{ clipPath: HERO_BUTTON_CLIP }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          opacity: [0.18, 0.44, 0.22, 0.52, 0.18],
                          background: [
                            "linear-gradient(90deg,rgba(46,244,141,0),rgba(52,255,134,0.1),rgba(46,244,141,0))",
                            "linear-gradient(90deg,rgba(64,255,207,0),rgba(64,255,207,0.34),rgba(64,255,207,0))",
                            "linear-gradient(90deg,rgba(46,244,141,0),rgba(52,255,134,0.14),rgba(46,244,141,0))",
                            "linear-gradient(90deg,rgba(113,255,198,0),rgba(113,255,198,0.4),rgba(113,255,198,0))",
                            "linear-gradient(90deg,rgba(46,244,141,0),rgba(52,255,134,0.1),rgba(46,244,141,0))",
                          ],
                        }
                  }
                  className="absolute inset-x-[12%] top-0.5 h-[2px] blur-[1px]"
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.span
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          opacity: [0.24, 0.58, 0.28, 0.68, 0.24],
                          scaleX: [0.92, 1.02, 0.95, 1.04, 0.92],
                        }
                  }
                  className="absolute inset-x-8 bottom-0 h-8 bg-[linear-gradient(90deg,rgba(70,255,180,0),rgba(70,255,180,0.38),rgba(72,255,237,0.42),rgba(70,255,180,0.38),rgba(70,255,180,0))] blur-2xl transition duration-200 group-hover:bg-[linear-gradient(90deg,rgba(70,255,180,0),rgba(70,255,180,0.44),rgba(72,255,237,0.48),rgba(70,255,180,0.44),rgba(70,255,180,0))]"
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <span className="absolute inset-x-[10%] top-[1px] h-[1px] bg-white/26" />
                <span className="absolute inset-y-[2px] left-[-20%] w-[24%] -skew-x-[24deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0))] opacity-0 blur-md transition duration-300 group-hover:left-[100%] group-hover:opacity-100" />
                <span className="absolute inset-x-[14%] bottom-[2px] h-[2px] bg-[linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,0.28),rgba(0,0,0,0))] opacity-80 blur-[1px]" />
                <span className="relative flex items-center gap-2.5 text-[#cbffd8] sm:gap-3">
                  <span className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full border border-[#89ffb3]/34 bg-[#0e1f15]/88 shadow-[0_0_24px_rgba(52,255,134,0.22)] sm:h-9 sm:w-9 lg:h-8.5 lg:w-8.5">
                    <Swords className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </span>
                  <span className="font-heading text-[1rem] font-extrabold uppercase tracking-[0.06em] text-[#d6ffe3] sm:text-[1.18rem] lg:text-[1.12rem]">
                    {pendingAction === "public" ? "Joining Match..." : "Join Public Match"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#b9ffd0] transition duration-200 group-hover:translate-x-0.5" />
                </span>
              </button>
            </div>

            <div className="mt-3 h-px w-full max-w-[24rem] bg-[linear-gradient(90deg,transparent,rgba(92,255,154,0.24),rgba(103,198,255,0.09),transparent)] sm:mt-3.5" />

            <div className="mt-2 grid w-full max-w-[23rem] grid-cols-1 gap-1.5 sm:grid-cols-3 lg:mt-2 lg:max-w-[23rem]">
              <ArenaPill
                icon={Clock3}
                label={`${formatBattleDuration(BATTLE_PUBLIC_DURATION_MINUTES[0])} Match`}
                tone="green"
              />
              <ArenaPill
                icon={Users}
                label={`${BATTLE_MIN_PLAYERS} - ${BATTLE_MAX_PLAYERS} Traders`}
                tone="amber"
              />
              <ArenaPill
                icon={Crosshair}
                label={`Fixed ${BATTLE_REPLAY_BATCH_STEP_COUNT}x Replay`}
                tone="blue"
              />
            </div>
          </motion.div>

          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mt-3.5 grid w-full gap-2 lg:mt-3.5 lg:flex-none lg:grid-cols-2"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
          >
            <form
              className="group relative overflow-hidden p-px opacity-90 transition duration-200 hover:-translate-y-0.5 hover:opacity-100"
              onSubmit={(event) => {
                event.preventDefault();
                if (joinCode.trim().length < 4) {
                  return;
                }

                runAction("code", () => joinPrivateBattleRoomAction({ lobbyCode: joinCode }));
              }}
              style={{ clipPath: PANEL_CLIP }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(217,109,255,0.9),rgba(110,29,255,0.3)_42%,rgba(130,35,215,0.9))]" />
              <div className="pointer-events-none absolute inset-x-14 bottom-0 h-14 bg-[#b34dff]/20 blur-3xl" />
              <div
                className="relative h-full bg-[linear-gradient(180deg,rgba(31,10,45,0.93),rgba(15,9,24,0.9))] px-3.5 py-2.75 sm:px-4 lg:px-3.5 lg:py-2.25"
                style={{ clipPath: PANEL_CLIP }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[0.75rem] border border-[#d16dff]/22 bg-[linear-gradient(180deg,rgba(93,28,138,0.68),rgba(41,13,61,0.88))] shadow-[0_0_18px_rgba(197,74,255,0.12)] lg:h-8 lg:w-8">
                    <KeyRound className="h-3.5 w-3.5 text-[#eca7ff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#d8a7ff]">Join by Code</p>
                    <h2 className="mt-1 text-[0.82rem] font-semibold tracking-[-0.03em] text-white lg:text-[0.8rem]">
                      Enter Room Code
                    </h2>
                    <p className="mt-1 text-[0.62rem] leading-4 text-white/52 lg:text-[0.61rem]">
                      Jump straight into a private room when a host sends you the code.
                    </p>
                  </div>
                </div>

                <div className="mt-2.25 flex flex-col gap-1.5 sm:flex-row lg:mt-2">
                  <input
                    aria-label="Room code"
                    className="min-h-8.5 flex-1 rounded-[0.75rem] border border-white/10 bg-black/26 px-3 text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-white outline-none transition placeholder:text-white/28 focus:border-[#d67eff]/55 focus:ring-4 focus:ring-[#b34dff]/12"
                    maxLength={12}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    value={joinCode}
                  />
                  <button
                    className="inline-flex min-h-8.5 items-center justify-center gap-1.5 rounded-[0.75rem] border border-[#db86ff]/30 bg-[linear-gradient(180deg,rgba(149,52,211,0.84),rgba(88,29,141,0.9))] px-3.5 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-white transition hover:border-[#efb7ff]/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[7.25rem]"
                    disabled={!isHydrated || !data.isWorkerConfigured || Boolean(data.activePenalty) || isPending || joinCode.trim().length < 4}
                    type="submit"
                  >
                    {pendingAction === "code" ? "Joining..." : "Join Room"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            <form
              className="group relative overflow-hidden p-px opacity-90 transition duration-200 hover:-translate-y-0.5 hover:opacity-100"
              onSubmit={(event) => {
                event.preventDefault();
                runAction("private", () => createPrivateBattleRoomAction({ durationMinutes: selectedDuration }));
              }}
              style={{ clipPath: PANEL_CLIP }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(58,146,255,0.8),rgba(30,70,196,0.3)_42%,rgba(68,173,255,0.84))]" />
              <div className="pointer-events-none absolute inset-x-14 bottom-0 h-14 bg-[#2a9dff]/16 blur-3xl" />
              <div
                className="relative h-full bg-[linear-gradient(180deg,rgba(8,25,50,0.93),rgba(8,15,26,0.92))] px-3.5 py-2.75 sm:px-4 lg:px-3.5 lg:py-2.25"
                style={{ clipPath: PANEL_CLIP }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[0.75rem] border border-[#6fc6ff]/22 bg-[linear-gradient(180deg,rgba(17,74,152,0.7),rgba(8,32,76,0.88))] shadow-[0_0_18px_rgba(53,147,255,0.12)] lg:h-8 lg:w-8">
                    <ShieldPlus className="h-3.5 w-3.5 text-[#8ed5ff]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#7bc9ff]">Create Private Room</p>
                    <h2 className="mt-1 text-[0.82rem] font-semibold tracking-[-0.03em] text-white lg:text-[0.8rem]">
                      Set Up a Private Battle
                    </h2>
                    <p className="mt-1 text-[0.62rem] leading-4 text-white/52 lg:text-[0.61rem]">
                      Host a room for friends and choose the duration you want to run.
                    </p>
                  </div>
                </div>

                <div className="mt-2.25 flex flex-col gap-1.5 sm:flex-row lg:mt-2">
                  <div className="relative flex-1">
                    <select
                      aria-label="Private room duration"
                      className="min-h-8.5 w-full appearance-none rounded-[0.75rem] border border-white/10 bg-black/24 px-3 pr-9 text-[0.74rem] font-semibold text-white outline-none transition focus:border-[#67c6ff]/55 focus:ring-4 focus:ring-[#3195ff]/12"
                      disabled={isPending}
                      onChange={(event) => setSelectedDuration(Number(event.target.value) as BattleDurationMinutes)}
                      value={selectedDuration}
                    >
                      {BATTLE_PRIVATE_DURATION_MINUTES.map((duration) => {
                        const locked = duration !== 10 && !data.isPro;

                        return (
                          <option disabled={locked} key={duration} value={duration}>
                            {formatBattleDuration(duration)}
                            {locked ? "  •  Pro only" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-white/45" />
                  </div>
                  <button
                    aria-label="Create Private Room"
                    className="inline-flex min-h-8.5 items-center justify-center gap-1.5 rounded-[0.75rem] border border-[#65c6ff]/28 bg-[linear-gradient(180deg,rgba(18,111,205,0.84),rgba(7,61,128,0.9))] px-3.5 text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#eff8ff] transition hover:border-[#9fdcff]/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[7.5rem]"
                    disabled={!isHydrated || !data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
                    type="submit"
                  >
                    {pendingAction === "private" ? "Creating..." : "Create Room"}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            </form>
          </motion.div>

          {systemNotice ? (
            <motion.div
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              className={cn(
                "mt-2 w-full rounded-[0.9rem] border px-3.5 py-2 text-[0.72rem] backdrop-blur-sm",
                systemNotice.tone === "error" && "border-[#ff7d7d]/28 bg-[#2a0f14]/76 text-[#ffd0d0]",
                systemNotice.tone === "warning" && "border-[#f0c46b]/24 bg-[#271a0e]/76 text-[#ffe2ae]",
                systemNotice.tone === "info" && "border-[#5caeff]/24 bg-[#0d1d2f]/76 text-[#c3e2ff]",
              )}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {systemNotice.message}
            </motion.div>
          ) : null}

          <motion.section
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mt-2 w-full overflow-hidden rounded-[1rem] border border-white/8 bg-[linear-gradient(180deg,rgba(8,11,16,0.88),rgba(5,7,10,0.84))] shadow-[0_16px_32px_rgba(0,0,0,0.26)] backdrop-blur-sm lg:mt-2"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.16 }}
          >
            <div className="relative px-3.5 py-2.25 sm:px-4 lg:px-4 lg:py-2">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,184,77,0.06),transparent_24%),radial-gradient(circle_at_top_right,rgba(61,169,255,0.05),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]" />
              <div className="relative flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="grid h-7.5 w-7.5 place-items-center rounded-full border border-[#ffcc6f]/22 bg-[#1b1408]/82 text-[#ffcf73] shadow-[0_0_18px_rgba(255,191,93,0.12)]">
                      <Trophy className="h-3.25 w-3.25" />
                    </span>
                    <div className="flex items-center gap-3">
                      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[#f8d38a]">
                        Recent Results
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white/42">
                  {recentResults.length > 0
                    ? `Last ${recentResults.length} Battle${recentResults.length === 1 ? "" : "s"}`
                    : "No Battles Yet"}
                </p>
              </div>

              {recentResults.length > 0 ? (
                <div className="relative mt-2 overflow-hidden rounded-[0.9rem] border border-white/7 bg-black/18 lg:mt-1.75">
                  <div className="hidden grid-cols-[1.85fr_0.95fr_0.75fr_0.75fr_1fr_auto] gap-3 border-b border-white/8 px-3.5 py-1.25 text-[0.52rem] font-semibold uppercase tracking-[0.14em] text-white/40 md:grid">
                    <p>Winner</p>
                    <p>Symbol</p>
                    <p>Timeframe</p>
                    <p>Duration</p>
                    <p>Ended</p>
                    <span />
                  </div>

                  <div className="divide-y divide-white/8">
                    {recentResults.map((result, index) => {
                      const tone = RESULT_ROW_TONES[index % RESULT_ROW_TONES.length];

                      return (
                        <RecentResultRow
                          endedLabel={formatEndedLabel(result.endedAt, now)}
                          key={result.roomId}
                          result={result}
                          tone={tone}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative mt-2 rounded-[0.9rem] border border-dashed border-white/10 bg-black/16 px-4 py-2.75 text-center">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-white/64">
                    No official battles yet
                  </p>
                  <p className="mt-1 text-[0.68rem] leading-5 text-white/48">
                    Finish a room and the final standings will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}

function ArenaPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  tone: "green" | "amber" | "blue";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.25 py-1.35 text-[0.62rem] font-semibold uppercase tracking-[0.06em] backdrop-blur-xl lg:px-2.25 lg:py-1.15 lg:text-[0.6rem]",
        tone === "green" && "border-[#2ef48d]/22 bg-[#0a1911]/84 text-[#a5ffc7]",
        tone === "amber" && "border-[#ffb84d]/20 bg-[#191208]/84 text-[#ffe0a3]",
        tone === "blue" && "border-[#49acff]/20 bg-[#09141f]/84 text-[#bde2ff]",
      )}
    >
      <Icon className="h-3.25 w-3.25 lg:h-3 lg:w-3" />
      {label}
    </div>
  );
}

function RecentResultRow({
  result,
  tone,
  endedLabel,
}: {
  result: BattleResultRecord;
  tone: (typeof RESULT_ROW_TONES)[number];
  endedLabel: string;
}) {
  const winnerName =
    result.winnerDisplayName ??
    result.entries.find((entry) => entry.rank === 1)?.displayName ??
    "Pending";
  const endedAtLabel = new Date(result.endedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      className={cn(
        "group relative block px-3.5 py-2.25 transition hover:bg-white/[0.02] md:px-3.5 lg:px-3 lg:py-1.9",
        tone.border,
      )}
      href={`/app/battle/results/${result.roomId}`}
    >
      <div className={cn("pointer-events-none absolute inset-y-2 left-2 w-px rounded-full blur-sm md:left-3", tone.glow)} />
      <div className="grid gap-2.5 md:grid-cols-[1.85fr_0.95fr_0.75fr_0.75fr_1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2.25">
            <span
              className={cn(
                "grid h-7.5 w-7.5 shrink-0 place-items-center rounded-full bg-gradient-to-br shadow-[0_0_18px_rgba(255,255,255,0.08)] lg:h-7 lg:w-7",
                tone.medal,
              )}
            >
              <Trophy className={cn("h-3.25 w-3.25 lg:h-3.25 lg:w-3.25", tone.icon)} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-white/44">
                Winner
              </p>
              <p className="truncate text-[0.78rem] font-semibold text-white lg:text-[0.75rem]">{winnerName}</p>
            </div>
          </div>
        </div>

        <div className="md:justify-self-start">
          <p className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Symbol
          </p>
          <span className={cn("mt-1 inline-flex rounded-full border px-2.25 py-0.65 text-[0.66rem] font-semibold md:mt-0 lg:px-2 lg:text-[0.64rem]", tone.pill)}>
            {result.symbol}
          </span>
        </div>

        <div>
          <p className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Timeframe
          </p>
          <p className="mt-1 text-[0.7rem] font-semibold text-white md:mt-0 lg:text-[0.68rem]">{result.timeframe}</p>
        </div>

        <div>
          <p className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Duration
          </p>
          <p className="mt-1 text-[0.7rem] font-semibold text-white md:mt-0 lg:text-[0.68rem]">
            {formatBattleDuration(result.durationMinutes)}
          </p>
        </div>

        <div>
          <p className="text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Ended
          </p>
          <p className="mt-1 text-[0.7rem] font-semibold text-white md:mt-0 lg:text-[0.68rem]">{endedLabel}</p>
          <p className="text-[0.58rem] text-white/46 lg:text-[0.58rem]">{endedAtLabel}</p>
        </div>

        <div className="hidden justify-self-end text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white/72 md:block">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function formatEndedLabel(endedAt: string, now: number | null) {
  if (now === null) {
    return "Recent finish";
  }

  const diffMinutes = Math.round((Date.parse(endedAt) - now) / 60_000);
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, "day");
}
