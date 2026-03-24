import type { ReactNode } from "react";

import { BrandMark } from "./brand-mark";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="shell-width grid min-h-[calc(100vh-5rem)] items-center gap-10 py-12 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="space-y-8">
        <BrandMark />
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <span className="material-symbols-outlined text-base">lock</span>
            Secure account access
          </p>
          <h1 className="max-w-2xl text-balance font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted">
            {description}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            "Structured lessons for beginners",
            "Topic-based quizzes with results",
            "Backtesting practice without hype",
          ].map((item) => (
            <div
              className="rounded-[var(--radius-xl)] border border-outline/20 bg-surface-high/70 p-4 text-sm leading-6 text-muted"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="card-surface rounded-[var(--radius-xl)] p-6 sm:p-8">
        {children}
      </section>
    </div>
  );
}
