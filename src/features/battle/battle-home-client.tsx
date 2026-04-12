"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  KeyRound,
  ShieldPlus,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import {
  BATTLE_MAX_PLAYERS,
  BATTLE_MIN_PLAYERS,
  BATTLE_OPEN_ROOM_DURATION_MINUTES,
  BATTLE_OPEN_ROOM_MAX_DRAWDOWN_PERCENT,
  BATTLE_OPEN_ROOM_PLAYER_OPTIONS,
  BATTLE_OPEN_ROOM_RISK_LIMIT_PERCENT,
  BATTLE_PRIVATE_DURATION_MINUTES,
  BATTLE_PRIVATE_ROOM_PLAYER_OPTIONS,
  BATTLE_PUBLIC_DURATION_MINUTES,
  BATTLE_PUBLIC_MAX_DRAWDOWN_PERCENT,
  BATTLE_PUBLIC_RISK_LIMIT_PERCENT,
  BATTLE_RECENT_RESULTS_LIMIT,
} from "@/features/battle/constants";
import { formatBattleDuration, formatBattlePenalty } from "@/features/battle/formatters";
import type {
  BattleDurationMinutes,
  BattleHomeActionResult,
  BattleHomeData,
  BattleOpenRoomListing,
  BattleResultRecord,
} from "@/features/battle/types";
import {
  createOpenBattleRoomAction,
  createPrivateBattleRoomAction,
  joinOpenBattleRoomAction,
  joinPrivateBattleRoomAction,
  joinRandomBattleMatchAction,
} from "@/server/battle/actions";

const HERO_BUTTON_CLIP = "polygon(0 12px,12px 0,calc(100% - 16px) 0,100% 16px,100% calc(100% - 12px),calc(100% - 12px) 100%,16px 100%,0 calc(100% - 16px))";
const BEVELED_PANEL_CLIP = "polygon(0 16px,16px 0,calc(100% - 18px) 0,100% 18px,100% calc(100% - 16px),calc(100% - 16px) 100%,18px 100%,0 calc(100% - 18px))";
const ANGLED_CYBER_CLIP = "polygon(0 22px,22px 0,calc(100% - 54px) 0,calc(100% - 34px) 12px,calc(100% - 14px) 12px,100% 28px,100% calc(100% - 24px),calc(100% - 26px) 100%,18px 100%,0 calc(100% - 20px),0 22px)";
const TITLE_VISIBLE_ASPECT = 2.86;
const relativeTimeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
const recentResultDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const recentResultTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

type PendingAction = "public" | "code" | "private" | "open-create" | "open-join" | null;
type HostVisibility = "private" | "open";

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

function panelStyle(clipPath: string) {
  return { clipPath };
}

