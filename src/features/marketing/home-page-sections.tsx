import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import { SymbolIcon } from "@/components/ui/symbol-icon";
import type { homeCopy } from "@/content/marketing/site-copy";

type HomeCopy = typeof homeCopy;

const featureGridTones = [
  {
    accent: "text-[#f3c56f]",
    border: "border-[#f3c56f]/26",
    surface: "bg-[#f3c56f]/8",
    icon: "swords",
  },
  {
    accent: "text-[#9dd9ff]",
    border: "border-[#9dd9ff]/22",
    surface: "bg-[#9dd9ff]/8",
    icon: "query_stats",
  },
  {
    accent: "text-[#90f0b8]",
    border: "border-[#90f0b8]/24",
    surface: "bg-[#90f0b8]/8",
    icon: "school",
  },
  {
    accent: "text-[#ffe7a6]",
    border: "border-[#ffe7a6]/22",
    surface: "bg-[#ffe7a6]/8",
    icon: "quiz",
  },
  {
    accent: "text-[#b9f6ef]",
    border: "border-[#b9f6ef]/22",
    surface: "bg-[#b9f6ef]/8",
    icon: "trending_up",
  },
] as const;

const campaignNodes = ["Learn", "Quiz", "Practice", "Battle"] as const;

function getFeatureMeta(
  title: string,
  moduleCount: number,
  lessonCount: number,
  quizCount: number,
) {
  switch (title) {
    case "Battle":
      return "Private rooms / open rooms / results";
    case "Backtesting":
      return "Replay / planner / saved sessions";
    case "Learn":
      return `${moduleCount} modules / ${lessonCount} lessons`;
    case "Quiz":
      return `${quizCount} quiz packs / setup to results`;
    case "Progress":
      return "Dashboard / bookmarks / next actions";
    default:
      return null;
  }
}

