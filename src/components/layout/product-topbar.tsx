import Link from "next/link";

import { SignOutButton } from "./sign-out-button";

type ProductTopbarProps = {
  userLabel: string;
  authEnabled: boolean;
};

export function ProductTopbar({
  userLabel,
  authEnabled,
}: ProductTopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/15 bg-background/85 backdrop-blur-xl">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-outline-variant/15 bg-surface-high/70 px-4 py-3">
          <span className="material-symbols-outlined text-muted">search</span>
          <span className="truncate text-sm text-muted">
            Search lessons, quizzes, and help topics
          </span>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-outline/20 bg-surface-high px-4 py-2 text-sm font-semibold text-foreground"
            href="/app/profile"
          >
            <span className="material-symbols-outlined text-base">person</span>
            {userLabel}
          </Link>
          {authEnabled ? <SignOutButton /> : null}
        </div>
        {!authEnabled ? (
          <div className="rounded-full border border-secondary/20 bg-secondary-container/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            Demo shell
          </div>
        ) : null}
      </div>
    </header>
  );
}
