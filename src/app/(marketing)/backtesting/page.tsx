import type { Metadata } from "next";

import { MarketingBacktestingPage } from "@/features/marketing/backtesting-page";

export const metadata: Metadata = {
  title: "Backtesting",
};

export default function BacktestingRoute() {
  return <MarketingBacktestingPage />;
}