export function MarketingHeroSection({ copy }: { copy: HomeCopy }) {
  return (
    <section className="relative isolate overflow-hidden px-6 pb-10 pt-7 sm:pt-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/localtradings-campaign-map-hero.png')] bg-cover bg-[64%_center] opacity-95 sm:bg-center"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#050606_0%,rgba(5,6,6,0.96)_34%,rgba(5,6,6,0.48)_68%,rgba(5,6,6,0.76)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(241,188,91,0.16),transparent_28%),radial-gradient(circle_at_55%_64%,rgba(74,255,159,0.10),transparent_34%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,#030404)]" />

      <div className="shell-width relative z-10">
        <div className="grid min-h-[39rem] gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(26rem,0.72fr)] lg:items-center">
          <Reveal className="max-w-[43rem]" y={28}>
            <div className="mb-8 h-px w-56 bg-[linear-gradient(90deg,#f3c56f,rgba(243,197,111,0))]" />
            <h1 className="max-w-full font-heading text-[3.25rem] font-black leading-[0.94] tracking-normal text-[#f3efe5] sm:text-[5.6rem] sm:leading-[0.9] lg:text-[6.5rem]">
              {copy.hero.title === "localtradings.com" ? (
                <>
                  <span>localtradings</span>
                  <span className="block text-[#f3c56f]">.com</span>
                </>
              ) : (
                copy.hero.title
              )}
            </h1>
            <p className="mt-6 max-w-[38rem] text-[1rem] leading-7 text-[#d9d5cb]/82 sm:text-[1.2rem] sm:leading-8">
              {copy.hero.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#f3c56f]/55 bg-[linear-gradient(180deg,#1d311f,#0a1711)] px-7 text-sm font-black uppercase tracking-[0.12em] !text-white shadow-[0_18px_44px_rgba(0,0,0,0.38),0_0_34px_rgba(243,197,111,0.16)] transition hover:-translate-y-0.5 hover:border-[#ffe0a0]/75 sm:text-[0.9rem]"
                href={copy.hero.primaryCta.href}
              >
                {copy.hero.primaryCta.label}
                <SymbolIcon className="text-base" name="arrow_forward" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center border border-white/14 bg-black/44 px-7 text-sm font-black uppercase tracking-[0.12em] !text-white transition hover:border-[#f3c56f]/38 hover:bg-white/[0.045] sm:text-[0.9rem]"
                href={copy.hero.secondaryCta.href}
              >
                {copy.hero.secondaryCta.label}
              </Link>
            </div>
          </Reveal>

          <Reveal
            className="relative hidden min-h-[30rem] overflow-hidden border border-[#f3c56f]/24 bg-[linear-gradient(180deg,rgba(13,16,14,0.82),rgba(5,7,7,0.66))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.46)] backdrop-blur-[3px] lg:block"
            delay={0.08}
            y={22}
          >
            <div className="absolute inset-3 border border-white/6" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#f3c56f]">
                  Campaign route
                </p>
                <span className="border border-[#8df0ba]/22 bg-[#8df0ba]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#90f0b8]">
                  Practice ready
                </span>
              </div>

              <div className="my-10 space-y-5">
                {campaignNodes.map((node, index) => (
                  <div
                    className="grid grid-cols-[3.2rem_minmax(0,1fr)] items-center gap-4"
                    key={node}
                  >
                    <span className="flex h-12 w-12 items-center justify-center border border-[#f3c56f]/35 bg-[#f3c56f]/10 font-heading text-base font-black text-[#f3c56f]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="h-1.5 overflow-hidden bg-white/10">
                        <div
                          className="h-full bg-[linear-gradient(90deg,#f3c56f,#90f0b8)]"
                          style={{ width: `${36 + index * 16}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#ece6d9]">
                        {node}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {copy.hero.quickModes.slice(0, 4).map((item, index) => (
                  <div
                    className="border border-white/9 bg-black/30 px-3 py-3"
                    key={item.label}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f3c56f]">
                      {String(index + 1).padStart(2, "0")} / {item.label}
                    </p>
                    <p className="mt-2 text-[12px] leading-5 text-[#d9d5cb]/76">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal
          className="mt-2 grid gap-2 border-y border-[#f3c56f]/18 bg-[#080a09]/78 py-3 shadow-[0_-20px_70px_rgba(0,0,0,0.36)] sm:grid-cols-5 sm:gap-0 sm:divide-x sm:divide-[#f3c56f]/12 sm:px-2"
          delay={0.08}
          y={18}
        >
          {copy.hero.quickModes.map((item, index) => (
            <div className="group px-3 py-2 transition hover:bg-[#f3c56f]/[0.055]" key={item.label}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f3c56f]">
                {String(index + 1).padStart(2, "0")} {item.label}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#d9d5cb]/80 sm:text-[13px]">
                {item.detail}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function MarketingFeatureGridSection({
  copy,
  lessonCount,
  moduleCount,
  quizCount,
}: {
  copy: HomeCopy;
  lessonCount: number;
  moduleCount: number;
  quizCount: number;
}) {
  return (
    <section className="relative overflow-hidden px-6 py-20 sm:py-24">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(243,197,111,0.45),transparent)]" />
      <div aria-hidden="true" className="absolute right-[-12rem] top-20 h-[30rem] w-[30rem] rounded-full bg-[#f3c56f]/6 blur-[110px]" />
      <div className="shell-width relative">
        <Reveal className="grid gap-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:items-end" y={24}>
          <div>
            <Badge>Product map</Badge>
            <h2 className="mt-4 max-w-[13ch] font-heading text-[2.35rem] font-black tracking-normal text-[#f3efe5] sm:text-[3.2rem] sm:leading-[0.94]">
              The landing page matches the product.
            </h2>
          </div>
          <p className="max-w-[46rem] text-base leading-8 text-[#d9d5cb]/72 sm:text-lg">
            Battle is the lead mode, but the signed-in workspace also includes Learn,
            Quiz, Backtesting, Progress, and account state. No feature is advertised
            here unless it exists in the routes.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-5">
          {copy.featureGrid.map((item, index) => {
            const tone = featureGridTones[index];
            const meta = getFeatureMeta(item.title, moduleCount, lessonCount, quizCount);

            return (
              <Reveal
                className={`group relative overflow-hidden border ${tone.border} ${tone.surface} p-5 transition hover:-translate-y-1 hover:bg-white/[0.045] lg:min-h-[24rem]`}
                delay={index * 0.04}
                key={item.title}
              >
                <div className="absolute inset-3 border border-white/6 opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`flex h-12 w-12 items-center justify-center border ${tone.border} bg-black/20 ${tone.accent}`}>
                        <SymbolIcon className="text-xl" name={tone.icon} />
                      </span>
                      <span className={`font-heading text-3xl font-black ${tone.accent}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${tone.accent}`}>
                        {item.eyebrow}
                      </p>
                      <h3 className="mt-3 font-heading text-[1.75rem] font-black tracking-normal text-[#f3efe5]">
                        {item.title}
                      </h3>
                      {meta ? (
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d9d5cb]/48">
                          {meta}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm leading-7 text-[#d9d5cb]/72">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          className={`border ${tone.border} bg-black/20 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${tone.accent}`}
                          key={point}
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] ${tone.accent}`}
                    href={item.href}
                  >
                    {item.ctaLabel}
                    <SymbolIcon className="text-base" name="arrow_forward" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MarketingBattleSpotlightSection({
  copy,
  battleDurationCount,
  openRoomMaxPlayers,
}: {
  copy: HomeCopy;
  battleDurationCount: number;
  openRoomMaxPlayers: number;
}) {
  return (
    <section className="relative border-y border-[#f3c56f]/12 bg-[#090b0a] px-6 py-24">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(144,240,184,0.10),transparent_36%)]" />
      <div className="shell-width relative grid gap-12 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-center">
        <Reveal className="space-y-7" y={24}>
          <Badge>{copy.battleSpotlight.eyebrow}</Badge>
          <div className="space-y-4">
            <h2 className="max-w-[13ch] font-heading text-[2.45rem] font-black tracking-normal text-[#f3efe5] sm:text-[3.6rem] sm:leading-[0.94]">
              {copy.battleSpotlight.title}
            </h2>
            <p className="max-w-[39rem] text-base leading-8 text-[#d9d5cb]/74 sm:text-lg">
              {copy.battleSpotlight.description}
            </p>
          </div>

          <div className="space-y-3">
            {copy.battleSpotlight.roomModes.map((item, index) => (
              <div
                className="grid gap-3 border border-white/9 bg-black/22 px-4 py-4 sm:grid-cols-[3rem_minmax(0,1fr)]"
                key={item.title}
              >
                <span className="flex h-10 w-10 items-center justify-center border border-[#f3c56f]/24 bg-[#f3c56f]/8 font-heading text-sm font-black text-[#f3c56f]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-black text-[#f3efe5]">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-7 text-[#d9d5cb]/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal
          className="relative overflow-hidden border border-[#f3c56f]/22 bg-[linear-gradient(180deg,rgba(18,18,15,0.96),rgba(6,8,7,0.98))] p-4 shadow-[0_30px_100px_rgba(0,0,0,0.44)] sm:p-5"
          delay={0.06}
          y={30}
        >
          <div className="absolute inset-3 border border-white/6" />
          <div className="relative grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
            <div className="border border-white/9 bg-white/[0.025] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f3c56f]">
                Room types
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ["Private", "Invite your own lobby"],
                  ["Open", "Join the room list"],
                  ["Results", "Review rank and balance"],
                ].map(([label, detail]) => (
                  <div className="border border-white/8 bg-black/28 px-3 py-3" key={label}>
                    <p className="text-sm font-black text-[#f3efe5]">{label}</p>
                    <p className="mt-1 text-[12px] leading-6 text-[#d9d5cb]/66">{detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 border border-[#90f0b8]/20 bg-[#90f0b8]/10 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#90f0b8]">
                  Match spread
                </p>
                <p className="mt-2 text-sm leading-6 text-[#f3efe5]">
                  {battleDurationCount} battle lengths and open rooms up to {openRoomMaxPlayers} players.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden border border-white/9 bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9d5cb]/54">
                    Open room list
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#90f0b8]">
                    Queue live
                  </span>
                </div>
                <div className="divide-y divide-white/8">
                  {[
                    ["London open", "15 min / 4 of 10 joined", "Join room"],
                    ["New York setup", "30 min / 3 of 6 joined", "View code"],
                    ["Risk sprint", "10 min / 2 of 4 joined", "Join room"],
                  ].map(([title, meta, action]) => (
                    <div className="flex items-center justify-between gap-4 px-4 py-3.5" key={title}>
                      <div>
                        <p className="text-sm font-semibold text-[#f3efe5]">{title}</p>
                        <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-[#d9d5cb]/54">
                          {meta}
                        </p>
                      </div>
                      <span className="border border-[#90f0b8]/18 bg-[#90f0b8]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#90f0b8]">
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden border border-white/9 bg-white/[0.025]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9d5cb]/54">
                    Recent results
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#f3c56f]">
                    Final board
                  </span>
                </div>
                <div className="divide-y divide-white/8">
                  {[
                    ["1", "You", "$101,420", "Finished"],
                    ["2", "Rico", "$100,980", "Finished"],
                    ["3", "Aira", "$99,640", "Drawdown"],
                  ].map(([rank, name, balance, status]) => (
                    <div className="grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5" key={name}>
                      <div className="flex h-9 w-9 items-center justify-center border border-[#f3c56f]/18 bg-black/32 text-sm font-black text-[#f3c56f]">
                        {rank}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#f3efe5]">{name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#d9d5cb]/54">
                          {status}
                        </p>
                      </div>
                      <span className="text-sm font-black text-[#f3efe5]">{balance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function MarketingSupportModesSection({
  copy,
  lessonCount,
  moduleCount,
  quizCount,
}: {
  copy: HomeCopy;
  lessonCount: number;
  moduleCount: number;
  quizCount: number;
}) {
  const supportMeta = [
    `${moduleCount} modules`,
    `${quizCount} quiz packs`,
    "Replay and review",
    `${lessonCount} lesson steps`,
  ];

  return (
    <section className="px-6 py-24">
      <div className="shell-width space-y-12">
        <Reveal className="max-w-[46rem] space-y-4" y={24}>
          <Badge>{copy.supportModes.eyebrow}</Badge>
          <h2 className="font-heading text-[2.35rem] font-black tracking-normal text-[#f3efe5] sm:text-[3.35rem] sm:leading-[0.95]">
            {copy.supportModes.title}
          </h2>
          <p className="max-w-[40rem] text-base leading-8 text-[#d9d5cb]/72 sm:text-lg">
            {copy.supportModes.description}
          </p>
        </Reveal>

        <div className="grid gap-4 lg:grid-cols-4">
          {copy.supportModes.items.map((item, index) => (
            <Reveal
              className="group relative overflow-hidden border border-white/9 bg-[linear-gradient(180deg,rgba(255,255,255,0.032),rgba(255,255,255,0.012))] px-5 py-6 transition hover:-translate-y-1 hover:border-[#f3c56f]/24"
              delay={index * 0.05}
              key={item.title}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,transparent,#f3c56f,transparent)] opacity-30" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#f3c56f]">
                {supportMeta[index]}
              </p>
              <h3 className="mt-4 font-heading text-[1.55rem] font-black tracking-normal text-[#f3efe5]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#d9d5cb]/70">{item.description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingHomeCtaSection({ copy }: { copy: HomeCopy }) {
  return (
    <section className="px-6 pb-10 pt-2 sm:pb-16">
      <div className="shell-width">
        <Reveal
          className="relative overflow-hidden border border-[#f3c56f]/22 bg-[linear-gradient(135deg,rgba(19,31,22,0.96),rgba(7,8,8,1)_58%,rgba(39,28,10,0.86))] px-7 py-12 shadow-[0_28px_96px_rgba(0,0,0,0.34)] sm:px-10 sm:py-14"
          y={20}
        >
          <div className="absolute inset-3 border border-white/6" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-[42rem] space-y-4">
              <Badge>{copy.cta.eyebrow}</Badge>
              <h2 className="font-heading text-[2.45rem] font-black tracking-normal text-[#f3efe5] sm:text-[3.6rem] sm:leading-[0.94]">
                {copy.cta.title}
              </h2>
              <p className="text-base leading-8 text-[#d9d5cb]/74 sm:text-lg">
                {copy.cta.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#f3c56f]/55 bg-[linear-gradient(180deg,#1d311f,#0a1711)] px-8 py-4 text-sm font-black uppercase tracking-[0.12em] !text-white transition hover:border-[#ffe0a0]/75"
                href={copy.cta.primaryCta.href}
              >
                {copy.cta.primaryCta.label}
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center border border-white/14 bg-black/32 px-8 py-4 text-sm font-black uppercase tracking-[0.12em] !text-white transition hover:border-[#f3c56f]/38"
                href={copy.cta.secondaryCta.href}
              >
                {copy.cta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
