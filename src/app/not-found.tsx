import Link from "next/link";

import { SymbolIcon } from "@/components/ui/symbol-icon";

export default function NotFound() {
  return (
    <main className="theme-marketing min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-[var(--radius-xl)] border border-outline/30 bg-surface/90 p-10 shadow-2xl shadow-black/40">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          <SymbolIcon name="error" className="text-base" />
          Page not found
        </div>
        <div className="space-y-4">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">
            This route is not part of localtradings.com v1.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted">
            The current launch scope focuses on Learn, Quiz, and Backtesting.
            Community, wallets, notifications, and other excluded routes are not
            shipped.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="btn-primary" href="/">
            Go home
          </Link>
          <Link className="btn-secondary" href="/help">
            Get help
          </Link>
        </div>
      </div>
    </main>
  );
}
