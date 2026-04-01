"use client";

import dynamic from "next/dynamic";

import type { BacktestAccountRecord, BacktestSessionRecord } from "../types";

type BacktestingClientShellProps = {
  initialAccount?: BacktestAccountRecord | null;
  initialSessions?: BacktestSessionRecord[];
  shareDisplayName: string;
  userId?: string | null;
};

const BacktestingClient = dynamic(
  () => import("./backtesting-client").then((module) => module.BacktestingClient),
  {
    ssr: false,
    loading: () => (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[0.75rem] bg-[#080d12] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ring-1 ring-white/5" />
    ),
  },
);

export function BacktestingClientShell({
  initialAccount,
  initialSessions,
  shareDisplayName,
  userId,
}: BacktestingClientShellProps) {
  return (
    <BacktestingClient
      initialAccount={initialAccount}
      initialSessions={initialSessions}
      shareDisplayName={shareDisplayName}
      userId={userId}
    />
  );
}
