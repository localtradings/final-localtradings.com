import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import type { homeCopy } from "@/content/marketing/site-copy";

type HomeCopy = typeof homeCopy;

const featureGridSpans = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
] as const;

const featureGridTones = [
  {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_46%),linear-gradient(180deg,rgba(11,15,12,0.98),rgba(8,8,8,1))]",
    accent: "text-primary",
    rail: "border-primary/18 bg-primary/10 text-primary",
  },
  {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(110,231,183,0.18),transparent_44%),linear-gradient(180deg,rgba(10,14,12,0.98),rgba(7,7,7,1))]",
    accent: "text-[#b8f7d7]",
    rail: "border-[#b8f7d7]/18 bg-[#b8f7d7]/10 text-[#b8f7d7]",
  },
  {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(163,230,53,0.16),transparent_48%),linear-gradient(180deg,rgba(12,15,10,0.98),rgba(8,8,8,1))]",
    accent: "text-[#c8f27d]",
    rail: "border-[#c8f27d]/18 bg-[#c8f27d]/10 text-[#c8f27d]",
  },
  {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.16),transparent_48%),linear-gradient(180deg,rgba(10,14,11,0.98),rgba(8,8,8,1))]",
    accent: "text-[#8ff0b3]",
    rail: "border-[#8ff0b3]/18 bg-[#8ff0b3]/10 text-[#8ff0b3]",
  },
  {
    shell: "bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_48%),linear-gradient(180deg,rgba(9,13,13,0.98),rgba(8,8,8,1))]",
    accent: "text-[#95f3e6]",
    rail: "border-[#95f3e6]/18 bg-[#95f3e6]/10 text-[#95f3e6]",
  },
] as const;

function getFeatureMeta(
  title: string,
  moduleCount: number,
  lessonCount: number,
  quizCount: number,
) {
  switch (title) {
    case "Battle":
      return "Private rooms • open rooms • results";
    case "Backtesting":
      return "Replay • planner • saved sessions";
    case "Learn":
      return `${moduleCount} modules • ${lessonCount} lessons`;
    case "Quiz":
      return `${quizCount} quiz packs • setup to results`;
    case "Progress":
      return "Dashboard • bookmarks • next actions";
    default:
      return null;
  }
}

