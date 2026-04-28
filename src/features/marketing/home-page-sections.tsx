import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/reveal";
import type { homeCopy } from "@/content/marketing/site-copy";

type HomeCopy = typeof homeCopy;

const featureGridTones = [
  {
    accent: "text-primary",
    rail: "border-primary/18 bg-primary/10 text-primary",
  },
  {
    accent: "text-[#b8f7d7]",
    rail: "border-[#b8f7d7]/18 bg-[#b8f7d7]/10 text-[#b8f7d7]",
  },
  {
    accent: "text-[#ffe08a]",
    rail: "border-[#ffe08a]/18 bg-[#ffe08a]/10 text-[#ffe08a]",
  },
  {
    accent: "text-[#8ed7ff]",
    rail: "border-[#8ed7ff]/18 bg-[#8ed7ff]/10 text-[#8ed7ff]",
  },
  {
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
    <section className="relative overflow-hidden px-6 pb-8 pt-8 sm:pt-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/new%20Hero%20title%20artwork.png')] bg-cover bg-[center_top] opacity-78"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.72)_43%,rgba(0,0,0,0.34)_72%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent,#000)]" />

      <div className="shell-width relative z-10 flex min-h-[34rem] flex-col justify-between gap-8 sm:min-h-[36rem] lg:min-h-[38rem]">
        <Reveal className="max-w-[46rem] pt-6 sm:pt-10" y={28}>
          <Badge>{copy.hero.eyebrow}</Badge>
          <h1 className="mt-6 max-w-full text-balance font-heading text-[3rem] font-black leading-[0.94] tracking-normal text-white sm:text-[5.4rem] sm:leading-[0.9] lg:text-[6.6rem]">
            {copy.hero.title === "localtradings.com" ? (
              <>
                <span>localtradings</span>
                <span className="block sm:inline">.com</span>
              </>
            ) : (
              copy.hero.title
            )}
          </h1>
          <p className="mt-5 max-w-[40rem] text-[1rem] leading-7 text-white/82 sm:text-[1.22rem] sm:leading-8">
            {copy.hero.description}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary min-h-12 px-7 text-sm sm:text-base" href={copy.hero.primaryCta.href}>
              {copy.hero.primaryCta.label}
            </Link>
            <Link className="btn-secondary min-h-12 border-white/16 bg-black/44 px-7 text-sm text-white sm:text-base" href={copy.hero.secondaryCta.href}>
              {copy.hero.secondaryCta.label}
            </Link>
          </div>
        </Reveal>

        <Reveal className="grid gap-2 border-y border-white/10 bg-black/38 py-3 backdrop-blur-md sm:grid-cols-5 sm:gap-0 sm:divide-x sm:divide-white/10 sm:px-2" delay={0.08} y={18}>
          {copy.hero.quickModes.map((item, index) => (
            <div className="px-3 py-2" key={item.label}>
              <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${index === 0 ? "text-[#6fffa4]" : "text-white/56"}`}>
                {item.label}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-white/82 sm:text-[13px]">
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
    <section className="px-6 py-16 sm:py-20">
      <div className="shell-width">
        <Reveal className="mb-8 grid gap-5 border-b border-outline-variant/18 pb-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-end" y={24}>
          <div>
            <Badge>Product map</Badge>
            <h2 className="mt-4 font-heading text-[2.25rem] font-black tracking-normal text-foreground sm:text-[3.15rem] sm:leading-[0.95]">
              The landing page matches the product.
            </h2>
          </div>
          <p className="max-w-[44rem] text-base leading-8 text-muted sm:text-lg">
            Battle is the lead mode, but the signed-in workspace also includes Learn,
            Quiz, Backtesting, Progress, and account state. No feature is advertised
            here unless it exists in the routes.
          </p>
        </Reveal>

        <div className="grid gap-0 overflow-hidden border border-outline-variant/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))] md:grid-cols-2 xl:grid-cols-5">
          {copy.featureGrid.map((item, index) => {
            const tone = featureGridTones[index];
            const meta = getFeatureMeta(item.title, moduleCount, lessonCount, quizCount);

            return (
              <Reveal
                className="border-b border-outline-variant/18 p-5 transition hover:bg-white/[0.035] md:border-r xl:min-h-[21rem] xl:border-b-0"
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
                      <h3 className="font-heading text-[1.85rem] font-black tracking-normal text-foreground sm:text-[2.1rem]">
                        {item.title}
                      </h3>
                      <p className="max-w-[34rem] text-sm leading-7 text-muted sm:text-[0.97rem]">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.points.map((point) => (
                        <span
                          className={`border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${tone.rail}`}
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
            <h2 className="max-w-[13ch] font-heading text-[2.45rem] font-black tracking-normal text-foreground sm:text-[3.55rem] sm:leading-[0.94]">
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
          <h2 className="font-heading text-[2.35rem] font-black tracking-normal text-foreground sm:text-[3.35rem] sm:leading-[0.95]">
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
              <h3 className="mt-4 font-heading text-[1.55rem] font-black tracking-normal text-foreground">
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
              <h2 className="font-heading text-[2.45rem] font-black tracking-normal text-foreground sm:text-[3.6rem] sm:leading-[0.94]">
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
