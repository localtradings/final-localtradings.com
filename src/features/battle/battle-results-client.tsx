"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { BattleEmptyState } from "@/features/battle/components/battle-empty-state";
import { formatBattleResultStatus } from "@/features/battle/formatters";
import type {
  BattleResultEntry,
  BattleResultRecord,
  BattleResultStatus,
  BattleRoomType,
} from "@/features/battle/types";
import {
  ArrowLeft,
  CalendarDays,
  ChartCandlestick,
  Clock3,
  Flag,
  Hash,
  LockKeyhole,
  Medal,
  ShieldPlus,
  Trophy,
  Users,
} from "lucide-react";

function formatMoney(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedMoney(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

function formatRoomType(roomType: BattleRoomType) {
  if (roomType === "private") {
    return "Private Room";
  }

  if (roomType === "open") {
    return "Open Room";
  }

  return "Public Room";
}

function formatShortId(value: string | null) {
  if (!value) {
    return "Pending";
  }

  if (value.length <= 11) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function formatDateLine(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatTimeLine(iso: string) {
  return `${new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso))} UTC`;
}

function formatDurationLabel(durationMinutes: number) {
  return `${durationMinutes} Minutes`;
}

function statusClasses(status: BattleResultStatus) {
  if (status === "finished") {
    return "border-emerald-500/35 bg-emerald-500/14 text-emerald-300";
  }

  if (status === "left_early") {
    return "border-amber-500/35 bg-amber-500/14 text-amber-300";
  }

  if (status === "forfeit") {
    return "border-rose-500/35 bg-rose-500/14 text-rose-300";
  }

  return "border-slate-500/35 bg-slate-500/14 text-slate-200";
}

function cardTone(rank: number) {
  if (rank === 1) {
    return {
      badge: "border-[#f7c85b]/50 bg-[#f7c85b]/18 text-[#ffd56a]",
      glow: "from-[#f7c85b]/28 via-[#f7c85b]/8 to-transparent",
      border: "border-[#f7c85b]/50",
      footer: "border-t-[#f7c85b]/30 bg-[#f7c85b]/10",
      iconRing: "border-[#f7c85b]/65",
    };
  }

  if (rank === 2) {
    return {
      badge: "border-slate-300/45 bg-slate-300/16 text-slate-100",
      glow: "from-slate-300/22 via-slate-300/6 to-transparent",
      border: "border-emerald-500/35",
      footer: "border-t-white/10 bg-white/[0.03]",
      iconRing: "border-emerald-400/60",
    };
  }

  return {
    badge: "border-[#cf7b3a]/45 bg-[#cf7b3a]/14 text-[#f6af73]",
    glow: "from-[#cf7b3a]/22 via-[#cf7b3a]/5 to-transparent",
    border: "border-[#cf7b3a]/38",
    footer: "border-t-[#cf7b3a]/20 bg-[#cf7b3a]/08",
    iconRing: "border-[#cf7b3a]/55",
  };
}

function InfoTile({
  icon,
  label,
  value,
  secondary,
  accent = "text-emerald-300",
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  secondary?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-[0.95rem] border border-emerald-500/28 bg-[#07120f]/78 px-3 py-2.5 shadow-[0_0_0_1px_rgba(16,185,129,0.05),0_14px_40px_rgba(0,0,0,0.24)] backdrop-blur-sm">
      <div className="flex items-start gap-2.25">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-white/10 bg-white/[0.03] ${accent}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/56">
            {label}
          </p>
          <div className="mt-1 text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
            {value}
          </div>
          {secondary ? (
            <div className="mt-0.5 text-[0.76rem] text-white/58">{secondary}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  pill,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  pill?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[3.8rem] items-center gap-2 border-r border-emerald-500/14 px-3 py-2.5 last:border-r-0 max-lg:last:border-r-0 max-md:border-r-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border border-white/10 bg-white/[0.03] text-emerald-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-white/56">
          {label}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.25">
          <span className="text-[0.92rem] font-semibold tracking-[-0.02em] text-white">
            {value}
          </span>
          {pill}
        </div>
      </div>
    </div>
  );
}

function PodiumCard({
  entry,
  emphasize,
}: {
  entry: BattleResultEntry;
  emphasize: boolean;
}) {
  const tone = cardTone(entry.rank);
  const profitClass =
    entry.netProfit > 0
      ? "text-emerald-300"
      : entry.netProfit < 0
        ? "text-rose-300"
        : "text-white";

  return (
    <article
      className={[
        "relative overflow-hidden rounded-[1rem] border bg-[#07100d]/90 shadow-[0_16px_42px_rgba(0,0,0,0.32)]",
        tone.border,
        emphasize ? "lg:-translate-y-2" : "",
      ].join(" ")}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${tone.glow}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />

      <div className="relative px-3.5 pb-3.5 pt-3.5 lg:px-4 lg:pb-3.5 lg:pt-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className={`flex h-9 w-9 items-center justify-center rounded-[0.8rem] border text-[0.95rem] font-semibold ${tone.badge}`}>
            {entry.rank}
          </div>
          {entry.rank === 1 ? (
            <div className="text-[#ffd56a]">
              <Trophy className="h-5 w-5" />
            </div>
          ) : null}
        </div>

        <div className="mt-3.5 flex justify-center">
          <div className={`flex h-[4.15rem] w-[4.15rem] items-center justify-center rounded-full border bg-black/35 shadow-[0_0_32px_rgba(16,185,129,0.18)] ${tone.iconRing} lg:h-[4.5rem] lg:w-[4.5rem]`}>
            <Image
              alt=""
              className="h-8 w-8 object-contain"
              height={40}
              src="/new LOGO.png"
              width={40}
            />
          </div>
        </div>

        <div className="mt-3.5 text-center">
          <h3 className="truncate text-[1.2rem] font-semibold tracking-[-0.05em] text-white lg:text-[1.28rem]">
            {entry.displayName}
          </h3>
          <p className="mt-0.5 text-[0.76rem] text-white/62">
            User ID: {formatShortId(entry.userId)}
          </p>
        </div>

        <div className="mt-3.5 grid grid-cols-3 divide-x divide-white/10 rounded-[0.85rem] border border-white/8 bg-black/18 px-2 py-2 text-center">
          <div>
            <p className="text-[0.98rem] font-semibold text-white">{entry.totalTrades}</p>
            <p className="mt-0.5 text-[0.64rem] uppercase tracking-[0.16em] text-white/45">Trades</p>
          </div>
          <div>
            <p className="text-[0.98rem] font-semibold text-white">{entry.winningTrades}</p>
            <p className="mt-0.5 text-[0.64rem] uppercase tracking-[0.16em] text-white/45">Wins</p>
          </div>
          <div>
            <p className="text-[0.98rem] font-semibold text-white">{entry.losingTrades}</p>
            <p className="mt-0.5 text-[0.64rem] uppercase tracking-[0.16em] text-white/45">Losses</p>
          </div>
        </div>
      </div>

      <div className={`relative grid grid-cols-2 gap-3 border-t px-3.5 py-2.5 lg:px-4 lg:py-2.5 ${tone.footer}`}>
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Final Balance
          </p>
          <p className="mt-1 text-[1.05rem] font-semibold tracking-[-0.04em] text-white">
            {formatMoney(entry.finalBalance)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/45">
            Net Profit
          </p>
          <p className={`mt-1 text-[1rem] font-semibold tracking-[-0.04em] ${profitClass}`}>
            {formatSignedMoney(entry.netProfit)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function BattleResultsClient({ result }: { result: BattleResultRecord | null }) {
  useEffect(() => {
    document.body.classList.add("battle-results-mode");

    return () => {
      document.body.classList.remove("battle-results-mode");
    };
  }, []);

  if (!result) {
    return (
      <BattleEmptyState
        detail="Results are participant-only and only exist after the worker finalizes the room."
        title="No battle result available"
      />
    );
  }

  const sortedEntries = [...result.entries].sort((a, b) => a.rank - b.rank);
  const topThree = sortedEntries.slice(0, 3);
  const podiumOrder = [
    topThree.find((entry) => entry.rank === 2),
    topThree.find((entry) => entry.rank === 1),
    topThree.find((entry) => entry.rank === 3),
  ].filter((entry): entry is BattleResultEntry => Boolean(entry));

  return (
    <div className="fixed inset-0 z-[80] text-white">
      <div className="relative isolate h-full overflow-y-auto bg-[#030806] lg:overflow-hidden">
        <Image
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-95"
          fill
          priority
          src="/result_background.png"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_38%),linear-gradient(180deg,rgba(2,7,6,0.58),rgba(2,7,6,0.92)_18%,rgba(2,7,6,0.98))]" />

        <div className="relative mx-auto flex min-h-full max-w-[88rem] flex-col px-4 py-4 sm:px-5 sm:py-5 lg:h-full lg:px-7 lg:py-4 xl:max-w-[92rem] xl:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center">
                <Image
                  alt="LocalTrading"
                  className="h-5 w-5 object-contain"
                  height={20}
                  src="/new LOGO.png"
                  width={20}
                />
              </div>
              <div className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white lg:text-[1.55rem]">
                <span>LOCAL</span>
                <span className="text-emerald-400">TRADING</span>
              </div>
            </div>

            <Link
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-[1rem] border border-white/14 bg-black/28 px-4 text-[0.92rem] font-medium text-white transition hover:border-emerald-400/45 hover:bg-emerald-500/8"
              href="/app/battle"
            >
              <ArrowLeft className="h-4 w-4 text-emerald-300" />
              Back to Battles
            </Link>
          </div>

          <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex items-start gap-3">
              <div className="flex h-[3rem] w-[3rem] shrink-0 items-center justify-center rounded-[0.9rem] border border-emerald-500/45 bg-emerald-500/10 text-emerald-300 shadow-[0_0_34px_rgba(16,185,129,0.12)] lg:h-12 lg:w-12">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[1.75rem] font-semibold uppercase leading-none tracking-[-0.06em] text-white sm:text-[2rem] lg:text-[2.35rem]">
                  Battle <span className="text-emerald-400">Results</span>
                </p>
                <p className="mt-1 text-[0.82rem] text-white/68 lg:text-[0.9rem]">
                  Official battle results <span className="mx-2 text-white/28">•</span> Only participants can view
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric
                icon={<ChartCandlestick className="h-4.5 w-4.5" />}
                label="Symbol"
                value={result.symbol}
              />
              <SummaryMetric
                icon={<Clock3 className="h-4.5 w-4.5" />}
                label="Timeframe"
                value={result.timeframe}
              />
              <SummaryMetric
                icon={<CalendarDays className="h-4.5 w-4.5" />}
                label="Duration"
                value={formatDurationLabel(result.durationMinutes)}
              />
              <SummaryMetric
                icon={<Hash className="h-4.5 w-4.5" />}
                label="Room ID"
                value={result.roomId.slice(0, 8).toUpperCase()}
              />
              <SummaryMetric
                icon={<LockKeyhole className="h-4.5 w-4.5" />}
                label="Room Type"
                pill={
                  <span className="inline-flex items-center rounded-full border border-sky-500/35 bg-sky-500/12 px-2 py-0.5 text-[0.66rem] font-medium text-sky-200">
                    {formatRoomType(result.roomType)}
                  </span>
                }
                value={formatRoomType(result.roomType)}
              />
              <SummaryMetric
                icon={<ShieldPlus className="h-4.5 w-4.5" />}
                label="Risk Cap"
                value={
                  typeof result.riskLimitPercent === "number"
                    ? `${result.riskLimitPercent}% Max`
                    : "Flexible"
                }
              />
              <SummaryMetric
                icon={<Flag className="h-4.5 w-4.5" />}
                label="Drawdown"
                value={
                  typeof result.maxDrawdownPercent === "number"
                    ? `${result.maxDrawdownPercent}% Max`
                    : "Flexible"
                }
              />
            </div>
          </div>

          <div className="mt-3 grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3">
            <section className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <InfoTile
                accent="text-[#ffd56a]"
                icon={<Trophy className="h-4.5 w-4.5" />}
                label="Winner"
                secondary={`User ID: ${formatShortId(result.winnerUserId)}`}
                value={
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{result.winnerDisplayName ?? "Pending"}</span>
                    {result.winnerDisplayName ? (
                      <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/14 px-2 py-0.5 text-[0.66rem] font-semibold text-emerald-300">
                        #1
                      </span>
                    ) : null}
                  </div>
                }
              />
              <InfoTile
                icon={<CalendarDays className="h-4.5 w-4.5" />}
                label="Started"
                secondary={formatTimeLine(result.startedAt)}
                value={formatDateLine(result.startedAt)}
              />
              <InfoTile
                icon={<Flag className="h-4.5 w-4.5" />}
                label="Ended"
                secondary={formatTimeLine(result.endedAt)}
                value={formatDateLine(result.endedAt)}
              />
              <InfoTile
                icon={<Users className="h-4.5 w-4.5" />}
                label="Players"
                secondary="Total Participants"
                value={result.entries.length}
              />
            </section>

            <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.92fr)]">
              <section className="flex min-h-0 flex-col rounded-[1.2rem] border border-emerald-500/22 bg-[#040907]/84 px-4 py-3.5 shadow-[0_20px_56px_rgba(0,0,0,0.26)]">
                <div className="flex items-start gap-3 border-b border-emerald-500/14 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/[0.03] text-emerald-300">
                    <Medal className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[1.2rem] font-semibold uppercase tracking-[-0.05em] text-white">
                      Podium
                    </h2>
                    <p className="mt-0.5 text-[0.8rem] text-white/64">Top 3 traders</p>
                  </div>
                </div>

                <div className="mt-3.5 grid flex-1 content-center gap-3 lg:grid-cols-3 lg:items-center">
                  {podiumOrder.map((entry) => (
                    <PodiumCard
                      emphasize={entry.rank === 1}
                      entry={entry}
                      key={entry.userId}
                    />
                  ))}
                </div>
              </section>

              <section className="flex min-h-0 flex-col rounded-[1.2rem] border border-emerald-500/24 bg-[#040907]/88 px-4 py-3.5 shadow-[0_20px_56px_rgba(0,0,0,0.26)]">
                <div className="flex items-start gap-3 border-b border-emerald-500/14 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/[0.03] text-emerald-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-[1.2rem] font-semibold uppercase tracking-[-0.05em] text-white">
                      Full Leaderboard
                    </h2>
                    <p className="mt-0.5 text-[0.8rem] text-white/64">Complete results for all participants</p>
                  </div>
                </div>

                <div className="mt-3 min-h-0 overflow-hidden rounded-[1rem] border border-white/10 bg-black/18">
                  <div className="h-full overflow-x-auto overflow-y-auto">
                    <table className="min-w-[43rem] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-white/56">
                        <th className="px-3 py-2">Rank</th>
                        <th className="px-3 py-2">Trader</th>
                        <th className="px-3 py-2 text-right">Final Balance</th>
                        <th className="px-3 py-2 text-right">Net Profit</th>
                        <th className="px-3 py-2 text-center">Trades</th>
                        <th className="px-3 py-2 text-center">Wins</th>
                        <th className="px-3 py-2 text-center">Losses</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                      <tbody>
                        {sortedEntries.map((entry) => {
                          const profitClass =
                            entry.netProfit > 0
                              ? "text-emerald-300"
                              : entry.netProfit < 0
                                ? "text-rose-300"
                                : "text-white";

                          return (
                            <tr
                              className="border-b border-white/6 last:border-b-0"
                              key={entry.userId}
                            >
                              <td className="px-3 py-2">
                                <div
                                  className={[
                                    "flex h-8 w-8 items-center justify-center rounded-[0.8rem] border text-[0.84rem] font-semibold",
                                    entry.rank === 1
                                      ? "border-[#f7c85b]/45 bg-[#f7c85b]/14 text-[#ffd56a]"
                                      : entry.rank === 2
                                        ? "border-slate-300/35 bg-slate-300/10 text-slate-100"
                                        : entry.rank === 3
                                          ? "border-[#cf7b3a]/40 bg-[#cf7b3a]/12 text-[#f6af73]"
                                          : "border-white/10 bg-white/[0.03] text-white",
                                  ].join(" ")}
                                >
                                  {entry.rank}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-500/45 bg-emerald-500/10">
                                    <Image
                                      alt=""
                                      className="h-4 w-4 object-contain"
                                      height={18}
                                      src="/new LOGO.png"
                                      width={18}
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[0.94rem] font-medium tracking-[-0.02em] text-white">
                                      {entry.displayName}
                                    </p>
                                    <p className="mt-0.5 text-[0.74rem] text-white/50">
                                      {formatShortId(entry.userId)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right text-[0.96rem] font-semibold tracking-[-0.03em] text-white">
                                {formatMoney(entry.finalBalance)}
                              </td>
                              <td className={`px-3 py-2 text-right text-[0.94rem] font-semibold tracking-[-0.03em] ${profitClass}`}>
                                {formatSignedMoney(entry.netProfit)}
                              </td>
                              <td className="px-3 py-2 text-center text-[0.92rem] font-medium text-white">
                                {entry.totalTrades}
                              </td>
                              <td className="px-3 py-2 text-center text-[0.92rem] font-medium text-white">
                                {entry.winningTrades}
                              </td>
                              <td className="px-3 py-2 text-center text-[0.92rem] font-medium text-white">
                                {entry.losingTrades}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className={`inline-flex rounded-full border px-3 py-1 text-[0.72rem] font-medium ${statusClasses(entry.status)}`}>
                                  {formatBattleResultStatus(entry.status)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
