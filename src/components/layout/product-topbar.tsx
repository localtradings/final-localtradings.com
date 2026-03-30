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
      <div className="flex min-h-12 items-center justify-between gap-2.5 px-2.5 py-2 sm:px-4 lg:min-h-14 lg:px-6">
        <button
          aria-label="Search lessons or topics"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-outline-variant/15 bg-surface-high/60 text-muted sm:hidden"
          type="button"
        >
          <Search className="h-4 w-4" strokeWidth={2} />
        </button>
        <div className="relative hidden min-w-0 flex-1 items-center sm:flex">
          <Search
            className="pointer-events-none absolute left-3 h-4 w-4 text-muted"
            strokeWidth={2}
          />
          <input
            className="h-9 w-full rounded-[var(--radius-md)] border border-outline-variant/15 bg-surface-high/60 py-2 pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary/30 lg:h-10"
            id="product-topbar-search"
            name="product_topbar_search"
            placeholder="Search lessons or topics..."
            readOnly
            value=""
          />
        </div>
        <div className="flex items-center gap-2">
          {showBacktestBalance ? (
            <BacktestBalancePill
              className="h-9 px-2.5 text-[11px] sm:h-10 sm:px-3 sm:text-xs"
              initialBalance={accountBalance}
              userId={userId}
            />
          ) : null}
          <Link
            className="hidden h-9 items-center gap-2 rounded-full border border-outline/20 bg-surface-high/70 px-2.5 text-xs font-semibold text-foreground sm:inline-flex lg:h-10 lg:px-3 lg:text-sm"
            href="/app/profile"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-foreground lg:h-6 lg:w-6">
              <UserRound className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="max-w-28 truncate">{userLabel}</span>
          </Link>
          {authEnabled ? (
            <SignOutButton className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-outline/20 bg-surface-high px-2.5 text-xs font-semibold text-foreground transition hover:bg-surface-highest sm:px-3 lg:h-10 lg:px-4 lg:text-sm" />
          ) : null}
        </div>
        {!authEnabled ? (
          <div className="rounded-full border border-secondary/20 bg-secondary-container/50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Demo shell
          </div>
        ) : null}
      </div>
    </header>
  );
}
