"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CircleDollarSign } from "lucide-react";

import { cn } from "@/lib/utils";

type BacktestBalancePillProps = {
  initialBalance?: number | null;
  userId?: string | null;
  className?: string;
};

function createBalanceKey(userId?: string | null) {
  return `backtesting-balance:${userId ?? "guest"}`;
}

function readStoredBalance(userId?: string | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(createBalanceKey(userId));
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function BacktestBalancePill({
  initialBalance,
  userId,
  className,
}: BacktestBalancePillProps) {
  const balance = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const key = createBalanceKey(userId);

      function handleBalanceChange(event: Event) {
        const customEvent = event as CustomEvent<{ key?: string }>;
        if (customEvent.detail?.key === key) {
          onStoreChange();
        }
      }

      function handleStorage(event: StorageEvent) {
        if (event.key === key) {
          onStoreChange();
        }
      }

      window.addEventListener("backtesting:balance", handleBalanceChange as EventListener);
      window.addEventListener("storage", handleStorage);

      return () => {
        window.removeEventListener(
          "backtesting:balance",
          handleBalanceChange as EventListener,
        );
        window.removeEventListener("storage", handleStorage);
      };
    },
    () => {
      const stored = readStoredBalance(userId);
      return stored ?? initialBalance ?? null;
    },
    () => initialBalance ?? null,
  );

  const formattedBalance = useMemo(() => {
    if (typeof balance !== "number") {
      return null;
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(balance);
  }, [balance]);

  if (!formattedBalance) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border border-[#22c55e]/20 bg-[#22c55e]/10 px-3 text-xs font-semibold text-[#b8f5c9]",
        className,
      )}
    >
      <CircleDollarSign className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">Balance</span>
      <span>{formattedBalance}</span>
    </div>
  );
}