export function BattleHomeClient({ data }: { data: BattleHomeData }) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [openRooms, setOpenRooms] = useState(data.openRooms);
  const [joinCode, setJoinCode] = useState("");
  const [hostVisibility, setHostVisibility] = useState<HostVisibility>("private");
  const [selectedDuration, setSelectedDuration] = useState<BattleDurationMinutes>(10);
  const [selectedPrivateMaxPlayers, setSelectedPrivateMaxPlayers] = useState<number>(5);
  const [selectedOpenDuration, setSelectedOpenDuration] = useState<BattleDurationMinutes>(15);
  const [selectedOpenMaxPlayers, setSelectedOpenMaxPlayers] = useState<number>(4);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [popupNotice, setPopupNotice] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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

  useEffect(() => {
    if (!popupNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPopupNotice(null);
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [popupNotice]);

  useEffect(() => {
    setOpenRooms(data.openRooms);
  }, [data.openRooms]);

  useEffect(() => {
    let cancelled = false;

    async function refreshOpenRooms() {
      try {
        const response = await fetch("/api/battle/open-rooms", {
          cache: "no-store",
          credentials: "same-origin",
        });

        const payload = (await response.json().catch(() => null)) as
          | { ok: true; openRooms: BattleOpenRoomListing[] }
          | { ok: false }
          | null;

        if (!cancelled && response.ok && payload?.ok && Array.isArray(payload.openRooms)) {
          setOpenRooms(payload.openRooms);
        }
      } catch {
        // Keep the last successful open-room snapshot when refresh fails.
      }
    }

    void refreshOpenRooms();
    const intervalId = window.setInterval(() => {
      void refreshOpenRooms();
    }, 7_500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isHistoryOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsHistoryOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistoryOpen]);

  function handleResult(result: BattleHomeActionResult) {
    if (result.ok) {
      router.push(result.redirectTo);
      return;
    }

    if (result.reason === "pro_required") {
      setPopupNotice(result.message);
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

  const hostPendingAction = hostVisibility === "open" ? "open-create" : "private";
  const hostDuration = hostVisibility === "open" ? selectedOpenDuration : selectedDuration;
  const hostPlayerCap = hostVisibility === "open" ? selectedOpenMaxPlayers : selectedPrivateMaxPlayers;
  const recentResults = data.recentResults.slice(0, BATTLE_RECENT_RESULTS_LIMIT);
  const hostRulesLabel =
    hostVisibility === "open"
      ? `${BATTLE_OPEN_ROOM_RISK_LIMIT_PERCENT}% risk · ${BATTLE_OPEN_ROOM_MAX_DRAWDOWN_PERCENT}% DD`
      : `${hostPlayerCap} players max · share the room code`;

  const hostAction = useMemo(
    () =>
      hostVisibility === "open"
        ? () =>
            createOpenBattleRoomAction({
              durationMinutes: selectedOpenDuration,
              maxPlayers: selectedOpenMaxPlayers,
            })
        : () =>
            createPrivateBattleRoomAction({
              durationMinutes: selectedDuration,
              maxPlayers: selectedPrivateMaxPlayers,
            }),
    [hostVisibility, selectedDuration, selectedPrivateMaxPlayers, selectedOpenDuration, selectedOpenMaxPlayers],
  );

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
        </div>

        <div className="relative mx-auto grid h-full w-full min-h-0 max-w-[58rem] grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-1.25 px-2.5 py-1.5 sm:px-3 sm:py-2 lg:px-3 lg:py-1.25 xl:max-w-[60rem] [@media(max-height:820px)]:gap-1 [@media(max-height:820px)]:py-1">
          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="mt-4 flex w-full flex-col items-center text-center sm:mt-5 lg:mt-6 [@media(max-height:820px)]:mt-3"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.05 }}
          >
            <div className="relative w-full max-w-[36rem] overflow-hidden sm:max-w-[39rem] lg:max-w-[41rem] xl:max-w-[43rem] [@media(max-height:820px)]:max-w-[33rem]">
              <div className="relative w-full" style={{ aspectRatio: `${TITLE_VISIBLE_ASPECT} / 1` }}>
                <Image
                  alt="Battle"
                  className="object-contain drop-shadow-[0_24px_42px_rgba(0,0,0,0.56)] [transform:scale(1.52)]"
                  fill
                  priority
                  sizes="(min-width: 1536px) 43rem, (min-width: 1280px) 41rem, 39rem"
                  src="/new%20Hero%20title%20artwork.png"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="w-full"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.08 }}
          >
            <div
              className="relative mx-auto w-full max-w-[34rem] overflow-hidden p-[1.5px] shadow-[0_18px_36px_rgba(0,0,0,0.34)]"
              style={panelStyle(ANGLED_CYBER_CLIP)}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(72,255,173,0.92),rgba(10,95,54,0.34)_30%,rgba(28,170,116,0.3)_58%,rgba(22,210,117,0.88))]"
                style={panelStyle(ANGLED_CYBER_CLIP)}
              />
              <div
                className="pointer-events-none absolute inset-[1px] bg-[linear-gradient(180deg,rgba(8,28,18,0.98),rgba(5,15,10,0.99))]"
                style={panelStyle(ANGLED_CYBER_CLIP)}
              />
              <div
                className="pointer-events-none absolute inset-[8px] border border-[#78ffc2]/18 opacity-80"
                style={panelStyle(ANGLED_CYBER_CLIP)}
              />
              <div
                className="pointer-events-none absolute inset-[16px] border border-white/5 opacity-70"
                style={panelStyle(BEVELED_PANEL_CLIP)}
              />
              <span className="pointer-events-none absolute left-3 top-2.5 h-px w-20 bg-[linear-gradient(90deg,rgba(179,255,220,0.86),rgba(179,255,220,0))]" />
              <span className="pointer-events-none absolute right-6 top-2.5 h-[6px] w-14 bg-[linear-gradient(90deg,rgba(72,255,173,0.08),rgba(72,255,173,0.72),rgba(121,255,224,0.86))]" style={panelStyle("polygon(0 0,76% 0,100% 100%,24% 100%)")} />
              <span className="pointer-events-none absolute right-3.5 top-[0.95rem] h-[6px] w-5 bg-[linear-gradient(90deg,rgba(75,255,171,0.3),rgba(161,255,214,0.86))]" style={panelStyle("polygon(0 0,76% 0,100% 100%,24% 100%)")} />
              <span className="pointer-events-none absolute bottom-3 left-3 h-px w-16 bg-[linear-gradient(90deg,rgba(107,255,201,0),rgba(107,255,201,0.82),rgba(107,255,201,0))]" />
              <div className="relative bg-[linear-gradient(180deg,rgba(7,24,17,0.94),rgba(5,14,10,0.98))] px-2.5 py-2 backdrop-blur-md sm:px-3 lg:px-3 lg:py-2 [@media(max-height:820px)]:py-1.5" style={panelStyle(ANGLED_CYBER_CLIP)}>
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(105,255,184,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(92,255,210,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)]"
                  style={panelStyle(ANGLED_CYBER_CLIP)}
                />
                <div className="relative flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between [@media(max-height:820px)]:gap-1">
                  <div className="min-w-0">
                    <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[#9fffd0]">
                      Fixed Public Match
                    </p>
                    <p className="mt-0.5 text-[0.82rem] font-semibold tracking-[-0.03em] text-white sm:text-[0.88rem] [@media(max-height:820px)]:text-[0.8rem]">
                      Queue into the default battle ladder
                    </p>
                    <p className="mt-0.5 max-w-[19rem] text-[0.58rem] leading-4 text-white/58 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
                      No setup friction. No market preview. Just a synchronized competitive run with fixed risk rules and a live ranking race.
                    </p>
                  </div>
                  <button
                    className="group relative isolate inline-flex min-h-[2.6rem] shrink-0 items-center justify-center overflow-hidden px-3 py-1.5 transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.988] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#43ff97]/20 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:brightness-100 disabled:active:scale-100 sm:px-3.5"
                    disabled={!isHydrated || !data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
                    onClick={() => runAction("public", () => joinRandomBattleMatchAction())}
                    style={{ clipPath: HERO_BUTTON_CLIP }}
                    type="button"
                  >
                    <span
                      className="absolute inset-0 border border-[#52ffa0] bg-[linear-gradient(180deg,rgba(16,86,44,0.98),rgba(8,39,21,1))] shadow-[inset_0_0_0_1px_rgba(198,255,223,0.18),0_24px_52px_rgba(8,255,112,0.2)]"
                      style={{ clipPath: HERO_BUTTON_CLIP }}
                    />
                    <span
                      className="battle-public-cta-glow pointer-events-none absolute inset-x-[8%] bottom-[-0.2rem] h-[1.35rem] bg-[radial-gradient(circle_at_center,rgba(98,255,174,0.65),rgba(98,255,174,0.18)_45%,transparent_72%)] opacity-40 blur-xl"
                      style={{ clipPath: HERO_BUTTON_CLIP }}
                    />
                    <span
                      className="absolute inset-[2px] bg-[linear-gradient(180deg,rgba(24,125,65,0.98),rgba(8,54,27,1)_44%,rgba(5,31,17,1))]"
                      style={{ clipPath: HERO_BUTTON_CLIP }}
                    />
                    <span className="absolute right-1.5 top-1.5 h-[5px] w-4 bg-[linear-gradient(90deg,rgba(173,255,214,0.12),rgba(173,255,214,0.86))]" style={panelStyle("polygon(0 0,78% 0,100% 100%,22% 100%)")} />
                    <span className="relative flex items-center gap-2 text-[#cbffd8]">
                      <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-full border border-[#89ffb3]/34 bg-[#0e1f15]/88 shadow-[0_0_20px_rgba(52,255,134,0.22)]">
                        <Swords className="h-3 w-3" />
                      </span>
                      <span className="font-heading text-[0.72rem] font-extrabold uppercase tracking-[0.06em] text-[#d6ffe3] sm:text-[0.78rem]">
                        {pendingAction === "public" ? "Joining..." : "Join Public Match"}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-[#b9ffd0] transition duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </button>
                </div>

                <div className="relative mt-1 grid grid-cols-2 gap-1 text-left sm:grid-cols-4">
                  <PublicRuleChip label="Players" value={`${BATTLE_MIN_PLAYERS}-${BATTLE_MAX_PLAYERS}`} />
                  <PublicRuleChip label="Duration" value={formatBattleDuration(BATTLE_PUBLIC_DURATION_MINUTES[0])} />
                  <PublicRuleChip label="Risk Cap" value={`${BATTLE_PUBLIC_RISK_LIMIT_PERCENT}% Max`} />
                  <PublicRuleChip label="Drawdown" value={`${BATTLE_PUBLIC_MAX_DRAWDOWN_PERCENT}% Max`} />
                </div>
              </div>
            </div>
          </motion.div>

          {systemNotice ? (
            <motion.div
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              className={cn(
                "w-full rounded-[0.9rem] border px-3 py-1.5 text-[0.66rem] backdrop-blur-sm",
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

          <motion.div
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            className="grid min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] gap-1.25 [@media(max-height:820px)]:gap-1"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
          >
            <div className="grid gap-1.25 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [@media(max-height:820px)]:gap-1">
              <JoinByCodeCard
                isHydrated={isHydrated}
                isJoining={pendingAction === "code" && isPending}
                joinCode={joinCode}
                onJoin={() => runAction("code", () => joinPrivateBattleRoomAction({ lobbyCode: joinCode }))}
                onJoinCodeChange={setJoinCode}
                workerDisabled={!data.isWorkerConfigured || Boolean(data.activePenalty)}
              />

              <HostRoomCard
                duration={hostDuration}
                hostRulesLabel={hostRulesLabel}
                isHydrated={isHydrated}
                isPending={isPending}
                isSubmitting={pendingAction === hostPendingAction && isPending}
                isPro={data.isPro}
                onDurationChange={(value) => {
                  if (hostVisibility === "open") {
                    setSelectedOpenDuration(value);
                    return;
                  }

                  setSelectedDuration(value);
                }}
                onHost={() => runAction(hostPendingAction, hostAction)}
                onPlayerCapChange={(value) => {
                  if (hostVisibility === "open") {
                    setSelectedOpenMaxPlayers(value);
                    return;
                  }

                  setSelectedPrivateMaxPlayers(value);
                }}
                onVisibilityChange={setHostVisibility}
                playerCap={hostPlayerCap}
                visibility={hostVisibility}
                workerDisabled={!data.isWorkerConfigured || Boolean(data.activePenalty)}
              />
            </div>

            <OpenRoomsPanel
              disabled={!isHydrated || !data.isWorkerConfigured || Boolean(data.activePenalty) || isPending}
              onJoin={(roomId) => runAction("open-join", () => joinOpenBattleRoomAction({ roomId }))}
              openRooms={openRooms}
            />
          </motion.div>

          <div className="absolute right-2.5 top-2.5 z-30 flex max-w-[16rem] flex-col items-end gap-1.5 sm:right-3 sm:top-3">
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[#ffcf73]/18 bg-[linear-gradient(180deg,rgba(20,17,11,0.94),rgba(10,10,8,0.92))] px-2.5 py-1.25 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#f6d48e] shadow-[0_10px_22px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-[#ffd998]/32 hover:text-[#ffe0a6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffcf73]/12"
              onClick={() => setIsHistoryOpen(true)}
              type="button"
            >
              <Trophy className="h-3 w-3" />
              Recent Results
            </button>

            {popupNotice ? (
              <motion.div
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                className="pointer-events-none max-w-[16rem] rounded-[0.95rem] border border-[#70ffee]/26 bg-[linear-gradient(180deg,rgba(8,25,25,0.95),rgba(5,15,18,0.94))] px-3 py-2.5 text-[0.66rem] text-[#d7fff1] shadow-[0_16px_34px_rgba(0,0,0,0.34)] backdrop-blur-xl"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <p className="text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-[#97fff0]">Open Rooms</p>
                <p className="mt-1 leading-5">{popupNotice}</p>
              </motion.div>
            ) : null}
          </div>
        </div>

        <RecentResultsDrawer
          isOpen={isHistoryOpen}
          now={now}
          onClose={() => setIsHistoryOpen(false)}
          results={recentResults}
        />
      </section>
    </div>
  );
}

function JoinByCodeCard({
  joinCode,
  onJoinCodeChange,
  onJoin,
  isHydrated,
  workerDisabled,
  isJoining,
}: {
  joinCode: string;
  onJoinCodeChange: (value: string) => void;
  onJoin: () => void;
  isHydrated: boolean;
  workerDisabled: boolean;
  isJoining: boolean;
}) {
  return (
    <form
      className="group relative overflow-hidden p-px opacity-95 transition duration-200 hover:-translate-y-0.5 hover:opacity-100"
      onSubmit={(event) => {
        event.preventDefault();
        if (joinCode.trim().length < 4) {
          return;
        }

        onJoin();
      }}
      style={panelStyle(BEVELED_PANEL_CLIP)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(217,109,255,0.9),rgba(110,29,255,0.3)_42%,rgba(130,35,215,0.9))]" />
      <div className="pointer-events-none absolute inset-[1px] border border-white/8 opacity-70" style={panelStyle(BEVELED_PANEL_CLIP)} />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(239,183,255,0.48),transparent)]" />
      <div className="pointer-events-none absolute inset-y-4 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(239,183,255,0.36),transparent)]" />
      <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(239,183,255,0.36),transparent)]" />
      <div className="relative z-10 h-full bg-[linear-gradient(180deg,rgba(31,10,45,0.93),rgba(15,9,24,0.9))] px-2.25 py-1.9 sm:px-2.5 lg:px-2.5 lg:py-2 [@media(max-height:820px)]:py-1.5" style={panelStyle(BEVELED_PANEL_CLIP)}>
        <div className="flex items-start gap-1.75">
          <div className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-[0.68rem] border border-[#d16dff]/22 bg-[linear-gradient(180deg,rgba(93,28,138,0.68),rgba(41,13,61,0.88))] shadow-[0_0_16px_rgba(197,74,255,0.12)]">
            <KeyRound className="h-3.25 w-3.25 text-[#eca7ff]" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[#d8a7ff]">Join Private Room</p>
            <h2 className="mt-0.5 text-[0.76rem] font-semibold tracking-[-0.03em] text-white">
              Enter a room code
            </h2>
            <p className="mt-0.35 text-[0.56rem] leading-4 text-white/54 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
              Use this for hidden rooms only. Discoverable rooms are joined from the list below.
            </p>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap gap-1 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
          <MiniRuleBadge label="Access" value="Code Invite" />
          <MiniRuleBadge label="Mode" value="Private Lobby" />
        </div>

        <div className="mt-1.25 flex flex-col gap-1 sm:flex-row">
          <input
            aria-label="Room code"
            className="relative z-10 min-h-8 flex-1 rounded-[0.72rem] border border-white/10 bg-black/26 px-2.75 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white outline-none transition placeholder:text-white/28 focus:border-[#d67eff]/55 focus:ring-4 focus:ring-[#b34dff]/12"
            maxLength={12}
            onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            value={joinCode}
          />
          <button
            className="relative z-10 inline-flex min-h-8 items-center justify-center gap-1 overflow-hidden border border-[#db86ff]/30 bg-[linear-gradient(180deg,rgba(149,52,211,0.84),rgba(88,29,141,0.9))] px-2.75 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-white transition hover:border-[#efb7ff]/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[6rem]"
            disabled={!isHydrated || workerDisabled || isJoining || joinCode.trim().length < 4}
            style={panelStyle(HERO_BUTTON_CLIP)}
            type="submit"
          >
            {isJoining ? "Joining..." : "Join Room"}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
}

function HostRoomCard({
  visibility,
  duration,
  playerCap,
  isPro,
  isHydrated,
  workerDisabled,
  isPending,
  isSubmitting,
  hostRulesLabel,
  onVisibilityChange,
  onDurationChange,
  onPlayerCapChange,
  onHost,
}: {
  visibility: HostVisibility;
  duration: BattleDurationMinutes;
  playerCap: number;
  isPro: boolean;
  isHydrated: boolean;
  workerDisabled: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  hostRulesLabel: string;
  onVisibilityChange: (value: HostVisibility) => void;
  onDurationChange: (value: BattleDurationMinutes) => void;
  onPlayerCapChange: (value: number) => void;
  onHost: () => void;
}) {
  return (
    <form
      className="group relative overflow-hidden p-px opacity-95 transition duration-200 hover:-translate-y-0.5 hover:opacity-100"
      onSubmit={(event) => {
        event.preventDefault();
        onHost();
      }}
      style={panelStyle(BEVELED_PANEL_CLIP)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(72,255,173,0.86),rgba(10,95,54,0.28)_42%,rgba(22,210,117,0.82))]" />
      <div className="pointer-events-none absolute inset-[1px] border border-white/8 opacity-70" style={panelStyle(BEVELED_PANEL_CLIP)} />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(169,255,244,0.48),transparent)]" />
      <div className="pointer-events-none absolute inset-y-4 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(169,255,244,0.36),transparent)]" />
      <div className="pointer-events-none absolute inset-y-4 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(169,255,244,0.36),transparent)]" />
      <div className="relative z-10 h-full bg-[linear-gradient(180deg,rgba(6,24,24,0.93),rgba(4,12,18,0.92))] px-2.25 py-1.9 sm:px-2.5 lg:px-2.5 lg:py-2 [@media(max-height:820px)]:py-1.5" style={panelStyle(BEVELED_PANEL_CLIP)}>
        <div className="flex items-start gap-1.75">
          <div className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-[0.68rem] border border-[#68ffc1]/22 bg-[linear-gradient(180deg,rgba(16,115,70,0.72),rgba(7,48,30,0.88))] shadow-[0_0_16px_rgba(52,255,148,0.12)]">
            <ShieldPlus className="h-3.25 w-3.25 text-[#b7ffda]" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[#9fffd0]">Host Room</p>
            <h2 className="mt-0.5 text-[0.76rem] font-semibold tracking-[-0.03em] text-white">
              Create one room, choose its visibility
            </h2>
            <p className="mt-0.35 text-[0.56rem] leading-4 text-white/54 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
              Open rooms go to the discoverable list. Private rooms stay hidden and use a code.
            </p>
          </div>
        </div>

        <div className="mt-1.25 grid gap-1 sm:grid-cols-3">
          <label className="sm:col-span-1">
            <span className="mb-0.75 block text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-white/42">
              Visibility
            </span>
            <div className="relative">
              <select
                aria-label="Host room visibility"
                className="relative z-10 min-h-8 w-full appearance-none rounded-[0.72rem] border border-white/10 bg-black/24 px-2.75 pr-8 text-[0.64rem] font-semibold text-white outline-none transition focus:border-[#67ffe9]/55 focus:ring-4 focus:ring-[#31ffc8]/12"
                disabled={isPending}
                onChange={(event) => onVisibilityChange(event.target.value as HostVisibility)}
                value={visibility}
              >
                <option value="private">Private</option>
                <option value="open">Open</option>
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-white/45" />
            </div>
          </label>

          <label className="sm:col-span-1">
            <span className="mb-0.75 block text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-white/42">
              Duration
            </span>
            <div className="relative">
              <select
                aria-label="Host room duration"
                className="relative z-10 min-h-8 w-full appearance-none rounded-[0.72rem] border border-white/10 bg-black/24 px-2.75 pr-8 text-[0.64rem] font-semibold text-white outline-none transition focus:border-[#67ffe9]/55 focus:ring-4 focus:ring-[#31ffc8]/12"
                disabled={isPending}
                onChange={(event) => onDurationChange(Number(event.target.value) as BattleDurationMinutes)}
                value={duration}
              >
                {(visibility === "open" ? BATTLE_OPEN_ROOM_DURATION_MINUTES : BATTLE_PRIVATE_DURATION_MINUTES).map((value) => {
                  const locked = visibility === "private" && value !== 10 && !isPro;
                  return (
                    <option disabled={locked} key={value} value={value}>
                      {formatBattleDuration(value)}
                      {locked ? "  •  Pro only" : ""}
                    </option>
                  );
                })}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-white/45" />
            </div>
          </label>

          <label className="sm:col-span-1">
            <span className="mb-0.75 block text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-white/42">
              Players
            </span>
            <div className="relative">
              <select
                aria-label="Host room player cap"
                className="relative z-10 min-h-8 w-full appearance-none rounded-[0.72rem] border border-white/10 bg-black/24 px-2.75 pr-8 text-[0.64rem] font-semibold text-white outline-none transition focus:border-[#67ffe9]/55 focus:ring-4 focus:ring-[#31ffc8]/12"
                disabled={isPending}
                onChange={(event) => onPlayerCapChange(Number(event.target.value))}
                value={playerCap}
              >
                {(visibility === "open" ? BATTLE_OPEN_ROOM_PLAYER_OPTIONS : BATTLE_PRIVATE_ROOM_PLAYER_OPTIONS).map(
                  (count) => (
                    <option key={count} value={count}>
                      {count} players
                    </option>
                  ),
                )}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-white/45" />
            </div>
          </label>
        </div>

        <div className="mt-1 grid grid-cols-2 gap-1 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
          <MiniRuleBadge label={visibility === "open" ? "Room Mode" : "Joining"} value={visibility === "open" ? "Discoverable" : "Code Only"} />
          <MiniRuleBadge label="Rules" value={hostRulesLabel} />
        </div>

        <button
          aria-label="Host Room"
          className="relative z-10 mt-1.25 inline-flex min-h-8 w-full items-center justify-center gap-1 overflow-hidden border border-[#70ffee]/28 bg-[linear-gradient(180deg,rgba(18,169,150,0.84),rgba(7,83,110,0.9))] px-3 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[#efffff] transition hover:border-[#a9fff4]/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isHydrated || workerDisabled || isPending}
          style={panelStyle(HERO_BUTTON_CLIP)}
          type="submit"
        >
          {isSubmitting ? "Hosting..." : "Host Room"}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {!isPro && visibility === "open" ? (
          <p className="mt-1.25 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-white/38 max-[1180px]:hidden [@media(max-height:820px)]:hidden">
            Open visibility will ask for Pro access when submitted.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function OpenRoomsPanel({
  openRooms,
  onJoin,
  disabled,
}: {
  openRooms: BattleOpenRoomListing[];
  onJoin: (roomId: string) => void;
  disabled: boolean;
}) {
  return (
    <motion.section
      className="relative min-h-[14rem] overflow-hidden border border-[#5ec7ff]/18 bg-[linear-gradient(180deg,rgba(6,12,18,0.9),rgba(4,8,12,0.86))] shadow-[0_16px_30px_rgba(0,0,0,0.24)] backdrop-blur-sm [@media(max-height:820px)]:min-h-[11rem]"
      initial={false}
      style={panelStyle(BEVELED_PANEL_CLIP)}
    >
      <div className="pointer-events-none absolute inset-[1px] border border-white/8 opacity-70" style={panelStyle(BEVELED_PANEL_CLIP)} />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(146,222,255,0.5),transparent)]" />
      <div className="relative flex h-full min-h-0 flex-col px-2.5 py-1.9 sm:px-2.75 lg:px-3 lg:py-2 [@media(max-height:820px)]:px-2.5 [@media(max-height:820px)]:py-1.5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(66,196,255,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(61,169,255,0.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_22%)]" />
        <div className="relative flex flex-none flex-col gap-1.25 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-6.5 w-6.5 place-items-center rounded-full border border-[#61cfff]/22 bg-[#071723]/84 text-[#92deff] shadow-[0_0_16px_rgba(93,196,255,0.12)]">
              <Users className="h-3.25 w-3.25" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[#92deff]">Open Rooms</p>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-1.75 py-0.5 text-[0.46rem] font-semibold uppercase tracking-[0.14em] text-white/46">
                  Discoverable
                </span>
              </div>
              <p className="mt-0.5 text-[0.6rem] leading-4 text-white/56">
                Join host-created matches without a code.
              </p>
            </div>
          </div>
          <p className="text-[0.54rem] font-semibold uppercase tracking-[0.14em] text-white/42">
            {openRooms.length > 0 ? `${openRooms.length} Live` : "No Rooms"}
          </p>
        </div>

        {openRooms.length > 0 ? (
          <div className="relative mt-1.5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-1.5">
              {openRooms.map((room) => (
                <OpenRoomCard disabled={disabled} key={room.roomId} onJoin={() => onJoin(room.roomId)} room={room} />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative mt-1.25 flex min-h-[9rem] flex-1 items-center justify-center rounded-[0.9rem] border border-dashed border-white/10 bg-black/18 px-3 py-2 text-center [@media(max-height:820px)]:min-h-[7.5rem]">
            <div>
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white/64">
                No discoverable rooms yet
              </p>
              <p className="mt-1 text-[0.62rem] leading-4.5 text-white/48">
                Set visibility to Open inside Host Room to publish a custom match here.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function PublicRuleChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.78rem] border border-white/8 bg-black/22 px-2 py-1.1 text-left">
      <p className="text-[0.46rem] font-semibold uppercase tracking-[0.14em] text-white/42">{label}</p>
      <p className="mt-0.5 text-[0.62rem] font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniRuleBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.68rem] border border-white/10 bg-black/22 px-2 py-1">
      <p className="text-[0.45rem] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className="mt-0.4 text-[0.6rem] font-semibold text-white">{value}</p>
    </div>
  );
}

function OpenRoomCard({
  room,
  onJoin,
  disabled,
}: {
  room: BattleOpenRoomListing;
  onJoin: () => void;
  disabled: boolean;
}) {
  return (
    <div className="relative overflow-hidden border border-white/8 bg-black/18 p-2 shadow-[0_8px_20px_rgba(0,0,0,0.18)]" style={panelStyle(BEVELED_PANEL_CLIP)}>
      <div className="pointer-events-none absolute inset-[1px] border border-white/6 opacity-60" style={panelStyle(BEVELED_PANEL_CLIP)} />
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-[#97ffd1]">Open Custom Room</p>
          <p className="mt-0.75 truncate text-[0.76rem] font-semibold tracking-[-0.03em] text-white">
            {room.hostDisplayName ?? "Pro Host"}
          </p>
          <p className="mt-0.75 text-[0.56rem] text-white/46">
            Live lobby waiting for challengers
          </p>
        </div>
        <span className="rounded-full border border-[#67ffb9]/16 bg-[#0d2015]/80 px-1.75 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-[#97ffd1]">
          {room.joinedPlayers}/{room.maxPlayers}
        </span>
      </div>

      <div className="mt-1.25 grid grid-cols-2 gap-1 md:grid-cols-4">
        <MiniRuleBadge label="Duration" value={formatBattleDuration(room.durationMinutes)} />
        <MiniRuleBadge label="Players" value={`${room.maxPlayers} Max`} />
        <MiniRuleBadge label="Risk" value={`${room.riskLimitPercent ?? 0}% Max`} />
        <MiniRuleBadge label="Drawdown" value={`${room.maxDrawdownPercent ?? 0}% Max`} />
      </div>

      <div className="mt-1.25 flex flex-col gap-1.25 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-[0.56rem] text-white/48">
          Symbol and timeframe stay hidden until the match starts.
        </p>
        <button
          className="inline-flex min-h-8 items-center justify-center gap-1 overflow-hidden border border-[#69ffb9]/28 bg-[linear-gradient(180deg,rgba(21,151,92,0.86),rgba(8,84,52,0.92))] px-3 text-[0.64rem] font-bold uppercase tracking-[0.06em] text-[#effff5] transition hover:border-[#b2ffd9]/50 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onJoin}
          style={panelStyle(HERO_BUTTON_CLIP)}
          type="button"
        >
          Join Open Room
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function RecentResultsDrawer({
  isOpen,
  onClose,
  results,
  now,
}: {
  isOpen: boolean;
  onClose: () => void;
  results: BattleResultRecord[];
  now: number | null;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 bg-[rgba(3,5,8,0.74)] backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.aside
        animate={{ x: 0, opacity: 1 }}
        className="absolute right-0 top-0 flex h-full w-full max-w-[23rem] flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(10,12,16,0.98),rgba(5,7,10,0.98))] shadow-[-20px_0_42px_rgba(0,0,0,0.34)]"
        initial={{ x: 32, opacity: 0.92 }}
        onClick={(event) => event.stopPropagation()}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/8 px-3.5 py-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[#ffcc6f]/22 bg-[#1b1408]/82 text-[#ffcf73] shadow-[0_0_16px_rgba(255,191,93,0.12)]">
                <Trophy className="h-3.25 w-3.25" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[#f8d38a]">
                  Recent Results
                </p>
                <p className="mt-0.75 text-[0.66rem] text-white/54">
                  Your latest {BATTLE_RECENT_RESULTS_LIMIT} official battles
                </p>
              </div>
            </div>
          </div>
          <button
            aria-label="Close recent results"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/64 transition hover:border-white/18 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2.5">
          {results.length > 0 ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[0.9rem] border border-white/8 bg-black/18">
              <div className="grid flex-none grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr] gap-2.5 border-b border-white/8 bg-[rgba(8,11,16,0.94)] px-2.5 py-1.75 text-[0.46rem] font-semibold uppercase tracking-[0.14em] text-white/40">
                <p>Winner</p>
                <p>Symbol</p>
                <p>Timeframe</p>
                <p>Duration</p>
                <p>Ended</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
                <div className="divide-y divide-white/8">
                  {results.map((result, index) => {
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
            </div>
          ) : (
            <div className="rounded-[0.9rem] border border-dashed border-white/10 bg-black/16 px-3.5 py-3.5 text-center">
              <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white/64">
                No official battles yet
              </p>
              <p className="mt-1 text-[0.62rem] leading-4.5 text-white/48">
                Finish a room and your latest official battle results will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </motion.aside>
    </motion.div>
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
  const endedAtLabel = formatRecentResultTimestamp(result.endedAt);

  return (
    <Link
      className={cn(
        "group relative block px-3 py-2 transition hover:bg-white/[0.02]",
        tone.border,
      )}
      href={`/app/battle/results/${result.roomId}`}
    >
      <div className={cn("pointer-events-none absolute inset-y-2 left-2 w-px rounded-full blur-sm", tone.glow)} />
      <div className="grid gap-2 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr] md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2.25">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br shadow-[0_0_18px_rgba(255,255,255,0.08)]",
                tone.medal,
              )}
            >
              <Trophy className={cn("h-3.25 w-3.25", tone.icon)} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-white/44">
                Winner
              </p>
              <p className="truncate text-[0.76rem] font-semibold text-white">{winnerName}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Symbol
          </p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold md:mt-0",
              tone.pill,
            )}
          >
            {result.symbol}
          </span>
        </div>

        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Timeframe
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold text-white md:mt-0">{result.timeframe}</p>
        </div>

        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Duration
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold text-white md:mt-0">
            {formatBattleDuration(result.durationMinutes)}
          </p>
        </div>

        <div>
          <p className="text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-white/42 md:hidden">
            Ended
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold text-white md:mt-0">{endedLabel}</p>
          <p className="text-[0.56rem] text-white/46">{endedAtLabel}</p>
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

function formatRecentResultTimestamp(endedAt: string) {
  const date = new Date(endedAt);
  return `${recentResultDateFormatter.format(date)}, ${recentResultTimeFormatter.format(date)} UTC`;
}
