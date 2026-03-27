"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, UserRound } from "lucide-react";

import { BacktestBalancePill } from "./backtest-balance-pill";
import { SignOutButton } from "./sign-out-button";

type ProductTopbarProps = {
  userLabel: string;
  authEnabled: boolean;
  accountBalance?: number | null;
  userId?: string | null;
};

export function ProductTopbar({
  userLabel,
  authEnabled,
  accountBalance,
  userId,
}: ProductTopbarProps) {
  const pathname = usePathname();
  const showBacktestBalance = pathname !== "/app/backtesting";

  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant/12 bg-background/82 backdrop-blur-xl">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
        <div className="relative flex min-w-0 flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
            strokeWidth={2}
          />
          <input
            className="h-10 w-full rounded-[var(--radius-md)] border border-outline-variant/15 bg-surface-high/60 py-2 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary/30"
            placeholder="Search lessons or topics..."
            readOnly
            value=""
          />
        </div>
        <div className="flex items-center gap-2.5">
          {showBacktestBalance ? (
            <BacktestBalancePill initialBalance={accountBalance} userId={userId} />
          ) : null}
          <Link
            className="hidden h-10 items-center gap-2 rounded-full border border-outline/20 bg-surface-high/70 px-3 text-sm font-semibold text-foreground sm:inline-flex"
            href="/app/profile"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-foreground">
              <UserRound className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="max-w-28 truncate">{userLabel}</span>
          </Link>
          {authEnabled ? <SignOutButton /> : null}
        </div>
        {!authEnabled ? (
          <div className="rounded-full border border-secondary/20 bg-secondary-container/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Demo shell
          </div>
        ) : null}
      </div>
    </header>
  );
}
