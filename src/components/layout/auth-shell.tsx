import type { ReactNode } from "react";

import { authShellCopy, type AuthShellMode } from "@/content/marketing/auth-copy";

import { BrandMark } from "./brand-mark";
import { ImageSlider } from "../ui/image-slider";
import { Reveal } from "../ui/reveal";

type AuthShellProps = {
  mode: AuthShellMode;
  children: ReactNode;
};

export function AuthShell({ mode, children }: AuthShellProps) {
  const content = authShellCopy[mode];

  return (
    <div className="shell-width grid min-h-[calc(100vh-5rem)] gap-6 py-8 sm:py-10 lg:grid-cols-[1.12fr,0.88fr] lg:items-stretch lg:py-12">
      <section className="panel relative overflow-hidden rounded-[var(--radius-xl)]">
        <div className="absolute inset-0 hidden lg:block">
          <ImageSlider className="min-h-full" images={content.slides} interval={4600} />
        </div>
        <div className="absolute inset-0 hidden lg:block bg-[radial-gradient(circle_at_top_left,rgba(255,182,144,0.22),transparent_38%)]" />
        <div className="relative flex h-full min-h-[23rem] flex-col justify-between overflow-hidden rounded-[var(--radius-xl)] bg-[linear-gradient(180deg,rgba(20,19,17,0.9),rgba(20,19,17,0.75))] p-6 sm:p-8 lg:min-h-[42rem] lg:bg-transparent lg:p-10">
          <div className="absolute inset-0 -z-10 lg:hidden">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,182,144,0.24),transparent_40%),linear-gradient(180deg,rgba(54,52,49,0.9),rgba(20,19,17,1))]" />
          </div>
          <div className="space-y-6">
            <BrandMark />
            <div className="space-y-5">
              <Reveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-primary">
                  <span className="material-symbols-outlined text-base">shield_lock</span>
                  {content.eyebrow}
                </p>
              </Reveal>
              <Reveal delay={0.05}>
                <div className="space-y-4">
                  <h1 className="max-w-2xl text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    {content.title}
                  </h1>
                  <p className="max-w-xl text-sm leading-7 text-[color-mix(in_srgb,var(--foreground)_84%,var(--muted))] sm:text-base sm:leading-8">
                    {content.description}
                  </p>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal className="space-y-5" delay={0.12}>
            <div className="grid gap-3 sm:grid-cols-3">
              {content.highlights.map((item) => (
                <div
                  className="rounded-[var(--radius-lg)] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium leading-6 text-[color-mix(in_srgb,var(--foreground)_90%,var(--muted))] backdrop-blur-md"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {content.supportCards.map((item) => (
                <div
                  className="rounded-[var(--radius-lg)] border border-white/12 bg-black/25 px-4 py-4 backdrop-blur-md"
                  key={item.label}
                >
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-primary/85">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground sm:text-base">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      <section className="card-surface flex rounded-[var(--radius-xl)]">
        <div className="w-full rounded-[var(--radius-xl)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-highest)_82%,transparent),color-mix(in_srgb,var(--surface-low)_98%,transparent))] p-6 sm:p-8 lg:p-10">
          <Reveal className="mb-8 space-y-2">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">
              {content.panelTitle}
            </h2>
            <p className="max-w-md text-sm leading-7 text-muted">
              {content.panelDescription}
            </p>
          </Reveal>
          {children}
        </div>
      </section>
    </div>
  );
}
