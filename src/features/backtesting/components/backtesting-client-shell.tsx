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

let backtestingShellMounted = false;

function subscribeToBacktestingShellMount(onStoreChange: () => void) {
  if (backtestingShellMounted) {
    return () => undefined;
  }

  const frame = window.requestAnimationFrame(() => {
    backtestingShellMounted = true;
    onStoreChange();
  });

  return () => window.cancelAnimationFrame(frame);
}

export function BacktestingClientShell({
  initialAccount,
  initialSessions,
  shareDisplayName,
  userId,
}: BacktestingClientShellProps) {
  const mounted = useSyncExternalStore(
    subscribeToBacktestingShellMount,
    () => backtestingShellMounted,
    () => false,
  );

  if (!mounted) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[0.75rem] bg-[#080d12] ring-1 ring-white/5">
        <div className="shrink-0 border-b border-white/8 px-3 py-2">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="flex flex-wrap gap-2">
              <div className="h-8 w-[8.5rem] rounded-sm bg-[#0d1319]" />
              <div className="h-8 w-[5.75rem] rounded-sm bg-[#0d1319]" />
              <div className="h-8 w-[5rem] rounded-sm bg-[#0d1319]" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:flex">
              <div className="col-span-3 h-8 w-full rounded-sm bg-[#0d1319] sm:w-[8rem]" />
              <div className="h-8 rounded-sm bg-[#0d1319] sm:w-[7rem]" />
              <div className="h-8 rounded-sm bg-[#0d1319] sm:w-[4.5rem]" />
              <div className="h-8 rounded-sm bg-[#0d1319] sm:w-[8rem]" />
            </div>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 px-3 py-2 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-h-[24rem] bg-[#060a0f]" />
          <div className="rounded-[0.6rem] bg-[#090d12]" />
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
