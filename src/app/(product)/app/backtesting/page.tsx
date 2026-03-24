import type { Metadata } from "next";

import { BacktestingWorkspace } from "@/features/backtesting/backtesting-workspace";

export const metadata: Metadata = {
  title: "Backtesting",
};

export default function ProductBacktestingRoute() {
  return <BacktestingWorkspace />;
}
