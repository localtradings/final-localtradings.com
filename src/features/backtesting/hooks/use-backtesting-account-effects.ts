"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";

import type { BacktestAccountState } from "@/features/backtesting/types";
import { createBalanceKey } from "@/features/backtesting/utils/workspace-helpers";
import { saveBacktestAccount } from "@/server/backtesting/account-actions";

export function useBacktestingAccountPersistence({
  account,
  persistedAccountRef,
  userId,
}: {
  account: BacktestAccountState;
  persistedAccountRef: MutableRefObject<BacktestAccountState>;
  userId?: string | null;
}) {
  useEffect(() => {
    if (!userId) {
      return;
    }

    if (
      account.startingBalance === persistedAccountRef.current.startingBalance &&
      account.currentBalance === persistedAccountRef.current.currentBalance &&
      account.defaultRiskPercent === persistedAccountRef.current.defaultRiskPercent
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveBacktestAccount(account);
      persistedAccountRef.current = account;
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [account, persistedAccountRef, userId]);
}

export function useBacktestingBalanceBroadcast({
  displayBalance,
  userId,
}: {
  displayBalance: number;
  userId?: string | null;
}) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = createBalanceKey(userId);
    window.localStorage.setItem(key, displayBalance.toString());
    window.dispatchEvent(
      new CustomEvent("backtesting:balance", {
        detail: {
          key,
          balance: displayBalance,
        },
      }),
    );
  }, [displayBalance, userId]);
}
