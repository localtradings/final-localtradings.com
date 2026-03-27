"use client";

import { useSyncExternalStore } from "react";

import type { BacktestAccountRecord, BacktestSessionRecord } from "../types";
import { BacktestingClient } from "./backtesting-client";

type BacktestingClientShellProps = {
  initialAccount?: BacktestAccountRecord | null;
  initialSessions?: BacktestSessionRecord[];
  shareDisplayName: string;
  userId?: string | null;
};

export function BacktestingClientShell({
  initialAccount,
  initialSessions,
  shareDisplayName,
  userId,
}: BacktestingClientShellProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-xl)] bg-[#080d12] ring-1 ring-white/5">
        <div className="shrink-0 border-b border-white/5 px-2 py-1.5">
          <div className="h-8 rounded-md bg-[#0d1319]" />
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="min-h-[24rem] rounded-[var(--radius-xl)] bg-[#060a0f]" />
          <div className="rounded-lg bg-[#090d12]" />
        </div>
      </div>
    );
  }

  return (
    <BacktestingClient
      initialAccount={initialAccount}
      initialSessions={initialSessions}
      shareDisplayName={shareDisplayName}
      userId={userId}
    />
  );
}