export function MarketingHeroSection({ copy }: { copy: HomeCopy }) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-10 sm:pb-24 sm:pt-14">
      <div className="shell-width relative grid gap-12 xl:grid-cols-[minmax(0,1.04fr)_minmax(24rem,0.96fr)] xl:items-center">
        <Reveal className="space-y-8" y={28}>
          <div className="space-y-6">
            <Badge>{copy.hero.eyebrow}</Badge>
            <div className="space-y-5">
              <h1 className="max-w-[12ch] text-balance font-heading text-[3.15rem] font-black tracking-[-0.05em] text-foreground sm:text-[4.9rem] sm:leading-[0.92] lg:text-[5.75rem]">
                {copy.hero.title}
              </h1>
              <p className="max-w-[42rem] text-lg leading-8 text-muted sm:text-[1.18rem]">
                {copy.hero.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link className="btn-primary px-8 py-4 text-base" href={copy.hero.primaryCta.href}>
              {copy.hero.primaryCta.label}
            </Link>
            <Link className="btn-secondary px-8 py-4 text-base" href={copy.hero.secondaryCta.href}>
              {copy.hero.secondaryCta.label}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {copy.hero.quickModes.map((item, index) => (
              <div
                className="rounded-[1.1rem] border border-outline-variant/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4"
                key={item.label}
              >
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.24em] ${
                    index === 0 ? "text-primary" : "text-muted"
                  }`}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="relative" delay={0.08} y={36}>
          <div className="relative overflow-hidden rounded-[1.9rem] border border-outline-variant/20 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_34%),linear-gradient(180deg,rgba(9,12,10,0.98),rgba(5,5,5,1))] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.45)] sm:p-5">
            <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
            <div className="relative rounded-[1.45rem] border border-white/10 bg-black/45 p-4 backdrop-blur-[18px] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">
                    Battle room
                  </p>
                  <h2 className="mt-2 font-heading text-[1.45rem] font-black tracking-tight text-foreground">
                    Replay match live
                  </h2>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                  Countdown 00:42
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_13.5rem]">
                <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                      Shared replay
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      15m room
                    </span>
                  </div>
                  <div className="relative h-[15.5rem] overflow-hidden bg-[linear-gradient(180deg,#090909,#040404)]">
                    <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_srgb,var(--outline-variant)_22%,transparent)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_srgb,var(--outline-variant)_22%,transparent)_1px,transparent_1px)] bg-[size:2.7rem_2.7rem] opacity-70" />
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 520 270"
                    >
                      <path
                        d="M0 188 L46 174 L88 182 L132 148 L176 160 L219 132 L262 144 L310 103 L350 124 L392 96 L438 122 L474 90 L520 112"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="3"
                      />
                      <path
                        d="M0 210 L50 210 L86 196 L124 196 L160 182 L198 182 L236 154 L274 154 L312 172 L350 172 L388 142 L424 142 L462 120 L520 120"
                        fill="none"
                        stroke="#d5ffe5"
                        strokeDasharray="6 6"
                        strokeWidth="1.6"
                        opacity="0.6"
                      />
                    </svg>
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                      Entry locked
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      {["PLAN LONG", "PLAN SHORT", "EXIT"].map((label, index) => (
                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${
                            index === 0
                              ? "border border-primary/30 bg-primary/10 text-primary"
                              : "border border-white/10 bg-white/5 text-foreground"
                          }`}
                          key={label}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                      Players ready
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { name: "You", balance: "$100,800", leader: true },
                        { name: "Rico", balance: "$100,340", leader: false },
                        { name: "Aira", balance: "$99,920", leader: false },
                        { name: "Jules", balance: "$99,410", leader: false },
                      ].map(({ name, balance, leader }) => (
                        <div
                          className="flex items-center justify-between rounded-[0.95rem] border border-white/8 bg-black/35 px-3 py-2.5"
                          key={name}
                        >
                          <div>
                            <p className="text-sm font-semibold text-foreground">{name}</p>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
                              {leader ? "Current lead" : "In match"}
                            </p>
                          </div>
                          <span className="text-sm font-black text-primary">{balance}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                      Room rules
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["2% risk cap", "10% drawdown", "Results board"].map((item) => (
                        <span
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-foreground"
                          key={item}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    <section className="px-6 py-20 sm:py-24">
      <div className="shell-width">
        <Reveal className="mb-10 max-w-[48rem] space-y-4" y={24}>
          <Badge>What you can do here</Badge>
          <h2 className="font-heading text-[2.35rem] font-black tracking-tight text-foreground sm:text-[3.4rem] sm:leading-[0.95]">
            Battle is the headline.
            <br />
            The whole platform stays visible.
          </h2>
          <p className="max-w-[40rem] text-base leading-8 text-muted sm:text-lg">
            The landing page should feel like a product surface. These are the real
            things people can do once they step into localtradings.com.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-12">
          {copy.featureGrid.map((item, index) => {
            const tone = featureGridTones[index];
            const meta = getFeatureMeta(item.title, moduleCount, lessonCount, quizCount);

            return (
              <Reveal
                className={`${featureGridSpans[index]} overflow-hidden rounded-[1.65rem] border border-outline-variant/18 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-7 ${tone.shell}`}
                delay={index * 0.04}
                key={item.title}
              >
                <div className="flex h-full flex-col justify-between gap-8">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-[0.24em] ${tone.accent}`}>
                        {item.eyebrow}
                      </span>
                      {meta ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                          {meta}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-heading text-[1.85rem] font-black tracking-tight text-foreground sm:text-[2.1rem]">
                        {item.title}
                      </h3>
                      <p className="max-w-[34rem] text-sm leading-7 text-muted sm:text-[0.97rem]">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${tone.rail}`}
                          key={point}
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] ${tone.accent}`}
                    href={item.href}
                  >
                    {item.ctaLabel}
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
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
    <section className="border-y border-outline-variant/12 bg-surface-low/45 px-6 py-24 backdrop-blur-[2px]">
      <div className="shell-width grid gap-12 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] xl:items-center">
        <Reveal className="space-y-6" y={24}>
          <Badge>{copy.battleSpotlight.eyebrow}</Badge>
          <div className="space-y-4">
            <h2 className="max-w-[13ch] font-heading text-[2.45rem] font-black tracking-tight text-foreground sm:text-[3.55rem] sm:leading-[0.94]">
              {copy.battleSpotlight.title}
            </h2>
            <p className="max-w-[38rem] text-base leading-8 text-muted sm:text-lg">
              {copy.battleSpotlight.description}
            </p>
          </div>

          <div className="space-y-3">
            {copy.battleSpotlight.roomModes.map((item) => (
              <div
                className="rounded-[1.1rem] border border-outline-variant/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4"
                key={item.title}
              >
                <p className="text-sm font-black text-foreground">{item.title}</p>
                <p className="mt-1.5 text-sm leading-7 text-muted">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {copy.battleSpotlight.rules.map((rule) => (
              <div
                className="rounded-[1.05rem] border border-primary/14 bg-primary/10 px-4 py-3 text-sm leading-6 text-foreground"
                key={rule}
              >
                {rule}
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="overflow-hidden rounded-[1.7rem] border border-outline-variant/18 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_34%),linear-gradient(180deg,rgba(9,12,10,0.98),rgba(6,6,6,1))] p-4 shadow-[0_28px_88px_rgba(0,0,0,0.35)] sm:p-5" delay={0.06} y={30}>
          <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
            <div className="rounded-[1.25rem] border border-white/8 bg-white/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                Room types
              </p>
              <div className="mt-4 space-y-3">
                {[
                  ["Private", "Invite your own lobby"],
                  ["Open", "Join the room list"],
                  ["Results", "Review rank and balance"],
                ].map(([label, detail]) => (
                  <div
                    className="rounded-[0.95rem] border border-white/8 bg-black/35 px-3 py-3"
                    key={label}
                  >
                    <p className="text-sm font-black text-foreground">{label}</p>
                    <p className="mt-1 text-[12px] leading-6 text-muted">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-[0.95rem] border border-primary/18 bg-primary/10 px-3 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  Match spread
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  {battleDurationCount} battle lengths and open rooms up to {openRoomMaxPlayers} players.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                    Open room list
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                    Queue live
                  </span>
                </div>
                <div className="divide-y divide-white/8">
                  {[
                    ["London open", "15 min • 4/10 joined", "Join room"],
                    ["New York setup", "30 min • 3/6 joined", "View code"],
                    ["Risk sprint", "10 min • 2/4 joined", "Join room"],
                  ].map(([title, meta, action]) => (
                    <div className="flex items-center justify-between gap-4 px-4 py-3.5" key={title}>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-[12px] uppercase tracking-[0.16em] text-muted">
                          {meta}
                        </p>
                      </div>
                      <span className="rounded-full border border-primary/18 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.25rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]">
                <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted">
                    Recent results
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-sm font-black text-primary">
                        {rank}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
                          {status}
                        </p>
                      </div>
                      <span className="text-sm font-black text-foreground">{balance}</span>
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
          <h2 className="font-heading text-[2.35rem] font-black tracking-tight text-foreground sm:text-[3.35rem] sm:leading-[0.95]">
            {copy.supportModes.title}
          </h2>
          <p className="max-w-[40rem] text-base leading-8 text-muted sm:text-lg">
            {copy.supportModes.description}
          </p>
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-4">
          {copy.supportModes.items.map((item, index) => (
            <Reveal
              className="rounded-[1.45rem] border border-outline-variant/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-6"
              delay={index * 0.05}
              key={item.title}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
                {supportMeta[index]}
              </p>
              <h3 className="mt-4 font-heading text-[1.55rem] font-black tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted">{item.description}</p>
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
        <Reveal className="overflow-hidden rounded-[2rem] border border-outline-variant/18 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_36%),linear-gradient(180deg,rgba(9,12,10,0.98),rgba(6,6,6,1))] px-7 py-12 shadow-[0_28px_96px_rgba(0,0,0,0.34)] sm:px-10 sm:py-14" y={20}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-[42rem] space-y-4">
              <Badge>{copy.cta.eyebrow}</Badge>
              <h2 className="font-heading text-[2.45rem] font-black tracking-tight text-foreground sm:text-[3.6rem] sm:leading-[0.94]">
                {copy.cta.title}
              </h2>
              <p className="text-base leading-8 text-muted sm:text-lg">
                {copy.cta.description}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link className="btn-primary px-8 py-4 text-base" href={copy.cta.primaryCta.href}>
                {copy.cta.primaryCta.label}
              </Link>
              <Link className="btn-secondary px-8 py-4 text-base" href={copy.cta.secondaryCta.href}>
                {copy.cta.secondaryCta.label}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
